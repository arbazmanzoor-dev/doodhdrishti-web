"""Predict adulteration from a CSV containing the model's measured input fields."""

from __future__ import annotations

import argparse
from pathlib import Path
from typing import Any

import joblib
import pandas as pd


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--input", type=Path, required=True, help="CSV file with one or more samples")
    parser.add_argument(
        "--model",
        type=Path,
        default=Path(__file__).parent / "models" / "best_model.joblib",
    )
    parser.add_argument("--output", type=Path, default=Path("predictions.csv"))
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    if not args.model.is_file():
        raise FileNotFoundError(f"Model not found: {args.model}. Run train.py first.")
    if not args.input.is_file():
        raise FileNotFoundError(f"Input CSV not found: {args.input}")

    bundle: dict[str, Any] = joblib.load(args.model)
    frame = pd.read_csv(args.input)
    features: list[str] = bundle["feature_columns"]
    missing = [column for column in features if column not in frame.columns]
    if missing:
        raise ValueError(
            "Input is missing required model features: " + ", ".join(missing)
        )

    X = frame[features].apply(pd.to_numeric, errors="coerce")
    model = bundle["model"]
    positive_index = list(model.classes_).index(1)
    probability = model.predict_proba(X)[:, positive_index]
    threshold = float(bundle["threshold"])
    results = frame.copy()
    results["predicted_probability_adulterated"] = probability
    results["predicted_label"] = (probability >= threshold).astype(int)
    results["predicted_verdict"] = results["predicted_label"].map(
        {0: "pure", 1: "adulterated"}
    )
    results.to_csv(args.output, index=False)
    print(f"Wrote {len(results)} predictions to {args.output}")
    print(bundle["synthetic_data_warning"])


if __name__ == "__main__":
    main()
