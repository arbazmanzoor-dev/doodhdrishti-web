"""DoodhDrishti backend API.

A small JSON API for the web app, built on Python's standard-library HTTP server.
Data lives in one JSON file (server/data/db.json) and uploaded photos in
server/uploads/. Both are created on first run and are not committed to Git.

Run:  python server/main.py            (see README "Running the Backend")
      python server/main.py --reseed   (rebuild the demo samples for today)
"""
from __future__ import annotations

import argparse
import base64
import hashlib
import hmac
import io
import json
import os
import random
import re
import secrets
import sys
import threading
import time
import urllib.parse
import uuid
from datetime import date, datetime, timedelta, timezone
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from typing import Any, Dict, List, Optional, Tuple

import numpy as np
from PIL import Image, UnidentifiedImageError

HERE = os.path.dirname(os.path.abspath(__file__))
PORT = int(os.environ.get("PORT", "8000"))
DB_FILE = os.environ.get("DD_DB_FILE", os.path.join(HERE, "data", "db.json"))
UPLOAD_DIR = os.environ.get("DD_UPLOAD_DIR", os.path.join(HERE, "uploads"))
DEV_MODE = os.environ.get("DD_DEV", "0") == "1"
TOKEN_DAYS = int(os.environ.get("DD_TOKEN_DAYS", "7"))
MAX_UPLOAD_BYTES = 10 * 1024 * 1024
MAX_JSON_BYTES = 64 * 1024

IST = timezone(timedelta(hours=5, minutes=30))
ROLES = {"centre_operator", "cooperative_admin", "food_safety_officer"}
MILK_TYPES = {"cow", "buffalo", "mixed"}
EMAIL_RE = re.compile(r"^[^\s@]+@[^\s@]+\.[^\s@]{2,}$")
MIN_PASSWORD = 8
PBKDF2_ROUNDS = 200_000

# Created for every new database so the team and judges can sign in straight away.
DEMO_ACCOUNT = {"email": "demo@doodhdrishti.in", "password": "demo1234", "name": "Demo Officer", "role": "cooperative_admin"}


def _jwt_secret() -> str:
    secret = os.environ.get("DD_JWT_SECRET")
    if secret:
        return secret
    if DEV_MODE:
        print("! DD_JWT_SECRET is not set; using a development secret. Never do this in production.")
        return "doodhdrishti-dev-only-secret"
    sys.exit("DD_JWT_SECRET is not set. Set it to a long random string, or set DD_DEV=1 for local development.")


JWT_SECRET = ""  # set in main()


class ApiError(Exception):
    def __init__(self, status: int, message: str):
        super().__init__(message)
        self.status = status
        self.message = message


# ---------- Helpers ----------
def round1(n: float) -> float:
    return round(n * 10) / 10.0


def now_utc_iso() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="seconds").replace("+00:00", "Z")


def parse_iso(iso_str: str) -> datetime:
    return datetime.fromisoformat(iso_str.replace("Z", "+00:00"))


def ist_day(iso_str: str) -> str:
    """Calendar day in India for a UTC timestamp, as YYYY-MM-DD."""
    return parse_iso(iso_str).astimezone(IST).strftime("%Y-%m-%d")


def today_ist() -> date:
    return datetime.now(IST).date()


def verdict_for(water: float, starch: float) -> str:
    if water >= 12 or starch >= 1.5:
        return "adulterated"
    if water >= 5 or starch >= 0.6:
        return "suspicious"
    return "pure"


def sample_image(water: float, starch: float) -> str:
    """Illustrative SVG for demo samples that have no real photo."""
    opacity = max(0.35, 1.0 - water / 30.0)
    tint = "#F4EFD8" if starch > 1 else "#FBFBFF"
    svg = f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 240">
