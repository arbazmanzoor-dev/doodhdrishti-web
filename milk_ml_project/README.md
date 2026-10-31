# Milk adulteration ML demo

This project trains a binary classifier for `Is_Adulterated` from the tabular data
in `../archive/milk_combined_full_dataset.csv`. It is separate from the DoodhDrishti
web app and does **not** analyze uploaded photos.

## Important limitation

The source dataset's README explicitly describes all 2,500 samples and measurements
as synthetically generated. The model and its metrics are suitable only for a
technical demo or pipeline exercise. They do not show that the model can detect
adulteration in real milk or support food-safety decisions.

The separate `../archive (1)/milknew.csv` file is not combined with this dataset:
it has a different schema and target, and 976 of its 1,059 rows are exact
duplicates. Neither dataset contains images.

## Project layout

```text
milk_ml_project/
  data/README.md
  models/                 saved model bundle (generated)
  outputs/                reports and plots (generated)
  train.py
  predict.py
  requirements.txt
```

The source CSV is left in its existing `archive/` directory rather than copied.

## Setup (Windows PowerShell)

```powershell
py -3 -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
python -m pip install -r requirements.txt
```

## Train and evaluate

From this directory:

```powershell
python train.py
```

Or specify a CSV and output locations:

```powershell
python train.py --data-path ..\archive\milk_combined_full_dataset.csv
```

The script removes exact duplicate rows, checks the binary target, converts
approved measurements to numeric values, and imputes missing feature values with
training-fold medians. It reports IQR outliers but does not automatically delete
them, since unusual measurements may be meaningful adulteration signals.

It uses only a preselected list of numeric measurements. Identifiers, brand and
market metadata, direct qualitative spot-test results, reference metadata, and
known target-derived fields (such as compliance and quality/adulteration scores)
are excluded to reduce leakage. All preprocessing is fitted inside each model
pipeline. Since only numeric measurements are used, no categorical encoding is
needed; logistic regression standardizes features, while the tree models use
unscaled values. IQR outliers are counted from the training split and reported,
not deleted or clipped automatically.

Stratified splits use `random_state=42`: 70% train, 15% validation, and 15% test.
Hyperparameters are tuned using five-fold stratified cross-validation on the
training split only. The validation split selects the model and its
F1-maximizing decision threshold; the test split is reserved for final reporting.

Models compared:

1. Class-weighted logistic regression baseline.
2. Class-weighted random forest with a small grid search.
3. Class-weighted histogram gradient boosting with a small grid search.

The comparison reports accuracy, precision, recall, F1, ROC-AUC, and average
precision. Because only about 5% of the synthetic examples are positive,
precision/recall/F1 and average precision are more informative than accuracy
alone.

Generated files:

- `models/best_model.joblib`: selected model, feature names, decision threshold.
- `outputs/dataset_profile.json`: schema, target balance, missingness, splits,
  and IQR outlier counts.
- `outputs/model_comparison.csv`, `outputs/metrics.json`.
- `outputs/confusion_matrix.png`, `outputs/feature_importance.png`, and
  `outputs/learning_curve.png`.

## Predict from a new CSV

The input CSV must have all the measured feature columns listed by the saved model.
Missing values within those columns are imputed by the saved pipeline; extra
columns are ignored.

```powershell
python predict.py --input .\new_samples.csv --output .\predictions.csv
```

Predictions are estimates from synthetic training data only. Do not use them to
assess real product safety, brand quality, or regulatory compliance.

## Results

Run on 2,500 rows and 67 approved numeric measurement features. The stratified
split produced 1,750 training, 375 validation, and 375 test samples; the test set
contains 357 pure and 18 adulterated samples.

| Model | 5-fold train CV F1 | Test precision | Test recall | Test F1 | Test ROC-AUC | Test average precision |
|---|---:|---:|---:|---:|---:|---:|
| Logistic regression | 0.918 | 0.941 | 0.889 | 0.914 | 0.999 | 0.980 |
| Histogram gradient boosting | 0.943 | 1.000 | 0.833 | 0.909 | 0.999 | 0.983 |
| Random forest (selected) | 0.970 | 1.000 | 1.000 | 1.000 | 1.000 | 1.000 |

Random forest was selected using validation F1; its validation-optimized
probability threshold is 0.4067. On the held-out test split it classified all
357 pure and 18 adulterated rows correctly (confusion matrix: `[[357, 0],
[0, 18]]`). The saved comparison, metrics, confusion matrix, feature importance,
and learning curve are in `outputs/`.

These exceptionally high scores are **not evidence of real-world accuracy**:
the source is synthetic, labels and measurements were generated together, and
there are only 18 positive examples in the test split. Independent, real,
lab-verified samples are required to assess generalization.

## Next improvements

- Replace synthetic examples with independently collected, lab-verified samples.
- Ensure train/validation/test splits group samples by source batch and collection
  site when those identifiers are available.
- Validate the measurement features against the actual sensor/protocol available
  in the deployed product; this model currently expects tabular instrument
  measurements, not phone images.
- Have dairy/food-safety experts review labels, measurement protocols, and
  evaluation criteria before any real-world use.
