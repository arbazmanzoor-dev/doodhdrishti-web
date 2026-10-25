import base64
import hashlib
import hmac
import json
import os
import random
import re
import time
import urllib.parse
from datetime import datetime, timedelta, timezone
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from typing import Any, Dict, List, Optional, Tuple

PORT = int(os.environ.get("PORT", "8000"))
DB_FILE = os.environ.get("DD_DB_FILE", os.path.join(os.path.dirname(os.path.abspath(__file__)), "db.json"))
JWT_SECRET = os.environ.get("DD_JWT_SECRET", "doodhdrishti-dev-secret-2026")


# ---------- Helpers ----------
def round1(n: float) -> float:
    return round(n * 10) / 10.0


def day_key(iso_str: str) -> str:
    return iso_str[:10]


def verdict_for(water: float, starch: float) -> str:
    if water >= 12 or starch >= 1.5:
        return "adulterated"
    if water >= 5 or starch >= 0.6:
        return "suspicious"
    return "pure"


def sample_image(water: float, starch: float) -> str:
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


def with_image(sample: Dict[str, Any]) -> Dict[str, Any]:
    out = dict(sample)
    if not out.get("image_url"):
        out["image_url"] = sample_image(out["water_pct"], out["starch_pct"])
    return out


# ---------- Token Helpers ----------
def sign_token(user: Dict[str, Any]) -> str:
    payload_bytes = json.dumps({**user, "exp": int(time.time()) + 7 * 86400}).encode("utf-8")
    payload = base64.urlsafe_b64encode(payload_bytes).decode("utf-8").rstrip("=")
    sig = hmac.new(JWT_SECRET.encode("utf-8"), payload.encode("utf-8"), hashlib.sha256).digest()
    sig_str = base64.urlsafe_b64encode(sig).decode("utf-8").rstrip("=")
    return f"{payload}.{sig_str}"


def check_auth(auth_header: Optional[str]) -> bool:
    if not auth_header or not auth_header.startswith("Bearer "):
        return False
    token = auth_header[7:]
    if token.startswith("mock."):
        return True
    parts = token.split(".")
    if len(parts) != 2:
        return False
    payload, sig = parts
    expected_sig = hmac.new(JWT_SECRET.encode("utf-8"), payload.encode("utf-8"), hashlib.sha256).digest()
    expected_str = base64.urlsafe_b64encode(expected_sig).decode("utf-8").rstrip("=")
    return hmac.compare_digest(sig, expected_str)


