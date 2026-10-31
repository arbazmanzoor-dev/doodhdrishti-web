"""Step 6: predict one photo.

    python -m src.predict path/to/photo.jpg --milk-type cow

Prints JSON: {"verdict", "water_pct", "starch_pct", "confidence"}.
The verdict is lowercase ("pure" / "adulterated") to match the web app's API.
"""
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

import cv2
import joblib
import numpy as np
import pandas as pd

from .config import load_config
from .features import extract


class ModelNotTrained(RuntimeError):
    pass


class Predictor:
    """Loads models/doodhdrishti.joblib, reloading it if the file changes (e.g. after retraining)."""

    def __init__(self, cfg: dict | None = None):
        self.cfg = cfg or load_config()
        self.path: Path = self.cfg["paths"]["model_file"]
        self._bundle: dict | None = None
        self._mtime: float | None = None

    @property
    def bundle(self) -> dict:
        if not self.path.exists():
            raise ModelNotTrained(
                "No trained model yet. Add photos with at least two water levels to data/raw/ and run `make train`."
            )
        mtime = self.path.stat().st_mtime
        if self._bundle is None or mtime != self._mtime:
            self._bundle, self._mtime = joblib.load(self.path), mtime
        return self._bundle

    def predict_image(self, img_bgr: np.ndarray, milk_type: str = "unknown") -> dict:
        b = self.bundle
        feats, _ = extract(img_bgr, self.cfg)
        X = pd.DataFrame([{**{c: feats[c] for c in b["feature_columns"]}, "milk_type": milk_type.lower()}])
        clf = b["classifier"]
        proba = clf.predict_proba(X)[0]
        verdict = str(clf.classes_[int(np.argmax(proba))])
        water = max(0.0, float(b["water_regressor"].predict(X)[0]))
        starch = max(0.0, float(b["starch_regressor"].predict(X)[0]))
        return {
            "verdict": verdict.lower(),
            "water_pct": round(water, 1),
            "starch_pct": round(starch, 1),
            "confidence": round(float(proba.max()), 3),
        }


def main() -> int:
    ap = argparse.ArgumentParser(description="Predict milk adulteration from one photo.")
    ap.add_argument("image", type=Path)
    ap.add_argument("--milk-type", default="unknown", help="e.g. cow, buffalo (must match training labels to help)")
    args = ap.parse_args()

    img = cv2.imread(str(args.image))
    if img is None:
        print(json.dumps({"error": f"Could not read image: {args.image}"}))
        return 2
    try:
        result = Predictor().predict_image(img, args.milk_type)
    except ModelNotTrained as e:
        print(json.dumps({"error": str(e)}))
        return 3
    except ValueError as e:
        print(json.dumps({"error": str(e)}))
        return 4
    print(json.dumps(result))
    return 0


if __name__ == "__main__":
    sys.exit(main())
