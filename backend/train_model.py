import json
import sys
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.impute import SimpleImputer
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.ensemble import RandomForestRegressor
from sklearn.preprocessing import OneHotEncoder

from config import DATA_PATH, MODEL_DIR, RANDOM_STATE, TARGET_COLUMN, TEST_SIZE

TARGET_CANDIDATES = [
    "AQI", "aqi", "Air Quality Index", "air_quality_index",
    "PM2.5", "PM25", "PM2_5", "pm2.5", "pm25", "pm2_5"
]
DROP_LIKE = {"date", "datetime", "time", "timestamp", "record_id", "id"}


def find_target(df):
    if TARGET_COLUMN:
        if TARGET_COLUMN not in df.columns:
            raise ValueError(
                f"TARGET_COLUMN={TARGET_COLUMN!r} not found. Available columns: {list(df.columns)}"
            )
        return TARGET_COLUMN
    for candidate in TARGET_CANDIDATES:
        if candidate in df.columns:
            return candidate
    # Case-insensitive fallback
    lower = {str(c).strip().lower(): c for c in df.columns}
    for candidate in TARGET_CANDIDATES:
        if candidate.lower() in lower:
            return lower[candidate.lower()]
    raise ValueError(
        "Could not detect AQI or PM2.5 target. Set TARGET_COLUMN in config.py. "
        f"Available columns: {list(df.columns)}"
    )


def main():
    if not DATA_PATH.exists():
        print(f"Dataset not found: {DATA_PATH}")
        print("Place your CSV at backend/data/city_day.csv")
        sys.exit(1)

    df = pd.read_csv(DATA_PATH)
    df.columns = [str(c).strip() for c in df.columns]
    if df.empty:
        raise ValueError("Dataset is empty.")
    target = find_target(df)
    df[target] = pd.to_numeric(df[target], errors="coerce")
    df = df.dropna(subset=[target]).copy()
    if len(df) < 20:
        raise ValueError("Need at least 20 valid rows to train a basic model.")

    y = df[target]
    X = df.drop(columns=[target])
    drop_cols = [c for c in X.columns if str(c).strip().lower() in DROP_LIKE]
    X = X.drop(columns=drop_cols, errors="ignore")
    # Avoid accidental leakage from duplicate target-like columns.
    leakage_cols = [c for c in X.columns if str(c).strip().lower() in {
        "aqi", "air quality index", "air_quality_index", "pm2.5", "pm25", "pm2_5"
    }]
    X = X.drop(columns=leakage_cols, errors="ignore")
    if X.shape[1] == 0:
        raise ValueError("No usable input features remain after removing target/leakage columns.")

    numeric_cols = X.select_dtypes(include=["number"]).columns.tolist()
    categorical_cols = [c for c in X.columns if c not in numeric_cols]
    transformers = []
    if numeric_cols:
        transformers.append(("num", Pipeline([
            ("imputer", SimpleImputer(strategy="median"))
        ]), numeric_cols))
    if categorical_cols:
        transformers.append(("cat", Pipeline([
            ("imputer", SimpleImputer(strategy="most_frequent")),
            ("onehot", OneHotEncoder(handle_unknown="ignore"))
        ]), categorical_cols))

    preprocessor = ColumnTransformer(transformers=transformers, remainder="drop")
    model = Pipeline([
        ("preprocessor", preprocessor),
        ("regressor", RandomForestRegressor(
            n_estimators=180, random_state=RANDOM_STATE, n_jobs=-1,
            min_samples_leaf=2
        ))
    ])

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=TEST_SIZE, random_state=RANDOM_STATE
    )
    model.fit(X_train, y_train)
    preds = model.predict(X_test)
    baseline = np.full(len(y_test), float(y_train.median()))

    metrics = {
        "mae": round(float(mean_absolute_error(y_test, preds)), 4),
        "rmse": round(float(np.sqrt(mean_squared_error(y_test, preds))), 4),
        "r2": round(float(r2_score(y_test, preds)), 4) if len(y_test) > 1 else None,
        "baseline_mae": round(float(mean_absolute_error(y_test, baseline)), 4),
        "rows": int(len(df)),
        "train_rows": int(len(X_train)),
        "test_rows": int(len(X_test)),
        "target": str(target),
        "target_unit_note": "PM2.5 concentration, not AQI" if "pm2" in target.lower().replace(".", "") else "Confirm target definition and units in the source dataset.",
        "features": list(X.columns),
        "numeric_features": numeric_cols,
        "categorical_features": categorical_cols,
        "dataset_file": DATA_PATH.name
    }

    MODEL_DIR.mkdir(parents=True, exist_ok=True)
    joblib.dump({"model": model, "features": list(X.columns), "target": target}, MODEL_DIR / "model.joblib")
    (MODEL_DIR / "metadata.json").write_text(json.dumps(metrics, indent=2), encoding="utf-8")
    print("Training complete.")
    print(json.dumps(metrics, indent=2))
    print(f"Saved model to {MODEL_DIR / 'model.joblib'}")


if __name__ == "__main__":
    main()
