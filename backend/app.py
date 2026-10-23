import json
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from flask import Flask, jsonify, request
from flask_cors import CORS

from config import DATA_PATH, MODEL_DIR

app = Flask(__name__)
CORS(app)
MODEL_PATH = MODEL_DIR / "model.joblib"
META_PATH = MODEL_DIR / "metadata.json"


def load_metadata():
    if not META_PATH.exists():
        return None
    return json.loads(META_PATH.read_text(encoding="utf-8"))


def load_bundle():
    if not MODEL_PATH.exists():
        return None
    return joblib.load(MODEL_PATH)


@app.get("/api/health")
def health():
    return jsonify({
        "status": "ok",
        "model_trained": MODEL_PATH.exists(),
        "dataset_available": DATA_PATH.exists()
    })


@app.get("/api/metadata")
def metadata():
    meta = load_metadata()
    if meta is None:
        return jsonify({
            "error": "Model not trained yet. Add a CSV and run python train_model.py."
        }), 404
    return jsonify(meta)


@app.post("/api/predict")
def predict():
    bundle = load_bundle()
    if bundle is None:
        return jsonify({"error": "Model not trained. Run python train_model.py first."}), 503
    payload = request.get_json(silent=True) or {}
    rows = payload.get("records")
    if rows is None:
        rows = [payload.get("record", {})]
    if not isinstance(rows, list) or not rows:
        return jsonify({"error": "'records' must be a non-empty array."}), 400

    features = bundle["features"]
    frame = pd.DataFrame(rows)
    for col in features:
        if col not in frame.columns:
            frame[col] = np.nan
    frame = frame[features]
    try:
        values = bundle["model"].predict(frame)
    except Exception as exc:
        return jsonify({"error": f"Prediction failed: {str(exc)}"}), 400
    return jsonify({
        "target": bundle["target"],
        "predictions": [round(float(v), 4) for v in values]
    })


@app.post("/api/batch-predict")
def batch_predict():
    if "file" not in request.files:
        return jsonify({"error": "Upload a CSV using the 'file' field."}), 400
    file = request.files["file"]
    try:
        frame = pd.read_csv(file)
    except Exception as exc:
        return jsonify({"error": f"Could not read CSV: {str(exc)}"}), 400
    bundle = load_bundle()
    if bundle is None:
        return jsonify({"error": "Model not trained. Run python train_model.py first."}), 503
    features = bundle["features"]
    for col in features:
        if col not in frame.columns:
            frame[col] = np.nan
    try:
        frame["Predicted_" + str(bundle["target"])] = bundle["model"].predict(frame[features])
    except Exception as exc:
        return jsonify({"error": f"Prediction failed: {str(exc)}"}), 400
    from io import StringIO
    from flask import Response
    output = StringIO()
    frame.to_csv(output, index=False)
    return Response(
        output.getvalue(), mimetype="text/csv",
        headers={"Content-Disposition": "attachment; filename=aqi_predictions.csv"}
    )


if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000, debug=True)