<defs><radialGradient id="g" cx="50%" cy="40%" r="70%"><stop offset="0" stop-color="#3a3670"/><stop offset="1" stop-color="#14122e"/></radialGradient>
<linearGradient id="beam" x1="0" x2="1"><stop offset="0" stop-color="#ffb347" stop-opacity="0.9"/><stop offset="1" stop-color="#ffb347" stop-opacity="{water / 25:.2f}"/></linearGradient></defs>
<rect width="320" height="240" fill="url(#g)"/>
<rect x="0" y="112" width="320" height="10" fill="url(#beam)"/>
<rect x="120" y="40" width="80" height="170" rx="10" fill="{tint}" fill-opacity="{opacity:.2f}" stroke="#cfcde8" stroke-width="3"/>
<ellipse cx="160" cy="117" rx="{30 * opacity:.0f}" ry="{18 * opacity:.0f}" fill="#fff" fill-opacity="0.55"/>
</svg>"""
    return f"data:image/svg+xml;utf8,{urllib.parse.quote(svg)}"


# ---------- Passwords & tokens ----------
def hash_password(password: str, salt: Optional[str] = None) -> Tuple[str, str]:
    salt = salt or secrets.token_hex(16)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt.encode("utf-8"), PBKDF2_ROUNDS)
    return salt, digest.hex()


def check_password(password: str, user: Dict[str, Any]) -> bool:
    _, digest = hash_password(password, user["salt"])
    return hmac.compare_digest(digest, user["hash"])


def _b64(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).decode("ascii").rstrip("=")


def _unb64(text: str) -> bytes:
    return base64.urlsafe_b64decode(text + "=" * (-len(text) % 4))


def sign_token(user: Dict[str, Any]) -> str:
    payload = _b64(json.dumps({"sub": user["email"], "exp": int(time.time()) + TOKEN_DAYS * 86400}).encode("utf-8"))
    sig = _b64(hmac.new(JWT_SECRET.encode("utf-8"), payload.encode("ascii"), hashlib.sha256).digest())
    return f"{payload}.{sig}"


def token_email(auth_header: Optional[str]) -> Optional[str]:
    """Return the signed-in email for a valid, unexpired Bearer token, else None."""
    if not auth_header or not auth_header.startswith("Bearer "):
        return None
    parts = auth_header[7:].strip().split(".")
    if len(parts) != 2:
        return None
    payload, sig = parts
    expected = _b64(hmac.new(JWT_SECRET.encode("utf-8"), payload.encode("ascii"), hashlib.sha256).digest())
    if not hmac.compare_digest(sig, expected):
        return None
    try:
        data = json.loads(_unb64(payload))
    except (ValueError, json.JSONDecodeError):
        return None
    if int(data.get("exp", 0)) < time.time():
        return None
    return data.get("sub")


def public_user(email: str, u: Dict[str, Any]) -> Dict[str, Any]:
    return {"id": u["id"], "name": u["name"], "email": email, "role": u["role"], "centre_id": u.get("centre_id")}


# ---------- Database (single JSON file, guarded by one lock) ----------
DB_LOCK = threading.RLock()
DB: Dict[str, Any] = {}


def build_demo_samples(centres, farmers, risk_of, farmer_bias, rng: random.Random, start_seq: int = 1) -> Tuple[List[Dict[str, Any]], int]:
    """45 days of demo samples ending today (India time). Collection windows are 5-9am and 5-8pm IST."""
    now = datetime.now(IST)
    days = 45
    seq = start_seq
    samples = []
    for d in range(days - 1, -1, -1):
        day = now - timedelta(days=d)
        count = round(34 + (days - d) * 0.5 + rng.random() * 14 - (12 if day.weekday() == 6 else 0))
        for _ in range(count):
            farmer = rng.choice(farmers)
            centre = next(c for c in centres if c["id"] == farmer["centre_id"])
            hour = (5 + rng.random() * 4) if rng.random() < 0.6 else (17 + rng.random() * 3)
            ts = day.replace(hour=int(hour), minute=int(rng.random() * 60), second=int(rng.random() * 60), microsecond=0)
            if ts > now:
                ts = now - timedelta(seconds=int(rng.random() * 3600))

            risk = risk_of.get(centre["id"], 0.3)
            bias = farmer_bias.get(farmer["id"], 0.5)
            roll = rng.random()
            badness = risk * 0.6 + bias * 0.4
            if roll < 1 - badness * 0.6:
                water = rng.random() * 4.5
            elif roll < 1 - badness * 0.22:
                water = 5 + rng.random() * 7
            else:
                water = 12 + rng.random() * 18
            starch = (0.6 + rng.random() * 2) if rng.random() < (0.03 + risk * 0.08) else (rng.random() * 0.4)
            water_r, starch_r = round1(water), round1(starch)
            samples.append({
                "id": f"s{seq:05d}",
                "farmer_id": farmer["id"],
                "farmer_name": farmer["name"],
                "centre_id": centre["id"],
                "centre_name": centre["name"],
                "water_pct": water_r,
                "starch_pct": starch_r,
                "verdict": verdict_for(water_r, starch_r),
                "confidence": round((0.82 + rng.random() * 0.17) * 100) / 100.0,
                "image_url": None,
                "created_at": ts.astimezone(timezone.utc).isoformat(timespec="seconds").replace("+00:00", "Z"),
                "seeded": True,
            })
            seq += 1
    samples.sort(key=lambda s: s["created_at"], reverse=True)
    return samples, seq


CENTRE_SEED = [
    ("c01", "Mandya Milk Union – Maddur", "Mandya", 12.5847, 77.0435, 0.15),
    ("c02", "Mysuru Dairy – Nanjangud", "Mysuru", 12.1203, 76.6828, 0.10),
    ("c03", "Hassan Co-op – Arsikere", "Hassan", 13.3139, 76.2569, 0.35),
    ("c04", "Tumakuru Union – Tiptur", "Tumakuru", 13.2569, 76.4776, 0.45),
    ("c05", "Kolar Milk Union – Malur", "Kolar", 13.0037, 77.9384, 0.60),
    ("c06", "Chikkaballapur – Gauribidanur", "Chikkaballapur", 13.6114, 77.5171, 0.30),
    ("c07", "Ramanagara – Channapatna", "Ramanagara", 12.6518, 77.2089, 0.20),
    ("c08", "Dharwad Union – Hubballi", "Dharwad", 15.3647, 75.1240, 0.50),
    ("c09", "Belagavi Co-op – Gokak", "Belagavi", 16.1691, 74.8239, 0.70),
    ("c10", "Shivamogga Union – Bhadravati", "Shivamogga", 13.8483, 75.7051, 0.25),
    ("c11", "Ballari Co-op – Hosapete", "Ballari", 15.2689, 76.3909, 0.55),
    ("c12", "Davanagere Union – Harihar", "Davanagere", 14.5132, 75.8072, 0.40),
]


def _demo_inputs(rng: random.Random):
    risk_of, centres = {}, []
    for idx, (cid, name, district, lat, lng, risk) in enumerate(CENTRE_SEED):
        risk_of[cid] = risk
        centres.append({"id": cid, "name": name, "district": district, "lat": lat, "lng": lng, "active": idx != 6})
    first_names = ["Ramesh", "Lakshmi", "Manjunath", "Shivamma", "Basavaraj", "Geetha", "Nagaraj", "Savitri", "Mahesh",
                   "Kavya", "Suresh", "Parvati", "Venkatesh", "Anitha", "Prakash", "Sharada", "Ravi", "Yashoda",
                   "Mallikarjun", "Rekha", "Siddappa", "Bhagya", "Chandru", "Nirmala"]
    last_names = ["Gowda", "Patil", "Naik", "Hegde", "Reddy", "Shetty", "Kulkarni", "Swamy", "Murthy", "Desai"]
    villages = ["Hosahalli", "Kodihalli", "Bidadi", "Kunigal", "Halebeedu", "Belur", "Sira", "Kadur", "Hunsur", "Sagar",
                "Gundlupet", "Koppa"]
    farmers, farmer_bias = [], {}
    for i in range(48):
        centre = centres[i % len(centres)]
        fid = f"f{i + 1:03d}"
        farmers.append({
            "id": fid,
            "name": f"{first_names[i % len(first_names)]} {rng.choice(last_names)}",
            "village": rng.choice(villages),
            "centre_id": centre["id"],
            "phone": f"+91 9{int(100000000 + rng.random() * 899999999)}",
        })
        farmer_bias[fid] = rng.random()
    return centres, farmers, risk_of, farmer_bias


def build_initial_db() -> Dict[str, Any]:
    rng = random.Random(20261022)
    centres, farmers, risk_of, farmer_bias = _demo_inputs(rng)
    samples, next_seq = build_demo_samples(centres, farmers, risk_of, farmer_bias, rng)
    salt, digest = hash_password(DEMO_ACCOUNT["password"])
    users = {DEMO_ACCOUNT["email"]: {"id": "u001", "name": DEMO_ACCOUNT["name"], "role": DEMO_ACCOUNT["role"],
                                     "centre_id": "c01", "salt": salt, "hash": digest}}
    return {"version": 2, "centres": centres, "farmers": farmers, "samples": samples, "pending": {},
            "next_id": next_seq, "users": users}


def reseed_samples(db: Dict[str, Any]) -> None:
    """Replace the demo samples with fresh ones ending today. Real (non-demo) samples are kept."""
    rng = random.Random(int(time.time()))
    _, _, risk_of, farmer_bias = _demo_inputs(random.Random(20261022))
    real = [s for s in db["samples"] if not s.get("seeded")]
    demo, next_seq = build_demo_samples(db["centres"], db["farmers"], risk_of, farmer_bias, rng, db["next_id"])
    db["samples"] = sorted(real + demo, key=lambda s: s["created_at"], reverse=True)
    db["next_id"] = next_seq


def save_db() -> None:
    """Write atomically: a crash mid-write leaves the previous file intact. Raises on failure."""
    os.makedirs(os.path.dirname(DB_FILE), exist_ok=True)
    tmp = f"{DB_FILE}.tmp"
    with open(tmp, "w", encoding="utf-8") as f:
        json.dump(DB, f)
        f.flush()
        os.fsync(f.fileno())
    os.replace(tmp, DB_FILE)


def load_db() -> Dict[str, Any]:
    if not os.path.exists(DB_FILE):
        print(f"No database at {DB_FILE}; creating demo data.")
        return build_initial_db()
    try:
        with open(DB_FILE, "r", encoding="utf-8") as f:
            data = json.load(f)
    except (OSError, json.JSONDecodeError) as exc:
        broken = f"{DB_FILE}.corrupt-{datetime.now():%Y%m%d-%H%M%S}"
        os.replace(DB_FILE, broken)
        sys.exit(f"Could not read the database ({exc}). It was moved to {broken} so nothing is lost. "
                 "Fix or delete it, then start again.")
    # Older databases (before accounts existed) get the demo account and the new fields.
    data.setdefault("users", {})
    if DEMO_ACCOUNT["email"] not in data["users"]:
        salt, digest = hash_password(DEMO_ACCOUNT["password"])
        data["users"][DEMO_ACCOUNT["email"]] = {"id": "u001", "name": DEMO_ACCOUNT["name"], "role": DEMO_ACCOUNT["role"],
                                                "centre_id": "c01", "salt": salt, "hash": digest}
    if data.get("version", 1) < 2:
        for s in data["samples"]:
            # Old samples with inline base64 photos are user data; everything else came from the seed.
            s.setdefault("seeded", not str(s.get("image_url") or "").startswith("data:image/jpeg"))
        data["version"] = 2
    return data


def maybe_refresh_demo(db: Dict[str, Any]) -> None:
    """If only demo data exists and it is more than a week old, rebuild it so the charts aren't empty."""
    if not db["samples"] or any(not s.get("seeded") for s in db["samples"]):
        return
    newest = max(parse_iso(s["created_at"]) for s in db["samples"])
    if datetime.now(timezone.utc) - newest > timedelta(days=7):
        print("Demo data is more than a week old; rebuilding it for today.")
        reseed_samples(db)


