"""Step 5: train the verdict classifier and water/starch regressors.

Runs feature extraction first, then checks there is enough data. If there isn't,
it explains what's missing and exits cleanly without training.

Evaluation never lets photos of the same glass (sample_id) appear in both the
training and test side of a split. With more than one photo round, each round is
held out in turn (leave-one-round-out), which also tests day-to-day repeatability.
"""
from __future__ import annotations

import sys
from datetime import datetime, timezone

import joblib
import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor
from sklearn.metrics import accuracy_score, confusion_matrix, mean_absolute_error
from sklearn.model_selection import GroupKFold, LeaveOneGroupOut
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler

from .config import load_config
from .features import FEATURE_COLUMNS, build_features

CLASSES = ["Pure", "Adulterated"]


def verdict_labels(df: pd.DataFrame, cfg: dict) -> pd.Series:
    lc = cfg["labels"]
    pure = (df["water_pct"] < lc["pure_max_water_pct"]) & (df["starch_pct"] <= lc["pure_max_starch_pct"])
    return pd.Series(np.where(pure, "Pure", "Adulterated"), index=df.index)


def sufficiency_problems(df: pd.DataFrame, cfg: dict) -> list[str]:
    """Return a list of human-readable reasons not to train (empty = OK)."""
    lc = cfg["labels"]
    problems: list[str] = []
    if df.empty:
        return ["No usable photos. Add photos to data/raw/ named like cow_w20_s0_phoneA_r1_03.jpg."]
    per_level = df.groupby("water_pct")["sample_id"].nunique().sort_index()
    if len(per_level) < lc["min_water_levels"]:
        have = ", ".join(f"{w:g}%" for w in per_level.index)
        problems.append(
            f"Only {len(per_level)} water level ({have}); need at least {lc['min_water_levels']}. "
            "Add photos of milk with known water added, e.g. w5, w10, w20, w30."
        )
    thin = per_level[per_level < lc["min_samples_per_level"]]
    for w, n in thin.items():
        problems.append(
            f"Water {w:g}% has {n} sample(s); need at least {lc['min_samples_per_level']}. "
            "A sample is one glass: pour a fresh one and photograph it again (new round or new sample)."
        )
    classes = set(verdict_labels(df, cfg))
    if len(classes) < 2:
        only = classes.pop()
        problems.append(f"Every photo is labelled {only}; the classifier needs both Pure and Adulterated examples.")
    return problems


def make_pipeline(estimator, milk_types: list[str]) -> Pipeline:
    pre = ColumnTransformer([
        ("num", StandardScaler(), FEATURE_COLUMNS),
        ("milk", OneHotEncoder(categories=[milk_types], handle_unknown="ignore"), ["milk_type"]),
    ])
    return Pipeline([("pre", pre), ("model", estimator)])


def make_splits(df: pd.DataFrame, cfg: dict):
    if df["round"].nunique() > 1:
        return "leave-one-round-out", list(LeaveOneGroupOut().split(df, groups=df["round"]))
    n = min(cfg["model"]["n_splits"], df["sample_id"].nunique())
    return f"GroupKFold by sample ({n} folds)", list(GroupKFold(n_splits=n).split(df, groups=df["sample_id"]))


def cross_validate(df: pd.DataFrame, cfg: dict, milk_types: list[str]) -> dict:
    mc = cfg["model"]
    X = df[FEATURE_COLUMNS + ["milk_type"]]
    y_cls = verdict_labels(df, cfg).to_numpy()
    scheme, splits = make_splits(df, cfg)
    pred_cls = np.empty(len(df), dtype=object)
    pred_water = np.zeros(len(df))
    pred_starch = np.zeros(len(df))
    for tr, te in splits:
        clf = make_pipeline(RandomForestClassifier(n_estimators=mc["n_estimators"], random_state=mc["random_state"],
                                                   class_weight="balanced"), milk_types)
        clf.fit(X.iloc[tr], y_cls[tr])
        pred_cls[te] = clf.predict(X.iloc[te])
        for target, out in (("water_pct", pred_water), ("starch_pct", pred_starch)):
            reg = make_pipeline(RandomForestRegressor(n_estimators=mc["n_estimators"], random_state=mc["random_state"]),
                                milk_types)
            reg.fit(X.iloc[tr], df[target].iloc[tr])
            out[te] = reg.predict(X.iloc[te])
    return {
        "scheme": scheme,
        "n_folds": len(splits),
        "accuracy": accuracy_score(y_cls, pred_cls),
        "confusion": confusion_matrix(y_cls, pred_cls, labels=CLASSES),
        "mae_water": mean_absolute_error(df["water_pct"], pred_water),
        "mae_starch": mean_absolute_error(df["starch_pct"], pred_starch),
        "per_level": pd.DataFrame({"water_pct": df["water_pct"], "pred": pred_water})
        .groupby("water_pct")["pred"].agg(["mean", "std", "count"]),
    }


def feature_importance(pipe: Pipeline) -> pd.Series:
    names = pipe.named_steps["pre"].get_feature_names_out()
    names = [n.split("__", 1)[1] for n in names]
    return pd.Series(pipe.named_steps["model"].feature_importances_, index=names).sort_values(ascending=False)


