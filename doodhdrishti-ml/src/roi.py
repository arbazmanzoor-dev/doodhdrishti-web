"""Step 2: find the milk surface in each photo and build a pixel mask for it.

Detection, on a copy resized so the longest side is `roi.work_size`:
  1. Blur the grayscale image.
  2. Otsu threshold #1 separates the lit container + milk from the black background.
  3. Otsu threshold #2, computed only inside that region, separates the brighter
     milk surface from the dimmer container walls.
  4. Keep the largest contour, fit an ellipse, and take an inner circle of
     `inner_radius_frac` x the ellipse's minor radius, intersected with the milk mask.
  5. Mask out glare and bubbles: pixels above the `glare_percentile` brightness inside the ROI.

If detection fails (no contour, or too small), a manual crop from config.yaml is used.
Every photo gets a debug image in outputs/roi_debug/ so the result can be checked by eye.
"""
from __future__ import annotations

import sys
from dataclasses import dataclass, field

import cv2
import numpy as np
import pandas as pd

from .config import load_config


@dataclass
class Roi:
    image: np.ndarray            # BGR image at work size
    mask: np.ndarray             # uint8 0/255, pixels used for features
    method: str                  # "auto" or "manual"
    center: tuple[int, int] | None = None
    radius: float | None = None
    ellipse: tuple | None = None
    warnings: list[str] = field(default_factory=list)


def resize_to_work(img: np.ndarray, work_size: int) -> np.ndarray:
    h, w = img.shape[:2]
    scale = work_size / max(h, w)
    if scale >= 1:
        return img.copy()
    return cv2.resize(img, (round(w * scale), round(h * scale)), interpolation=cv2.INTER_AREA)


def _box_mask(shape: tuple[int, int], box: dict) -> np.ndarray:
    h, w = shape
    x0, y0 = int(box["x"] * w), int(box["y"] * h)
    x1, y1 = int((box["x"] + box["w"]) * w), int((box["y"] + box["h"]) * h)
    m = np.zeros((h, w), np.uint8)
    m[max(y0, 0):min(y1, h), max(x0, 0):min(x1, w)] = 255
    return m


