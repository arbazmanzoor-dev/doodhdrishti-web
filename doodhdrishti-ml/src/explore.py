"""Step 4: check whether the colour signal tracks water %, and whether the setup is consistent.

- outputs/feature_vs_water.png: key features vs water %, mean +/- std per level,
  one line per milk type.
- Prints, per feature, the typical spread between photos of the same sample
  (within-sample std) next to the change between neighbouring water levels.
  If the within-sample spread is as large as the between-level change, the photos
  are too inconsistent (lighting, exposure, distance) to tell those levels apart.
"""
from __future__ import annotations

import sys

import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd

from .config import load_config

KEY_FEATURES = [
    ("ratio_b_r", "Blue / red ratio"),
    ("ratio_b_g", "Blue / green ratio"),
    ("lab_l_mean", "Lightness (L*)"),
    ("lab_b_mean", "Yellow-blue (b*)"),
    ("s_mean", "Saturation"),
    ("bright_p50", "Median brightness"),
    ("gray_std", "Brightness spread"),
    ("laplacian_var", "Texture (Laplacian var)"),
]
COLOURS = ["#5B54B0", "#E88A1A", "#16A34A", "#DC2626", "#0E7490", "#7C3AED"]


def plot_features(df: pd.DataFrame, out_path) -> None:
    fig, axes = plt.subplots(2, 4, figsize=(16, 7.5), constrained_layout=True)
    milk_types = sorted(df["milk_type"].unique())
    for ax, (col, title) in zip(axes.flat, KEY_FEATURES):
        for i, mt in enumerate(milk_types):
            sub = df[df["milk_type"] == mt].groupby("water_pct")[col].agg(["mean", "std", "count"]).reset_index()
            ax.errorbar(sub["water_pct"], sub["mean"], yerr=sub["std"].fillna(0), marker="o", ms=6,
                        capsize=4, lw=2, color=COLOURS[i % len(COLOURS)], label=mt)
            # Individual photos, faint, so a single level still shows its spread.
            pts = df[df["milk_type"] == mt]
            ax.scatter(pts["water_pct"], pts[col], s=14, alpha=0.35, color=COLOURS[i % len(COLOURS)])
        ax.set_title(title, fontsize=11)
        ax.set_xlabel("Water added (%)")
        ax.grid(alpha=0.25)
        levels = sorted(df["water_pct"].unique())
        if len(levels) == 1:
            ax.set_xlim(levels[0] - 5, levels[0] + 5)
    axes.flat[0].legend(title="Milk type", fontsize=9)
    n_levels = df["water_pct"].nunique()
    fig.suptitle(f"Features vs water % — {len(df)} photos, {df['sample_id'].nunique()} samples, {n_levels} water level(s)",
                 fontsize=13)
    fig.savefig(out_path, dpi=120)
    plt.close(fig)


def consistency_report(df: pd.DataFrame) -> pd.DataFrame:
    rows = []
    levels = sorted(df["water_pct"].unique())
    for col, title in KEY_FEATURES:
        within = df.groupby("sample_id")[col].std().dropna()
        within_std = float(within.mean()) if len(within) else np.nan
        level_means = df.groupby("water_pct")[col].mean().reindex(levels)
        steps = level_means.diff().abs().dropna()
        between = float(steps.mean()) if len(steps) else np.nan
        ratio = between / within_std if within_std and not np.isnan(between) else np.nan
        rows.append({"feature": col, "label": title, "within_sample_std": within_std,
                     "between_level_change": between, "signal_to_noise": ratio})
    return pd.DataFrame(rows)


def main() -> int:
    cfg = load_config()
    df = pd.read_csv(cfg["paths"]["features_csv"])
    if df.empty:
        print("No features yet. Run: make features")
        return 1
    out = cfg["paths"]["outputs_dir"] / "feature_vs_water.png"
    plot_features(df, out)
    print(f"Plot: {out}\n")

    rep = consistency_report(df)
    with pd.option_context("display.width", 200, "display.precision", 4):
        print(rep.drop(columns="label").to_string(index=False))

    n_levels = df["water_pct"].nunique()
    multi = df.groupby("sample_id").size()
    print()
    if (multi < 2).all():
        print("! Each sample has only one photo, so within-sample spread can't be measured. "
              "Take several photos of each glass.")
    if n_levels < 2:
        print(f"! Only one water level ({df['water_pct'].iloc[0]:g}%) so far, so there is nothing to compare it with.\n"
              "  The within-sample numbers above are the noise floor: a water level must shift a feature\n"
              "  by clearly more than this before the model can tell it apart.")
    else:
        weak = rep[rep["signal_to_noise"] < 2]
        if len(weak) == len(rep):
            print("! For every feature, photos of the same glass vary about as much as neighbouring water levels.\n"
                  "  Fix the setup first: same phone, fixed height, flash on, auto-exposure locked, dim room.")
        elif len(weak):
            print("Features with weak signal (change between levels < 2x within-sample spread): "
                  + ", ".join(weak["feature"]))
        best = rep.sort_values("signal_to_noise", ascending=False).iloc[0]
        print(f"Strongest signal: {best['feature']} (between-level change is {best['signal_to_noise']:.1f}x the photo-to-photo noise)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