def save_plots(cv: dict, importance: pd.Series, out_dir) -> None:
    fig, ax = plt.subplots(figsize=(4.8, 4.2), constrained_layout=True)
    cm = cv["confusion"]
    ax.imshow(cm, cmap="Purples")
    ax.set_xticks([0, 1], CLASSES)
    ax.set_yticks([0, 1], CLASSES)
    ax.set_xlabel("Predicted")
    ax.set_ylabel("Actual")
    for i in range(2):
        for j in range(2):
            ax.text(j, i, int(cm[i, j]), ha="center", va="center",
                    color="white" if cm[i, j] > cm.max() / 2 else "#1E1B4B", fontsize=14)
    ax.set_title(f"Verdict, held-out photos\n({cv['scheme']})", fontsize=10)
    fig.savefig(out_dir / "confusion_matrix.png", dpi=130)
    plt.close(fig)

    top = importance.head(15)[::-1]
    fig, ax = plt.subplots(figsize=(7, 5), constrained_layout=True)
    ax.barh(top.index, top.values, color="#5B54B0")
    ax.set_xlabel("Importance (water % regressor)")
    ax.set_title("Top features")
    ax.grid(axis="x", alpha=0.25)
    fig.savefig(out_dir / "importance.png", dpi=130)
    plt.close(fig)


def write_report(df: pd.DataFrame, cv: dict, importance: pd.Series, cfg: dict, path) -> None:
    cm = cv["confusion"]
    lines = [
        "# DoodhDrishti model report",
        "",
        f"Trained {datetime.now(timezone.utc):%Y-%m-%d %H:%M} UTC · model version {cfg['model']['version']}",
        "",
        f"- Photos: {len(df)} · samples: {df['sample_id'].nunique()} · rounds: {df['round'].nunique()} · "
        f"milk types: {', '.join(sorted(df['milk_type'].unique()))}",
        f"- Water levels: {', '.join(f'{w:g}%' for w in sorted(df['water_pct'].unique()))}",
        f"- Evaluation: {cv['scheme']}. Photos of the same glass never appear on both sides of a split.",
        "",
        "## Held-out results",
        "",
        f"- Verdict accuracy: **{cv['accuracy']:.1%}**",
        f"- Water % mean absolute error: **{cv['mae_water']:.2f} points**",
        f"- Starch % mean absolute error: {cv['mae_starch']:.2f} points"
        + (" (no starch in the data yet, so this is trivially 0)" if df["starch_pct"].max() == 0 else ""),
        "",
        "Confusion matrix (rows = actual, columns = predicted):",
        "",
        "| | Pure | Adulterated |",
        "|---|---:|---:|",
        f"| **Pure** | {cm[0, 0]} | {cm[0, 1]} |",
        f"| **Adulterated** | {cm[1, 0]} | {cm[1, 1]} |",
        "",
        "Predicted water % per true level (held out):",
        "",
        "| True water % | Predicted mean | Std | Photos |",
        "|---:|---:|---:|---:|",
    ]
    for w, r in cv["per_level"].iterrows():
        lines.append(f"| {w:g} | {r['mean']:.1f} | {0 if np.isnan(r['std']) else r['std']:.1f} | {int(r['count'])} |")
    lines += ["", "## Most important features (water % regressor)", ""]
    lines += [f"{i + 1}. `{name}`: {val:.3f}" for i, (name, val) in enumerate(importance.head(10).items())]
    lines += ["", "![Confusion matrix](confusion_matrix.png)", "", "![Feature importance](importance.png)", "",
              "These numbers come from your own photos only. They say how well the model separates the water "
              "levels you photographed, with this setup. They are not a lab-validated accuracy.", ""]
    path.write_text("\n".join(lines), encoding="utf-8")


def main() -> int:
    cfg = load_config()
    print("Extracting features first...")
    df = build_features(cfg)
    problems = sufficiency_problems(df, cfg)
    if problems:
        print("\nNot training yet — not enough data:")
        for p in problems:
            print(f"  - {p}")
        print("\nFeatures were still saved, so you can run `make explore` to check the photos.")
        return 0

    milk_types = sorted(df["milk_type"].unique())
    cv = cross_validate(df, cfg, milk_types)

    mc = cfg["model"]
    X = df[FEATURE_COLUMNS + ["milk_type"]]
    clf = make_pipeline(RandomForestClassifier(n_estimators=mc["n_estimators"], random_state=mc["random_state"],
                                               class_weight="balanced"), milk_types).fit(X, verdict_labels(df, cfg))
    water = make_pipeline(RandomForestRegressor(n_estimators=mc["n_estimators"], random_state=mc["random_state"]),
                          milk_types).fit(X, df["water_pct"])
    starch = make_pipeline(RandomForestRegressor(n_estimators=mc["n_estimators"], random_state=mc["random_state"]),
                           milk_types).fit(X, df["starch_pct"])
    importance = feature_importance(water)

    out_dir = cfg["paths"]["outputs_dir"]
    save_plots(cv, importance, out_dir)
    write_report(df, cv, importance, cfg, out_dir / "report.md")

    model_path = cfg["paths"]["model_file"]
    model_path.parent.mkdir(parents=True, exist_ok=True)
    joblib.dump({
        "version": mc["version"],
        "trained_at": datetime.now(timezone.utc).isoformat(),
        "feature_columns": FEATURE_COLUMNS,
        "milk_types": milk_types,
        "classifier": clf,
        "water_regressor": water,
        "starch_regressor": starch,
        "labels": cfg["labels"],
        "cv": {k: v for k, v in cv.items() if k in ("scheme", "accuracy", "mae_water", "mae_starch")},
    }, model_path)

    print(f"\nHeld-out ({cv['scheme']}): verdict accuracy {cv['accuracy']:.1%}, water MAE {cv['mae_water']:.2f} points")
    print(f"Report: {out_dir / 'report.md'}\nModel:  {model_path}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