# ---------- Photo analysis ----------
def _otsu(values: np.ndarray) -> float:
    hist, _ = np.histogram(values, bins=256, range=(0, 256))
    total = hist.sum()
    if total == 0:
        return 255.0
    levels = np.arange(256)
    w_b = np.cumsum(hist)
    w_f = total - w_b
    sum_b = np.cumsum(hist * levels)
    mean_b = np.divide(sum_b, w_b, out=np.zeros(256), where=w_b > 0)
    mean_f = np.divide(sum_b[-1] - sum_b, w_f, out=np.zeros(256), where=w_f > 0)
    between = w_b * w_f * (mean_b - mean_f) ** 2
    return float(np.argmax(between))


def analyse_image_bytes(raw: bytes) -> Dict[str, float]:
    """Rough brightness rule on the milk surface. Same method as the web app's demo mode, so both agree.

    Not a trained model: the ML pipeline (doodhdrishti-ml) replaces this once it has enough photos.
    """
    try:
        img = Image.open(io.BytesIO(raw))
        img.load()
    except (UnidentifiedImageError, OSError) as exc:
        raise ApiError(422, "Could not read this image. Try a clear JPG or PNG photo.") from exc
    img = img.convert("RGB")
    img.thumbnail((200, 200))
    rgb = np.asarray(img, dtype=np.float32)
    gray = 0.2126 * rgb[..., 0] + 0.7152 * rgb[..., 1] + 0.0722 * rgb[..., 2]

    # Lit container vs black background, then milk surface vs container walls.
    t1 = _otsu(gray.ravel())
    lit = gray > t1
    t2 = _otsu(gray[lit]) if lit.any() else 255.0
    milk = lit & (gray > t2)
    if milk.sum() < gray.size * 0.01:
        raise ApiError(422, "Couldn't find the milk in this photo. Take it from above, flash on, on a dark background.")

    ys, xs = np.nonzero(milk)
    cy, cx = ys.mean(), xs.mean()
    r = np.sqrt(milk.sum() / np.pi) * 0.7
    yy, xx = np.indices(gray.shape)
    roi = milk & ((yy - cy) ** 2 + (xx - cx) ** 2 <= r * r)
    if roi.sum() < 30:
        roi = milk
    vals = gray[roi]
    vals = vals[vals <= np.percentile(vals, 99)]  # drop glare / bubbles

    brightness = float(vals.mean()) / 255.0
    if brightness < 0.3:
        raise ApiError(422, "Couldn't find the milk in this photo. Take it from above, flash on, on a dark background.")
    water = min(35.0, max(0.0, (0.8 - brightness) * 60))
    starch = 0.0  # colour alone can't measure starch
    confidence = 0.6 + min(0.3, abs(water - 5) / 40)
    return {"water": round1(water), "starch": starch, "confidence": round(confidence * 100) / 100.0}