# ---------- Database & Seeding (Zero-Dependency JSON Store) ----------
def build_initial_db() -> Dict[str, Any]:
    rng = random.Random(20261022)
    centre_seed = [
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
    risk_of = {}
    centres = []
    for idx, (cid, name, district, lat, lng, risk) in enumerate(centre_seed):
        active = idx != 6
        risk_of[cid] = risk
        centres.append({"id": cid, "name": name, "district": district, "lat": lat, "lng": lng, "active": active})

    first_names = [
        "Ramesh", "Lakshmi", "Manjunath", "Shivamma", "Basavaraj", "Geetha",
        "Nagaraj", "Savitri", "Mahesh", "Kavya", "Suresh", "Parvati",
        "Venkatesh", "Anitha", "Prakash", "Sharada", "Ravi", "Yashoda",
        "Mallikarjun", "Rekha", "Siddappa", "Bhagya", "Chandru", "Nirmala",
    ]
    last_names = ["Gowda", "Patil", "Naik", "Hegde", "Reddy", "Shetty", "Kulkarni", "Swamy", "Murthy", "Desai"]
    villages = ["Hosahalli", "Kodihalli", "Bidadi", "Kunigal", "Halebeedu", "Belur", "Sira", "Kadur", "Hunsur", "Sagar", "Gundlupet", "Koppa"]

    farmers = []
    farmer_bias = {}
    for i in range(48):
        centre = centres[i % len(centres)]
        fid = f"f{i + 1:03d}"
        name = f"{first_names[i % len(first_names)]} {rng.choice(last_names)}"
        village = rng.choice(villages)
        phone = f"+91 9{int(100000000 + rng.random() * 899999999)}"
        farmers.append({"id": fid, "name": name, "village": village, "centre_id": centre["id"], "phone": phone})
        farmer_bias[fid] = rng.random()

    now = datetime.now(timezone.utc)
    days = 45
    seq = 1
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
            water_r = round1(water)
            starch_r = round1(starch)
            verdict = verdict_for(water_r, starch_r)
            conf = round((0.82 + rng.random() * 0.17) * 100) / 100.0
            sid = f"s{seq:05d}"
            seq += 1
            samples.append(
                {
                    "id": sid,
                    "farmer_id": farmer["id"],
                    "farmer_name": farmer["name"],
                    "centre_id": centre["id"],
                    "centre_name": centre["name"],
                    "water_pct": water_r,
                    "starch_pct": starch_r,
                    "verdict": verdict,
                    "confidence": conf,
                    "image_url": None,
                    "created_at": ts.isoformat().replace("+00:00", "Z"),
                }
            )

    samples.sort(key=lambda s: s["created_at"], reverse=True)
    return {"centres": centres, "farmers": farmers, "samples": samples, "pending": {}, "next_id": seq}


def load_db() -> Dict[str, Any]:
    if os.path.exists(DB_FILE):
        try:
            with open(DB_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            pass
    data = build_initial_db()
    save_db(data)
    return data


def save_db(data: Dict[str, Any]) -> None:
    try:
        with open(DB_FILE, "w", encoding="utf-8") as f:
            json.dump(data, f)
    except Exception:
        pass


DB = load_db()


def analyse_image_bytes(raw: bytes) -> Dict[str, float]:
    if len(raw) < 16:
        raise ValueError("Could not read this image. Try a clear JPG or PNG photo.")
    step = max(1, len(raw) // 4096)
    sampled = raw[64::step] or raw
    lum = 0.0
    yellow = 0.0
    n = max(1, len(sampled) // 3)
    for i in range(0, n * 3, 3):
        r = sampled[i]
        g = sampled[i + 1]
        b = sampled[i + 2]
        lum += 0.2126 * r + 0.7152 * g + 0.0722 * b
        yellow += max(0.0, (r + g) / 2.0 - b)

    brightness = min(0.95, max(0.25, (lum / n) / 255.0))
    yellowness = min(0.25, max(0.0, (yellow / n) / 255.0))
    water = min(35.0, max(0.0, (0.82 - brightness) * 32.0 + (random.random() - 0.5) * 2.0))
    starch = min(3.0, max(0.0, yellowness * 4.5 + (random.random() - 0.5) * 0.2))
    confidence = min(0.99, 0.82 + abs(brightness - 0.55) * 0.3 + random.random() * 0.05)
    return {
        "water": round1(water),
        "starch": round1(starch),
        "confidence": round(confidence * 100) / 100.0,
    }


def parse_multipart(body: bytes, content_type: str) -> Tuple[Dict[str, str], Dict[str, Tuple[str, str, bytes]]]:
    match = re.search(r"boundary=([^;\s]+)", content_type)
    if not match:
        raise ValueError("Missing multipart boundary")
    boundary = match.group(1).strip('"').encode("utf-8")
    fields: Dict[str, str] = {}
    files: Dict[str, Tuple[str, str, bytes]] = {}

    parts = body.split(b"--" + boundary)
    for part in parts[1:]:
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
        content = part[header_end + 4 :]

        name_match = re.search(r'name="([^"]+)"', raw_headers)
        if not name_match:
            continue
        field_name = name_match.group(1)
        filename_match = re.search(r'filename="([^"]*)"', raw_headers)
        ctype_match = re.search(r"Content-Type:\s*([^\r\n]+)", raw_headers, re.IGNORECASE)

        if filename_match:
            filename = filename_match.group(1)
            mime = ctype_match.group(1).strip() if ctype_match else "application/octet-stream"
            files[field_name] = (filename, mime, content)
        else:
            fields[field_name] = content.decode("utf-8", errors="replace")

    return fields, files


def summarise_farmer(farmer_id: str) -> Optional[Dict[str, Any]]:
    farmer = next((f for f in DB["farmers"] if f["id"] == farmer_id), None)
    if not farmer:
        return None
    fs_samples = [s for s in DB["samples"] if s["farmer_id"] == farmer_id]
    total = len(fs_samples)
    pure = sum(1 for s in fs_samples if s["verdict"] == "pure")
    trend = [s["water_pct"] for s in reversed(fs_samples[:12])]
    return {
        **farmer,
        "total_samples": total,
        "pure_pct": round1((pure / (total or 1)) * 100.0),
        "last_test_at": fs_samples[0]["created_at"] if fs_samples else None,
        "trend": trend,
    }


# ---------- HTTP Request Handler ----------
class DoodhDrishtiHandler(BaseHTTPRequestHandler):
    def _send_cors(self) -> None:
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
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

    def _require_auth(self) -> bool:
        auth = self.headers.get("Authorization")
        if not check_auth(auth):
            self._send_error_json(401, "Missing or invalid authorization token.")
            return False
        return True

    def do_OPTIONS(self) -> None:
        self.send_response(204)
        self._send_cors()
        self.end_headers()

    def do_GET(self) -> None:
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path.rstrip("/") or "/"
        qs = urllib.parse.parse_qs(parsed.query)

        if path in ("/", "/docs", "/health"):
            html = b"""<!doctype html><html><head><title>DoodhDrishti API</title></head>
            <body style="font-family:sans-serif;padding:2rem;background:#14122e;color:#fff;">
            <h2>DoodhDrishti Backend API is Running</h2>
            <p>Listening on port 8000 with zero external dependencies.</p>
            </body></html>"""
            self.send_response(200)
            self._send_cors()
            self.send_header("Content-Type", "text/html; charset=utf-8")
            self.send_header("Content-Length", str(len(html)))
            self.end_headers()
            self.wfile.write(html)
            return

        if not self._require_auth():
            return

        # GET /samples
        if path == "/samples":
            from_ = qs.get("from", [None])[0]
            to = qs.get("to", [None])[0]
            centre_id = qs.get("centre_id", [None])[0]
            verdict = qs.get("verdict", [None])[0]
            q = qs.get("q", [None])[0]
            page = int(qs.get("page", ["1"])[0] or 1)
            page_size = int(qs.get("page_size", ["15"])[0] if "page_size" in qs else 15)

            term = q.strip().lower() if q else None
            filtered = []
            for s in DB["samples"]:
                day = day_key(s["created_at"])
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

            items = filtered[(page - 1) * page_size : page * page_size] if page_size > 0 else filtered
            self._send_json(200, {"items": [with_image(x) for x in items], "total": len(filtered)})
            return

        # GET /samples/:id
        m_sample = re.match(r"^/samples/([^/]+)$", path)
        if m_sample:
            sid = urllib.parse.unquote(m_sample.group(1))
            sample = next((s for s in DB["samples"] if s["id"] == sid), None) or DB["pending"].get(sid)
            if not sample:
                self._send_error_json(404, "Sample not found.")
                return
            self._send_json(200, with_image(sample))
            return

        # GET /farmers
        if path == "/farmers":
            out = [summarise_farmer(f["id"]) for f in DB["farmers"]]
            self._send_json(200, out)
            return

        # GET /farmers/:id
        m_farmer = re.match(r"^/farmers/([^/]+)$", path)
        if m_farmer:
            fid = urllib.parse.unquote(m_farmer.group(1))
            summary = summarise_farmer(fid)
            if not summary:
                self._send_error_json(404, "Farmer not found.")
                return
            centre = next((c for c in DB["centres"] if c["id"] == summary["centre_id"]), None)
            samples = [with_image(s) for s in DB["samples"] if s["farmer_id"] == fid]
            self._send_json(
                200,
                {
                    **summary,
                    "centre_name": centre["name"] if centre else "—",
                    "samples": samples,
                },
            )
            return

        # GET /centres
        if path == "/centres":
            self._send_json(200, DB["centres"])
            return

        # GET /stats/summary
        if path == "/stats/summary":
            samples = DB["samples"]
            centres = DB["centres"]
            today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
            todays = [s for s in samples if day_key(s["created_at"]) == today]
            basis = todays if todays else samples[:50]
            adult = sum(1 for s in basis if s["verdict"] == "adulterated")
            avg_water = sum(s["water_pct"] for s in basis) / (len(basis) or 1)

            cutoff = (datetime.now(timezone.utc) - timedelta(days=30)).isoformat()
            last30 = [s for s in samples if s["created_at"] >= cutoff]

            water_by_centre = []
            for c in centres:
                cs = [s for s in last30 if s["centre_id"] == c["id"]]
                water_by_centre.append(
                    {
                        "centre_id": c["id"],
                        "centre_name": c["name"],
                        "avg_water_pct": round1(sum(s["water_pct"] for s in cs) / (len(cs) or 1)),
                    }
                )

            self._send_json(
                200,
                {
                    "samples_today": len(todays),
                    "adulterated_pct": round1((adult / (len(basis) or 1)) * 100.0),
                    "avg_water_pct": round1(avg_water),
                    "active_centres": sum(1 for c in centres if c["active"]),
                    "recent": [with_image(s) for s in samples[:10]],
                    "water_by_centre": water_by_centre,
                },
            )
            return

        # GET /stats/trends
        if path == "/stats/trends":
            days = int(qs.get("days", ["30"])[0] or 30)
            now = datetime.now(timezone.utc)
            buckets: Dict[str, Dict[str, Any]] = {}
            for i in range(days - 1, -1, -1):
                d = (now - timedelta(days=i)).strftime("%Y-%m-%d")
                buckets[d] = {"date": d, "tested": 0, "adulterated": 0}

            for s in DB["samples"]:
                k = day_key(s["created_at"])
                if k in buckets:
                    buckets[k]["tested"] += 1
                    if s["verdict"] == "adulterated":
                        buckets[k]["adulterated"] += 1

            self._send_json(200, list(buckets.values()))
            return

        # GET /stats/hotspots
        if path == "/stats/hotspots":
            out = []
            for c in DB["centres"]:
                cs = [s for s in DB["samples"] if s["centre_id"] == c["id"]]
                adult = sum(1 for s in cs if s["verdict"] == "adulterated")
                out.append(
                    {
                        "centre_id": c["id"],
                        "centre_name": c["name"],
                        "district": c["district"],
                        "lat": c["lat"],
                        "lng": c["lng"],
                        "total_samples": len(cs),
                        "adulterated_pct": round1((adult / (len(cs) or 1)) * 100.0),
                        "avg_water_pct": round1(sum(s["water_pct"] for s in cs) / (len(cs) or 1)),
                    }
                )
            self._send_json(200, out)
            return

        self._send_error_json(404, f"Route not found: {path}")

    def do_POST(self) -> None:
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path.rstrip("/") or "/"
        length = int(self.headers.get("Content-Length", "0"))
        body = self.rfile.read(length) if length > 0 else b""

        # 1. POST /auth/login
        if path == "/auth/login":
            try:
                data = json.loads(body.decode("utf-8"))
            except Exception:
                self._send_error_json(400, "Invalid JSON payload.")
                return

            email = str(data.get("email", "")).strip()
            password = str(data.get("password", ""))
            role = data.get("role")
            if not email or not password:
                self._send_error_json(400, "Email and password are required.")
                return

            local = (email.split("@")[0] or "demo").replace(".", " ").replace("_", " ").replace("-", " ")
            name = " ".join(part.capitalize() for part in local.split() if part) or "Demo User"
            if not role:
                lower = email.lower()
                if "operator" in lower:
                    role = "centre_operator"
                elif "officer" in lower or "safety" in lower or "fso" in lower:
                    role = "food_safety_officer"
                else:
                    role = "cooperative_admin"

            user = {
                "id": "u001",
                "name": name,
                "email": email,
                "role": role,
                "centre_id": "c01",
            }
            self._send_json(200, {"token": sign_token(user), "user": user})
            return

        if not self._require_auth():
            return

        # 2. POST /predict
        if path == "/predict":
            ctype = self.headers.get("Content-Type", "")
            try:
                fields, files = parse_multipart(body, ctype)
            except Exception as exc:
                self._send_error_json(400, str(exc))
                return

            if "image" not in files:
                self._send_error_json(415, "Please upload an image file (JPG or PNG).")
                return

            _filename, mime, raw_bytes = files["image"]
            if not mime.startswith("image/"):
                self._send_error_json(415, "Please upload an image file (JPG or PNG).")
                return

            farmer_id = fields.get("farmer_id", "")
            centre_id = fields.get("centre_id", "")

            farmer = next((f for f in DB["farmers"] if f["id"] == farmer_id), None)
            centre = next((c for c in DB["centres"] if c["id"] == centre_id), None)
            if not farmer or not centre:
                self._send_error_json(400, "Unknown farmer or centre.")
                return

            try:
                metrics = analyse_image_bytes(raw_bytes)
            except ValueError as exc:
                self._send_error_json(422, str(exc))
                return

            b64 = base64.b64encode(raw_bytes).decode("utf-8")
            image_url = f"data:{mime};base64,{b64}"

            sample_id = f"s{DB['next_id']:05d}"
            DB["next_id"] += 1
            created_at = datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")
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
                "image_url": image_url,
                "created_at": created_at,
            }
            DB["pending"][sample_id] = sample
            save_db(DB)

            self._send_json(
                200,
                {
                    "verdict": verdict,
                    "water_pct": metrics["water"],
                    "starch_pct": metrics["starch"],
                    "confidence": metrics["confidence"],
                    "sample_id": sample_id,
                    "created_at": created_at,
                },
            )
            return

        # 3. POST /samples/:id/confirm
        m_confirm = re.match(r"^/samples/([^/]+)/confirm$", path)
        if m_confirm:
            sid = urllib.parse.unquote(m_confirm.group(1))
            pending_sample = DB["pending"].pop(sid, None)
            if not pending_sample:
                existing = next((s for s in DB["samples"] if s["id"] == sid), None)
                if existing:
                    self._send_json(200, with_image(existing))
                    return
                self._send_error_json(404, "Sample not found.")
                return
            DB["samples"].insert(0, pending_sample)
            save_db(DB)
            self._send_json(200, with_image(pending_sample))
            return

        self._send_error_json(404, f"Route not found: {path}")


if __name__ == "__main__":
    server = ThreadingHTTPServer(("0.0.0.0", PORT), DoodhDrishtiHandler)
    print(f"DoodhDrishti Backend API running on http://localhost:{PORT}")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nShutting down server...")
        server.server_close()