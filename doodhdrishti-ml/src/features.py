"""Step 3: one row of colour/texture features per photo -> outputs/features.csv.

All features are computed only over the ROI mask from roi.py (milk surface,
inner crop, glare removed). Colour channels are 0-1 floats.
"""
from __future__ import annotations

import sys

import cv2
import numpy as np
import pandas as pd

from .config import load_config
from .roi import _box_mask, detect_roi

# Order matters: this list is saved with the model so prediction builds the same vector.
FEATURE_COLUMNS = [
    "r_mean", "g_mean", "b_mean", "r_std", "g_std", "b_std",
    "h_mean", "s_mean", "v_mean", "h_std", "s_std", "v_std",
    "lab_l_mean", "lab_a_mean", "lab_b_mean", "lab_l_std", "lab_a_std", "lab_b_std",
    "ratio_b_r", "ratio_g_r", "ratio_b_g",
    "bright_p10", "bright_p25", "bright_p50", "bright_p75", "bright_p90",
    "gray_std", "laplacian_var",
]


def _reference_normalise(rgb: np.ndarray, cfg: dict) -> tuple[np.ndarray, bool]:
    """Scale each channel as (v - black) / (white - black) using reference patches."""
    ref = cfg.get("reference_strip") or {}
    if not ref.get("enabled") or not ref.get("white") or not ref.get("black"):
        return rgb, False
    shape = rgb.shape[:2]
    white = rgb[_box_mask(shape, ref["white"]) > 0].mean(axis=0)
    black = rgb[_box_mask(shape, ref["black"]) > 0].mean(axis=0)
    span = np.clip(white - black, 1e-3, None)
    return np.clip((rgb - black) / span, 0, 1), True


def extract(img_bgr: np.ndarray, cfg: dict, filename: str = "") -> tuple[dict, list[str]]:
    """Return (feature dict, warnings) for one photo."""
    roi = detect_roi(img_bgr, cfg, filename)
    mask = roi.mask > 0
    if mask.sum() < 50:
        raise ValueError("No usable milk area found in the photo. " + "; ".join(roi.warnings))

    rgb = cv2.cvtColor(roi.image, cv2.COLOR_BGR2RGB).astype(np.float32) / 255.0
    rgb, normalised = _reference_normalise(rgb, cfg)
    px = rgb[mask]                                     # N x 3
    hsv = cv2.cvtColor(rgb, cv2.COLOR_RGB2HSV)[mask]   # H 0-360, S/V 0-1
    lab = cv2.cvtColor(rgb, cv2.COLOR_RGB2LAB)[mask]   # L 0-100, a/b approx -128..127
    gray_img = cv2.cvtColor(rgb, cv2.COLOR_RGB2GRAY)
    gray = gray_img[mask]

    # Laplacian inside a slightly eroded mask so the ROI border doesn't count as texture.
    inner = cv2.erode(roi.mask, np.ones((5, 5), np.uint8)) > 0
    lap = cv2.Laplacian(gray_img, cv2.CV_32F)[inner if inner.any() else mask]

    r, g, b = px.mean(axis=0)
    eps = 1e-6
    p = np.percentile(gray, [10, 25, 50, 75, 90])
    feats = {
        "r_mean": r, "g_mean": g, "b_mean": b,
        "r_std": px[:, 0].std(), "g_std": px[:, 1].std(), "b_std": px[:, 2].std(),
        "h_mean": hsv[:, 0].mean(), "s_mean": hsv[:, 1].mean(), "v_mean": hsv[:, 2].mean(),
        "h_std": hsv[:, 0].std(), "s_std": hsv[:, 1].std(), "v_std": hsv[:, 2].std(),
        "lab_l_mean": lab[:, 0].mean(), "lab_a_mean": lab[:, 1].mean(), "lab_b_mean": lab[:, 2].mean(),
        "lab_l_std": lab[:, 0].std(), "lab_a_std": lab[:, 1].std(), "lab_b_std": lab[:, 2].std(),
        "ratio_b_r": b / (r + eps), "ratio_g_r": g / (r + eps), "ratio_b_g": b / (g + eps),
        "bright_p10": p[0], "bright_p25": p[1], "bright_p50": p[2], "bright_p75": p[3], "bright_p90": p[4],
        "gray_std": gray.std(), "laplacian_var": lap.var(),
    }
    feats = {k: float(v) for k, v in feats.items()}
    feats.update({"roi_method": roi.method, "roi_pixels": int(mask.sum()), "ref_normalised": normalised})
    return feats, roi.warnings


def build_features(cfg: dict) -> pd.DataFrame:
    labels = pd.read_csv(cfg["paths"]["labels_csv"])
    rows = []
    for rec in labels.to_dict("records"):
        img = cv2.imread(str(cfg["paths"]["raw_dir"] / rec["filename"]))
        if img is None:
            print(f"  ! {rec['filename']}: could not read image, skipped")
            continue
        try:
            feats, warns = extract(img, cfg, rec["filename"])
        except ValueError as e:
            print(f"  ! {rec['filename']}: {e} Skipped.")
            continue
        for w in warns:
            print(f"  ! {rec['filename']}: {w}")
        rows.append({**rec, **feats})
    df = pd.DataFrame(rows)
    out = cfg["paths"]["features_csv"]
    out.parent.mkdir(parents=True, exist_ok=True)
    df.to_csv(out, index=False)
    print(f"Features for {len(df)} of {len(labels)} photos -> {out}")
    return df


def main() -> int:
    cfg = load_config()
    df = build_features(cfg)
    if len(df):
        show = ["filename", "r_mean", "g_mean", "b_mean", "ratio_b_r", "lab_l_mean", "lab_b_mean", "bright_p50", "roi_pixels"]
        with pd.option_context("display.width", 200, "display.precision", 3):
            print(df[show].to_string(index=False))
    return 0


if __name__ == "__main__":
    sys.exit(main())