def save_upload(raw: bytes, mime: str) -> str:
    """Save a photo under a random name; return the path stored in the database."""
    ext = {"image/png": ".png", "image/webp": ".webp"}.get(mime, ".jpg")
    os.makedirs(UPLOAD_DIR, exist_ok=True)
    name = f"{uuid.uuid4().hex}{ext}"
    with open(os.path.join(UPLOAD_DIR, name), "wb") as f:
        f.write(raw)
    return f"/uploads/{name}"


# ---------- Request parsing ----------
def parse_multipart(body: bytes, content_type: str) -> Tuple[Dict[str, str], Dict[str, Tuple[str, str, bytes]]]:
    match = re.search(r"boundary=([^;\s]+)", content_type)
    if not match:
        raise ApiError(400, "Missing multipart boundary.")
    boundary = match.group(1).strip('"').encode("utf-8")
    fields: Dict[str, str] = {}
    files: Dict[str, Tuple[str, str, bytes]] = {}
    for part in body.split(b"--" + boundary)[1:]:
        if part.startswith(b"--") or not part.strip():
            continue
        if part.startswith(b"\r\n"):
            part = part[2:]
        if part.endswith(b"\r\n"):
            part = part[:-2]
        header_end = part.find(b"\r\n\r\n")
        if header_end == -1:
            continue
        raw_headers = part[:header_end].decode("utf-8", errors="replace")
        content = part[header_end + 4:]
        name_match = re.search(r'name="([^"]+)"', raw_headers)
        if not name_match:
            continue
        filename_match = re.search(r'filename="([^"]*)"', raw_headers)
        ctype_match = re.search(r"Content-Type:\s*([^\r\n]+)", raw_headers, re.IGNORECASE)
        if filename_match:
            mime = ctype_match.group(1).strip() if ctype_match else "application/octet-stream"
            files[name_match.group(1)] = (filename_match.group(1), mime, content)
        else:
            fields[name_match.group(1)] = content.decode("utf-8", errors="replace")
    return fields, files


