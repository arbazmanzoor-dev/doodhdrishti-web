# DoodhDrishti ML pipeline. Run `make setup` once, then the steps in order.
PY := .venv/bin/python

.PHONY: setup labels roi features explore train serve all

setup:
	uv venv --python 3.12 .venv
	uv pip install --python $(PY) -r requirements.txt

labels:
	$(PY) -m src.labels

roi: labels
	$(PY) -m src.roi

features: labels
	$(PY) -m src.features

explore: features
	$(PY) -m src.explore

train: labels
	$(PY) -m src.train

serve:
	.venv/bin/uvicorn api.main:app --host 0.0.0.0 --port 8001 --reload

all: labels roi features explore train
