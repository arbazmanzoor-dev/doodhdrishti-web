# DoodhDrishti ML pipeline

Learns to estimate added water (and starch) in milk from a phone photo. The photo is taken from above, with the flash on, of milk in a clear container on a black background. Watered milk scatters less light, so the black background shows through and the milk looks greyer and slightly bluish.

The pipeline goes photo → milk-surface crop → colour features → Random Forest models → API for the web app.

## Setup

You need Python 3.12 and [uv](https://docs.astral.sh/uv/).

```bash
make setup
```

This creates `.venv/` and installs `requirements.txt`. The project uses `opencv-python-headless`, which is the same OpenCV without desktop window support, so it also runs on servers.

## Naming your photos

Put photos in `data/raw/`. The label is read from the filename, so the name must follow this pattern:

```
<milktype>_w<water%>_s<starch%>_phone<ID>_r<round>_<nn>.jpg
cow_w20_s0_phoneA_r1_03.jpg  →  cow milk, 20% water, 0% starch, phone A, round 1, photo 3
```

| Part | Meaning | Examples |
|---|---|---|
| `milktype` | letters only | `cow`, `buffalo`, `mixed` |
| `w<n>` | % water added by volume (decimals allowed) | `w0`, `w5`, `w12.5` |
| `s<n>` | % starch added | `s0`, `s1` |
| `phone<ID>` | which phone took it | `phoneA`, `phone2` |
| `r<n>` | round: one fresh pour of that mix | `r1`, `r2` |
| `<nn>` | photo number within that pour | `01`, `02` |

A **sample** is everything except the photo number, so it means one pour of one mix, photographed with one phone. Photos of the same sample are never split between training and testing. If you photograph the same mix again on another day, or with another phone, that counts as a new sample.

`make labels` lists any file that doesn't match the pattern. Those files are skipped, not guessed.

## Taking good photos

The model can only learn differences that are bigger than the photo-to-photo noise. `make explore` measures that noise.

- Use the same container, the same amount of milk, the same height and a black background every time.
- Flash on, dim room, with no other lights reflecting on the milk.
- Lock exposure and focus if your camera allows it: on iPhone, long-press the milk, and on Android, use Pro mode. Auto-exposure is the biggest source of noise.
- Take 5–10 photos per pour, and stir between pours.

### Making labelled dilutions

Start with milk you trust as pure, then mix it with water by volume. For example, with 10 ml total:

| Label | Milk | Water |
|---|---|---|
| `w0` | 10 ml | 0 ml |
| `w5` | 9.5 ml | 0.5 ml |
| `w10` | 9 ml | 1 ml |
| `w20` | 8 ml | 2 ml |
| `w30` | 7 ml | 3 ml |

Training needs at least 2 water levels, and at least 2 samples per level. You get 2 samples per level by repeating the session as round `r2`, or by using a second phone. Both settings are in `config.yaml`.

## Running the steps

```bash
make labels    # data/labels.csv from filenames
make roi       # outputs/roi_debug/*_roi.jpg: check the green area sits on the milk
make features  # outputs/features.csv
make explore   # outputs/feature_vs_water.png + noise vs signal table
make train     # models/doodhdrishti.joblib + outputs/report.md (only if there's enough data)
make serve     # API on http://localhost:8001
make all       # labels → roi → features → explore → train
```

**Check the ROI images first.** The green area is what the model measures. If it lands on the container wall or on glare, set a manual crop for that photo in `config.yaml` under `roi.manual_crops`. Values are fractions of the image width and height.

### What `train` does

- **Labels:** the verdict is Pure when water < 5% and starch is 0. Otherwise it's Adulterated. You can change these thresholds in `config.yaml`.
- **Models:** a Random Forest classifier gives the verdict, and two Random Forest regressors give water % and starch %. The inputs are 28 colour/texture features, scaled, plus milk type.
- **Evaluation:**
  - With more than one round, each round is held out in turn (leave-one-round-out). This tests whether a model trained on one day works on another day.
  - With one round, photos are grouped by sample, so the same pour is never in both training and test.
- **Report:** `outputs/report.md` gives accuracy, a confusion matrix, water % error per level, and feature importance.
- **Not enough data:** if there aren't enough samples, `train` explains what's missing and stops without training. Features are still saved.

The report's numbers describe your photos and setup only. They are not a lab-validated accuracy.

## Predicting

```bash
.venv/bin/python -m src.predict path/to/photo.jpg --milk-type cow
# {"verdict": "adulterated", "water_pct": 18.4, "starch_pct": 0.0, "confidence": 0.93}
```

### API (for the web app)

```bash
make serve   # http://localhost:8001, docs at /docs
```

`POST /predict` takes multipart form fields `image` and `milk_type` (default `unknown`). Optional fields `farmer_id` and `centre_id` are accepted but not used yet. It returns:

```json
{"verdict": "pure", "water_pct": 2.1, "starch_pct": 0.0, "confidence": 0.88,
 "sample_id": "ml-3f9c0a1b2c4d", "created_at": "2026-10-31T13:20:00Z"}
```

- `verdict` is lowercase `pure` or `adulterated`, which matches the web app.
- `confidence` is the classifier's highest class probability.
- `503` means no model has been trained yet, and `422` means the photo couldn't be read or no milk was found.
- `GET /health` shows the model version.
- CORS is open, so the React app can call it from its own port.

The service reloads the model automatically after retraining. It runs on port 8001 so it doesn't clash with the main backend on 8000.

## Adding photos and retraining

1. Copy the new photos into `data/raw/` with correct names.
2. Run `make roi` and look at the new debug images.
3. Run `make explore` and check the feature plots trend with water %.
4. Run `make train`, then read `outputs/report.md`.

## Project layout

```
config.yaml         paths, ROI settings, label thresholds, model settings
data/raw/           your photos (labels in the filenames)
src/labels.py       filenames → data/labels.csv
src/roi.py          milk-surface detection + debug images
src/features.py     colour/texture features → outputs/features.csv
src/explore.py      feature-vs-water plot + consistency check
src/train.py        sufficiency check, cross-validation, training, report
src/predict.py      command-line prediction (shared with the API)
api/main.py         FastAPI service
models/             trained model bundle (not committed)
outputs/            reports, plots, debug images (regenerated)
```

## Rules this project keeps

- **No fake data:** no synthetic photos and no augmented labels. Every training example is a real photo of a mix with a known water content.
- **Trusted models only:** `.joblib` model files can run code when loaded, so only load ones from people you trust.
