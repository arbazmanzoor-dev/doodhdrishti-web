"""Step 1: parse labels from photo filenames into data/labels.csv.

Pattern: <milktype>_w<water%>_s<starch%>_phone<ID>_r<round>_<nn>.jpg
Example: cow_w20_s0_phoneA_r1_03.jpg
"""
from __future__ import annotations

import re
import sys

import pandas as pd

from .config import ROOT, load_config

IMAGE_EXTS = {".jpg", ".jpeg", ".png"}
PATTERN = re.compile(
    r"^(?P<milk_type>[a-z]+)_w(?P<water_pct>\d+(?:\.\d+)?)_s(?P<starch_pct>\d+(?:\.\d+)?)"
    r"_phone(?P<phone>[A-Za-z0-9]+)_r(?P<round>\d+)_(?P<photo_no>\d+)$",
    re.IGNORECASE,
)


def parse_name(stem: str) -> dict | None:
    m = PATTERN.match(stem)
    if not m:
        return None
    d = m.groupdict()
    d["milk_type"] = d["milk_type"].lower()
    d["water_pct"] = float(d["water_pct"])
    d["starch_pct"] = float(d["starch_pct"])
    d["round"] = int(d["round"])
    d["photo_no"] = int(d["photo_no"])
    # One sample = one glass: everything except the photo number.
    d["sample_id"] = stem.rsplit("_", 1)[0].lower()
    return d


def build_labels(cfg: dict) -> pd.DataFrame:
    raw_dir = cfg["paths"]["raw_dir"]
    files = sorted(p for p in raw_dir.iterdir() if p.suffix.lower() in IMAGE_EXTS)
    rows, bad = [], []
    for p in files:
        d = parse_name(p.stem)
        if d is None:
            bad.append(p.name)
        else:
            rows.append({"filename": p.name, **d})
    cols = ["filename", "milk_type", "water_pct", "starch_pct", "phone", "round", "photo_no", "sample_id"]
    df = pd.DataFrame(rows, columns=cols)
    df.to_csv(cfg["paths"]["labels_csv"], index=False)

    print(f"Labelled {len(df)} of {len(files)} photos -> {cfg['paths']['labels_csv'].relative_to(ROOT)}")
    if bad:
        print(f"\n{len(bad)} file(s) don't match <milktype>_w<water>_s<starch>_phone<ID>_r<round>_<nn>.jpg and were skipped:")
        for name in bad:
            print(f"  - {name}")
    if len(df):
        print("\nPhotos per water level:")
        print(df.groupby("water_pct").agg(photos=("filename", "count"), samples=("sample_id", "nunique")).to_string())
    return df


def main() -> int:
    cfg = load_config()
    build_labels(cfg)
    return 0


if __name__ == "__main__":
    sys.exit(main())