def _auto_detect(img: np.ndarray, rc: dict) -> tuple[np.ndarray, tuple, tuple[int, int], float] | None:
    h, w = img.shape[:2]
    k = rc["blur_kernel"] | 1
    gray = cv2.GaussianBlur(cv2.cvtColor(img, cv2.COLOR_BGR2GRAY), (k, k), 0)

    # Pass 1: lit container + milk vs black background.
    _, lit = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
    inside = gray[lit > 0]
    if inside.size < rc["min_area_frac"] * h * w:
        return None

    # Pass 2: milk surface (brightest) vs container walls, within the lit region only.
    t2, _ = cv2.threshold(inside.reshape(-1, 1), 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
    milk = ((gray > t2) & (lit > 0)).astype(np.uint8) * 255
    milk = cv2.morphologyEx(milk, cv2.MORPH_OPEN, np.ones((7, 7), np.uint8))

    contours, _ = cv2.findContours(milk, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)
    if not contours:
        return None
    c = max(contours, key=cv2.contourArea)
    if cv2.contourArea(c) < rc["min_area_frac"] * h * w or len(c) < 5:
        return None

    blob = np.zeros((h, w), np.uint8)
    cv2.drawContours(blob, [c], -1, 255, thickness=cv2.FILLED)

    ellipse = cv2.fitEllipse(c)
    (cx, cy), (ax1, ax2), _ = ellipse
    # Centre on the point deepest inside the blob, so a crescent-shaped surface
    # still gets a circle that lies on milk rather than on the meniscus edge.
    dist = cv2.distanceTransform(blob, cv2.DIST_L2, 5)
    _, max_d, _, (dx, dy) = cv2.minMaxLoc(dist)
    radius = min(ax1, ax2) / 2.0
    radius = min(radius, max_d)  # never extend past the blob
    r_inner = rc["inner_radius_frac"] * radius

    circle = np.zeros((h, w), np.uint8)
    cv2.circle(circle, (int(dx), int(dy)), int(r_inner), 255, thickness=-1)
    return cv2.bitwise_and(circle, blob), ellipse, (int(dx), int(dy)), r_inner


def _mask_glare(img: np.ndarray, mask: np.ndarray, pct: float) -> np.ndarray:
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    vals = gray[mask > 0]
    if vals.size == 0:
        return mask
    cut = np.percentile(vals, pct)
    out = mask.copy()
    out[gray > cut] = 0
    return out


def detect_roi(img_bgr: np.ndarray, cfg: dict, filename: str = "") -> Roi:
    rc = cfg["roi"]
    img = resize_to_work(img_bgr, rc["work_size"])
    manual = (rc.get("manual_crops") or {}).get(filename) or None
    warnings: list[str] = []

    if manual:
        roi = Roi(img, _box_mask(img.shape[:2], manual), "manual")
    else:
        found = _auto_detect(img, rc)
        if found is not None:
            mask, ellipse, center, r = found
            roi = Roi(img, mask, "auto", center, r, ellipse)
        elif rc.get("manual_crop"):
            warnings.append("auto-detection failed; used roi.manual_crop from config.yaml")
            roi = Roi(img, _box_mask(img.shape[:2], rc["manual_crop"]), "manual")
        else:
            warnings.append("auto-detection failed and no manual crop is configured")
            roi = Roi(img, np.zeros(img.shape[:2], np.uint8), "failed")

    roi.mask = _mask_glare(img, roi.mask, rc["glare_percentile"])
    if roi.method != "failed" and int((roi.mask > 0).sum()) < 500:
        warnings.append(f"ROI is very small ({int((roi.mask > 0).sum())} px); check the debug image")
    roi.warnings = warnings
    return roi


def draw_debug(roi: Roi, title: str) -> np.ndarray:
    out = roi.image.copy()
    tint = out.copy()
    tint[roi.mask > 0] = (0, 200, 0)
    out = cv2.addWeighted(tint, 0.35, out, 0.65, 0)
    if roi.ellipse is not None:
        cv2.ellipse(out, roi.ellipse, (255, 160, 0), 2)
    if roi.center is not None and roi.radius:
        cv2.circle(out, roi.center, int(roi.radius), (0, 255, 255), 2)
        cv2.drawMarker(out, roi.center, (0, 0, 255), cv2.MARKER_CROSS, 16, 2)
    contours, _ = cv2.findContours(roi.mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    cv2.drawContours(out, contours, -1, (0, 255, 0), 1)
    label = f"{title} | {roi.method} | {int((roi.mask > 0).sum())} px"
    cv2.rectangle(out, (0, 0), (out.shape[1], 28), (0, 0, 0), -1)
    cv2.putText(out, label, (8, 20), cv2.FONT_HERSHEY_SIMPLEX, 0.55, (255, 255, 255), 1, cv2.LINE_AA)
    return out


def main() -> int:
    """Run ROI detection on every labelled photo and write debug images."""
    cfg = load_config()
    labels = pd.read_csv(cfg["paths"]["labels_csv"])
    out_dir = cfg["paths"]["roi_debug_dir"]
    out_dir.mkdir(parents=True, exist_ok=True)
    for name in labels["filename"]:
        img = cv2.imread(str(cfg["paths"]["raw_dir"] / name))
        if img is None:
            print(f"  ! {name}: could not read image")
            continue
        roi = detect_roi(img, cfg, name)
        cv2.imwrite(str(out_dir / f"{name.rsplit('.', 1)[0]}_roi.jpg"), draw_debug(roi, name))
        note = "; ".join(roi.warnings) or "ok"
        print(f"  {name}: {roi.method}, {int((roi.mask > 0).sum())} px ({note})")
    print(f"Debug images: {out_dir}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