def int_param(qs: Dict[str, List[str]], name: str, default: int, lo: int, hi: int) -> int:
    raw = qs.get(name, [None])[0]
    if raw in (None, ""):
        return default
    try:
        value = int(raw)
    except ValueError as exc:
        raise ApiError(400, f"'{name}' must be a whole number.") from exc
    if not lo <= value <= hi:
        raise ApiError(400, f"'{name}' must be between {lo} and {hi}.")
    return value


def date_param(qs: Dict[str, List[str]], name: str) -> Optional[str]:
    raw = qs.get(name, [None])[0]
    if not raw:
        return None
    try:
        return date.fromisoformat(raw).isoformat()
    except ValueError as exc:
        raise ApiError(400, f"'{name}' must be a date like 2026-10-31.") from exc


def summarise_farmer(farmer_id: str) -> Optional[Dict[str, Any]]:
    farmer = next((f for f in DB["farmers"] if f["id"] == farmer_id), None)
    if not farmer:
        return None
    fs_samples = [s for s in DB["samples"] if s["farmer_id"] == farmer_id]
    total = len(fs_samples)
    pure = sum(1 for s in fs_samples if s["verdict"] == "pure")
    return {
        **farmer,
        "total_samples": total,
        "pure_pct": round1((pure / (total or 1)) * 100.0),
        "last_test_at": fs_samples[0]["created_at"] if fs_samples else None,
        "trend": [s["water_pct"] for s in reversed(fs_samples[:12])],
    }


