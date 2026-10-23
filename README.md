# AirScope AI — AQI & Pollution Prediction

Full-stack college project with a **Next.js frontend** and a Flask/scikit-learn machine-learning backend.

## Stack
- Frontend: Next.js App Router, JavaScript, Bootstrap, Bootstrap Icons, Recharts
- Backend: Python, Flask, Flask-CORS, Pandas, scikit-learn, Joblib
- ML: Random Forest regression with a median baseline for comparison

## 1. Requirements
- Python 3.10+
- Node.js 20+
- npm

## 2. Add a dataset
Download a CSV dataset and place it at `backend/data/air_quality.csv`.

Possible source: https://www.kaggle.com/datasets/rohanrao/air-quality-data-in-india

The dataset columns vary. This project tries to detect an AQI target first, then PM2.5. Check `backend/config.py` and set `TARGET_COLUMN` to the exact column name in your CSV if auto-detection selects the wrong one. If the target is PM2.5, predictions represent PM2.5 concentration, **not AQI**.

## 3. Train the model
Open PowerShell in the project root:

```powershell
cd backend
py -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python train_model.py
```

Training prints MAE, RMSE and R². It saves the model and metadata to `backend/models/`. Do not report model performance until you have run training on your actual dataset.

## 4. Start the backend
In the same backend terminal, after training:

```powershell
python app.py
```

Backend URL: http://127.0.0.1:5000

## 5. Start Next.js
Open a second terminal:

```powershell
cd frontend
npm install
npm run dev
```

Open http://localhost:3000

## Notes
- The dashboard checks the Flask API at runtime.
- Prediction inputs are based on the selected model features. Check `GET /api/metadata` for the actual feature list.
- For a valid project evaluation, document the dataset source, preprocessing, train/test split, metrics and limitations.
