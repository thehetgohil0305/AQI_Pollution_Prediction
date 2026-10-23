# Testing checklist

- [ ] Place the dataset at `backend/data/air_quality.csv`.
- [ ] Confirm the target column in `backend/config.py`.
- [ ] Run `python train_model.py` successfully.
- [ ] Verify `backend/models/metadata.json` contains actual metrics.
- [ ] Start Flask and open `http://127.0.0.1:5000/api/health`.
- [ ] Confirm `/api/metadata` returns the trained model's features.
- [ ] Start Next.js and open `http://localhost:3000`.
- [ ] Confirm API connected status appears.
- [ ] Submit a single prediction with plausible feature values.
- [ ] Upload a CSV with the expected feature columns for batch prediction.
- [ ] Check browser console and terminal logs for errors.
- [ ] Document actual test results and screenshots in the report.