# ---------- HTTP handler ----------
class DoodhDrishtiHandler(BaseHTTPRequestHandler):
    server_version = "DoodhDrishti/2.0"
    _body: Optional[bytes] = None  # request body, read before taking the database lock

    # -- responses --
    def _send_cors(self) -> None:
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Authorization, Content-Type, Accept")

    def _send_json(self, status: int, payload: Any) -> None:
        raw = json.dumps(payload).encode("utf-8")
        self.send_response(status)
        self._send_cors()
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(raw)))
        self.end_headers()
        self.wfile.write(raw)

    def _send_error_json(self, status: int, message: str) -> None:
        self._send_json(status, {"message": message, "detail": message})

    def _base_url(self) -> str:
        host = self.headers.get("Host") or f"localhost:{PORT}"
        return f"http://{host}"

    def _out(self, sample: Dict[str, Any]) -> Dict[str, Any]:
        """Sample as sent to the client: absolute photo URL, demo picture if none, internal fields removed."""
        out = {k: v for k, v in sample.items() if k != "seeded"}
        url = out.get("image_url")
        if not url:
            out["image_url"] = sample_image(out["water_pct"], out["starch_pct"])
        elif url.startswith("/uploads/"):
            out["image_url"] = self._base_url() + url
        return out

    def _require_auth(self) -> str:
        email = token_email(self.headers.get("Authorization"))
        if not email or email not in DB["users"]:
            raise ApiError(401, "Your session has expired. Please sign in again.")
        return email

    def _read_body(self, limit: int) -> bytes:
        if self._body is not None:
            return self._body
        try:
            length = int(self.headers.get("Content-Length", "0"))
        except ValueError as exc:
            raise ApiError(400, "Invalid Content-Length header.") from exc
        if length > limit:
            # Read and discard the upload (up to a hard cap) so the client receives this error
            # instead of a reset connection; beyond the cap, just close.
            if length <= 5 * limit:
                remaining = length
                while remaining > 0:
                    chunk = self.rfile.read(min(65536, remaining))
                    if not chunk:
                        break
                    remaining -= len(chunk)
            else:
                self.close_connection = True
            raise ApiError(413, f"Photo is too large (limit {limit // (1024 * 1024) or 1} MB).")
        return self.rfile.read(length) if length > 0 else b""

    def _read_json(self) -> Dict[str, Any]:
        try:
            data = json.loads(self._read_body(MAX_JSON_BYTES).decode("utf-8") or "{}")
        except (UnicodeDecodeError, json.JSONDecodeError) as exc:
            raise ApiError(400, "Invalid JSON payload.") from exc
        if not isinstance(data, dict):
            raise ApiError(400, "Invalid JSON payload.")
        return data

    def _dispatch(self, method) -> None:
        try:
            with DB_LOCK:
                method()
        except ApiError as e:
            self._send_error_json(e.status, e.message)
        except Exception as e:  # never leave the browser with a dropped connection
            self.log_error("Unhandled error: %r", e)
            self._send_error_json(500, "Something went wrong on the server.")

    def do_OPTIONS(self) -> None:
        self.send_response(204)
        self._send_cors()
        self.end_headers()

    def do_GET(self) -> None:
        self._dispatch(self._get)

    def do_POST(self) -> None:
        # Receive the (possibly large) upload before taking the lock, so one slow
        # phone connection doesn't hold up everyone else.
        path = urllib.parse.urlparse(self.path).path.rstrip("/")
        try:
            self._body = self._read_body(MAX_UPLOAD_BYTES if path == "/predict" else MAX_JSON_BYTES)
        except ApiError as e:
            self._send_error_json(e.status, e.message)
            return
        self._dispatch(self._post)

    # -- GET routes --
    def _get(self) -> None:
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path.rstrip("/") or "/"
        qs = urllib.parse.parse_qs(parsed.query)

        if path in ("/", "/health"):
            self._send_json(200, {"status": "ok", "service": "DoodhDrishti API", "samples": len(DB["samples"])})
            return

        # Photos are public by random filename so <img> tags can load them without a token.
        m_upload = re.match(r"^/uploads/([0-9a-f]{32}\.(?:jpg|png|webp))$", path)
        if m_upload:
            file_path = os.path.join(UPLOAD_DIR, m_upload.group(1))
            if not os.path.isfile(file_path):
                raise ApiError(404, "Photo not found.")
            with open(file_path, "rb") as f:
                raw = f.read()
            ctype = {"png": "image/png", "webp": "image/webp"}.get(file_path.rsplit(".", 1)[1], "image/jpeg")
            self.send_response(200)
            self._send_cors()
            self.send_header("Content-Type", ctype)
            self.send_header("Content-Length", str(len(raw)))
            self.send_header("Cache-Control", "public, max-age=86400")
            self.end_headers()
            self.wfile.write(raw)
            return

        self._require_auth()

        if path == "/samples":
            from_ = date_param(qs, "from")
            to = date_param(qs, "to")
            centre_id = qs.get("centre_id", [None])[0]
            verdict = qs.get("verdict", [None])[0]
            term = (qs.get("q", [""])[0] or "").strip().lower()
            page = int_param(qs, "page", 1, 1, 100_000)
            page_size = int_param(qs, "page_size", 15, 0, 100)  # 0 = everything (CSV export)
            filtered = []
            for s in DB["samples"]:
                day = ist_day(s["created_at"])
                if from_ and day < from_:
                    continue
                if to and day > to:
                    continue
                if centre_id and s["centre_id"] != centre_id:
                    continue
                if verdict and s["verdict"] != verdict:
                    continue
                if term and term not in s["farmer_name"].lower() and term not in s["farmer_id"].lower():
                    continue
                filtered.append(s)
            items = filtered[(page - 1) * page_size: page * page_size] if page_size > 0 else filtered
            self._send_json(200, {"items": [self._out(x) for x in items], "total": len(filtered)})
            return

        m_sample = re.match(r"^/samples/([^/]+)$", path)
        if m_sample:
            sid = urllib.parse.unquote(m_sample.group(1))
            sample = next((s for s in DB["samples"] if s["id"] == sid), None) or DB["pending"].get(sid)
            if not sample:
                raise ApiError(404, "Sample not found.")
            self._send_json(200, self._out(sample))
            return

        if path == "/farmers":
            self._send_json(200, [summarise_farmer(f["id"]) for f in DB["farmers"]])
            return

        m_farmer = re.match(r"^/farmers/([^/]+)$", path)
        if m_farmer:
            fid = urllib.parse.unquote(m_farmer.group(1))
            summary = summarise_farmer(fid)
            if not summary:
                raise ApiError(404, "Farmer not found.")
            centre = next((c for c in DB["centres"] if c["id"] == summary["centre_id"]), None)
            self._send_json(200, {
                **summary,
                "centre_name": centre["name"] if centre else "—",
                "samples": [self._out(s) for s in DB["samples"] if s["farmer_id"] == fid],
            })
            return

        if path == "/centres":
            self._send_json(200, DB["centres"])
            return

        if path == "/stats/summary":
            samples, centres = DB["samples"], DB["centres"]
            today = today_ist().isoformat()
            todays = [s for s in samples if ist_day(s["created_at"]) == today]
            basis = todays if todays else samples[:50]
            adult = sum(1 for s in basis if s["verdict"] == "adulterated")
            avg_water = sum(s["water_pct"] for s in basis) / (len(basis) or 1)
            cutoff = datetime.now(timezone.utc) - timedelta(days=30)
            last30 = [s for s in samples if parse_iso(s["created_at"]) >= cutoff]
            water_by_centre = []
            for c in centres:
                cs = [s for s in last30 if s["centre_id"] == c["id"]]
                water_by_centre.append({"centre_id": c["id"], "centre_name": c["name"],
                                        "avg_water_pct": round1(sum(s["water_pct"] for s in cs) / (len(cs) or 1))})
            self._send_json(200, {
                "samples_today": len(todays),
                "adulterated_pct": round1((adult / (len(basis) or 1)) * 100.0),
                "avg_water_pct": round1(avg_water),
                "active_centres": sum(1 for c in centres if c["active"]),
                "recent": [self._out(s) for s in samples[:10]],
                "water_by_centre": water_by_centre,
            })
            return

        if path == "/stats/trends":
            days = int_param(qs, "days", 30, 1, 365)
            today = today_ist()
            buckets: Dict[str, Dict[str, Any]] = {}
            for i in range(days - 1, -1, -1):
                d = (today - timedelta(days=i)).isoformat()
                buckets[d] = {"date": d, "tested": 0, "adulterated": 0}
            for s in DB["samples"]:
                b = buckets.get(ist_day(s["created_at"]))
                if b:
                    b["tested"] += 1
                    if s["verdict"] == "adulterated":
                        b["adulterated"] += 1
            self._send_json(200, list(buckets.values()))
            return

        if path == "/stats/hotspots":
            out = []
            for c in DB["centres"]:
                cs = [s for s in DB["samples"] if s["centre_id"] == c["id"]]
                adult = sum(1 for s in cs if s["verdict"] == "adulterated")
                out.append({
                    "centre_id": c["id"], "centre_name": c["name"], "district": c["district"],
                    "lat": c["lat"], "lng": c["lng"], "total_samples": len(cs),
                    "adulterated_pct": round1((adult / (len(cs) or 1)) * 100.0),
                    "avg_water_pct": round1(sum(s["water_pct"] for s in cs) / (len(cs) or 1)),
                })
            self._send_json(200, out)
            return

        raise ApiError(404, f"Route not found: {path}")

    # -- POST routes --
    def _post(self) -> None:
        path = urllib.parse.urlparse(self.path).path.rstrip("/") or "/"

        if path == "/auth/signup":
            data = self._read_json()
            name = str(data.get("name", "")).strip()
            email = str(data.get("email", "")).strip().lower()
            password = str(data.get("password", ""))
            role = str(data.get("role", ""))
            if not name:
                raise ApiError(400, "Enter your full name.")
            if not EMAIL_RE.match(email):
                raise ApiError(400, "Enter a valid email address, like name@cooperative.in.")
            if len(password) < MIN_PASSWORD:
                raise ApiError(400, f"Password must be at least {MIN_PASSWORD} characters.")
            if role not in ROLES:
                raise ApiError(400, "Choose a valid role.")
            if email in DB["users"]:
                raise ApiError(409, "An account with this email already exists. Sign in instead.")
            salt, digest = hash_password(password)
            DB["users"][email] = {"id": f"u{uuid.uuid4().hex[:8]}", "name": name, "role": role,
                                  "centre_id": None, "salt": salt, "hash": digest}
            save_db()
            user = DB["users"][email]
            self._send_json(200, {"token": sign_token({"email": email}), "user": public_user(email, user)})
            return

        if path == "/auth/login":
            data = self._read_json()
            email = str(data.get("email", "")).strip().lower()
            password = str(data.get("password", ""))
            if not EMAIL_RE.match(email):
                raise ApiError(400, "Enter a valid email address, like name@cooperative.in.")
            user = DB["users"].get(email)
            if not user or not check_password(password, user):
                raise ApiError(401, "Incorrect email or password.")
            self._send_json(200, {"token": sign_token({"email": email}), "user": public_user(email, user)})
            return

        self._require_auth()

        if path == "/predict":
            body = self._read_body(MAX_UPLOAD_BYTES)
            fields, files = parse_multipart(body, self.headers.get("Content-Type", ""))
            if "image" not in files:
                raise ApiError(400, "Attach a photo in the 'image' field.")
            _filename, mime, raw = files["image"]
            if not mime.startswith("image/"):
                raise ApiError(415, "Please upload an image file (JPG or PNG).")
            farmer = next((f for f in DB["farmers"] if f["id"] == fields.get("farmer_id", "")), None)
            centre = next((c for c in DB["centres"] if c["id"] == fields.get("centre_id", "")), None)
            if not farmer or not centre:
                raise ApiError(400, "Unknown farmer or centre.")
            milk_type = (fields.get("milk_type") or "").strip().lower() or None
            if milk_type and milk_type not in MILK_TYPES:
                raise ApiError(400, "Milk type must be cow, buffalo or mixed.")

            metrics = analyse_image_bytes(raw)
            sample_id = f"s{DB['next_id']:05d}"
            DB["next_id"] += 1
            created_at = now_utc_iso()
            verdict = verdict_for(metrics["water"], metrics["starch"])
            sample = {
                "id": sample_id,
                "farmer_id": farmer["id"],
                "farmer_name": farmer["name"],
                "centre_id": centre["id"],
                "centre_name": centre["name"],
                "water_pct": metrics["water"],
                "starch_pct": metrics["starch"],
                "verdict": verdict,
                "confidence": metrics["confidence"],
                "image_url": save_upload(raw, mime),
                "created_at": created_at,
            }
            if milk_type:
                sample["milk_type"] = milk_type
            DB["pending"][sample_id] = sample
            save_db()
            self._send_json(200, {"verdict": verdict, "water_pct": metrics["water"], "starch_pct": metrics["starch"],
                                  "confidence": metrics["confidence"], "sample_id": sample_id, "created_at": created_at})
            return

        m_confirm = re.match(r"^/samples/([^/]+)/confirm$", path)
        if m_confirm:
            sid = urllib.parse.unquote(m_confirm.group(1))
            pending = DB["pending"].pop(sid, None)
            if not pending:
                existing = next((s for s in DB["samples"] if s["id"] == sid), None)
                if existing:
                    self._send_json(200, self._out(existing))
                    return
                raise ApiError(404, "Sample not found.")
            DB["samples"].insert(0, pending)
            save_db()
            self._send_json(200, self._out(pending))
            return

        raise ApiError(404, f"Route not found: {path}")


class ApiServer(ThreadingHTTPServer):
    request_queue_size = 128  # default is 5; bursts of uploads would be refused
    daemon_threads = True


def main() -> None:
    global DB, JWT_SECRET
    ap = argparse.ArgumentParser(description="DoodhDrishti backend API")
    ap.add_argument("--reseed", action="store_true", help="rebuild the demo samples so they end today (keeps real samples and accounts)")
    args = ap.parse_args()

    JWT_SECRET = _jwt_secret()
    DB = load_db()
    if args.reseed:
        reseed_samples(DB)
        print("Demo samples rebuilt for today.")
    else:
        maybe_refresh_demo(DB)
    save_db()

    server = ApiServer(("0.0.0.0", PORT), DoodhDrishtiHandler)
    print(f"DoodhDrishti API running on http://localhost:{PORT}  (data: {DB_FILE})")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nShutting down...")
        server.server_close()


if __name__ == "__main__":
    main()
