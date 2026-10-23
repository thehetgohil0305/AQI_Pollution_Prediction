# AQI & Pollution Level Prediction — Project Report Template

## 1. Abstract
Describe the air-quality problem, selected dataset, prediction target, model, and web application. Fill in actual findings after running the project.

## 2. Problem statement
Air pollution varies with environmental and pollutant measurements. This project explores whether available historical features can estimate a selected air-quality target and presents estimates through a dashboard.

## 3. Objectives
- Prepare and inspect an air-quality dataset.
- Clean missing/invalid target values and impute missing input values.
- Train a regression model and compare it with a simple median baseline.
- Evaluate predictions using MAE, RMSE and R².
- Expose the trained model through a Flask API.
- Build a responsive Next.js dashboard for single and batch predictions.

## 4. Dataset
- Source and URL:
- Date range:
- Number of records after cleaning:
- Input columns:
- Target column and units:
- Missing-data handling:
- Limitations/licensing:

## 5. Methodology
1. Load CSV and inspect columns.
2. Select the target column.
3. Remove rows without a valid target.
4. Split data into training and test subsets.
5. Impute missing numeric/categorical features and one-hot encode categorical features.
6. Train Random Forest regression.
7. Compare with the median baseline.
8. Serve predictions using Flask and call the API from Next.js.

## 6. Results
Copy actual values from `backend/models/metadata.json` after training.

| Metric | Actual result |
|---|---|
| MAE | Fill after training |
| RMSE | Fill after training |
| R² | Fill after training |
| Baseline MAE | Fill after training |
| Training rows | Fill after training |
| Test rows | Fill after training |

Do not invent results. Explain what each metric means and whether the model beats the baseline.

## 7. System architecture
CSV dataset → preprocessing pipeline → Random Forest model → Flask REST API → Next.js dashboard.

## 8. Modules
- Dataset and preprocessing
- Model training and evaluation
- Prediction API
- Dashboard and charts
- Single-record prediction
- Batch CSV prediction

## 9. Limitations and future scope
Discuss geographic/time coverage, missing data, possible leakage, model generalization, and the distinction between pollutant concentration and AQI. Future work can include time-aware validation, model comparisons, calibrated AQI category classification, and live data integration.

## 10. Conclusion
Write this after reviewing the actual model metrics and testing the UI/API.
