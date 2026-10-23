 "use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis,
  BarChart, Bar
} from "recharts";

const API = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:5000";

function MetricCard({ icon, label, value, hint }) {
  return (
    <div className="metric-card">
      <div className="metric-icon"><i className={`bi ${icon}`} /></div>
      <div className="metric-label">{label}</div>
      <div className="metric-value">{value}</div>
      <div className="metric-hint">{hint}</div>
    </div>
  );
}

function valueText(value, digits = 2) {
  return value === null || value === undefined || Number.isNaN(Number(value))
    ? "—" : Number(value).toLocaleString(undefined, { maximumFractionDigits: digits });
}

export default function Dashboard() {
  const [health, setHealth] = useState(null);
  const [meta, setMeta] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [prediction, setPrediction] = useState(null);
  const [formValues, setFormValues] = useState({});
  const [batchFile, setBatchFile] = useState(null);
  const [batchMessage, setBatchMessage] = useState("");

  const refresh = useCallback(async () => {
    try {
      const [h, m] = await Promise.all([
        fetch(`${API}/api/health`),
        fetch(`${API}/api/metadata`)
      ]);
      setHealth(await h.json());
      const data = await m.json();
      if (m.ok) {
        setMeta(data);
        setFormValues((old) => {
          const next = { ...old };
          (data.features || []).forEach((feature) => {
            if (!(feature in next)) next[feature] = "";
          });
          return next;
        });
        setError("");
      } else {
        setMeta(null);
        setError(data.error || "Model metadata is not available. Train the model first.");
      }
    } catch {
      setHealth(null);
      setError("Cannot connect to Flask API. Start the backend at http://127.0.0.1:5000.");
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const featureChart = useMemo(() =>
    (meta?.features || []).slice(0, 8).map((name, index) => ({
      name: name.length > 13 ? `${name.slice(0, 12)}…` : name,
      value: Math.max(1, 8 - index)
    })), [meta]);

  async function submitPrediction(event) {
    event.preventDefault();
    setBusy(true);
    setPrediction(null);
    setError("");
    try {
      const record = {};
      (meta?.features || []).forEach((feature) => {
        const raw = formValues[feature];
        record[feature] = raw === "" || raw === undefined ? null :
          (Number.isFinite(Number(raw)) ? Number(raw) : raw);
      });
      const response = await fetch(`${API}/api/predict`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ record })
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Prediction failed.");
      setPrediction({ value: result.predictions[0], target: result.target });
    } catch (e) {
      setError(e.message || "Prediction failed.");
    } finally {
      setBusy(false);
    }
  }

  async function submitBatch(event) {
    event.preventDefault();
    if (!batchFile) {
      setBatchMessage("Choose a CSV file first.");
      return;
    }
    setBusy(true);
    setBatchMessage("");
    try {
      const body = new FormData();
      body.append("file", batchFile);
      const response = await fetch(`${API}/api/batch-predict`, { method: "POST", body });
      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || "Batch prediction failed.");
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = "aqi_predictions.csv";
      anchor.click();
      URL.revokeObjectURL(url);
      setBatchMessage("Predictions generated. Your CSV download should begin.");
    } catch (e) {
      setBatchMessage(e.message || "Batch prediction failed.");
    } finally {
      setBusy(false);
    }
  }

  const target = meta?.target || "AQI";
  const targetNote = target.toLowerCase().replace(/[.\s_-]/g, "").includes("pm25")
    ? "Predicted PM2.5 concentration — not AQI"
    : "Confirm target units against your dataset";

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="brand"><div className="brand-mark"><i className="bi bi-wind" /></div>
          <div><strong>AirScope</strong><span>AI LABS</span></div>
        </div>
        <div className="side-caption">WORKSPACE</div>
        <a className="side-link active" href="#overview"><i className="bi bi-grid-1x2" /> Overview</a>
        <a className="side-link" href="#predict"><i className="bi bi-cpu" /> Prediction studio</a>
        <a className="side-link" href="#model"><i className="bi bi-graph-up-arrow" /> Model insights</a>
        <div className="sidebar-bottom">
          <div className="status-dot" />
          <div><strong>ML service</strong><small>{health?.model_trained ? "Model ready" : "Awaiting model"}</small></div>
        </div>
      </aside>

      <section className="main-content">
        <header className="topbar">
          <div><span className="eyebrow">ENVIRONMENT INTELLIGENCE</span><h1>Air quality dashboard</h1></div>
          <button className="btn btn-light refresh-btn" onClick={refresh}><i className="bi bi-arrow-clockwise me-2" />Refresh data</button>
        </header>

        <section className="hero-panel" id="overview">
          <div className="hero-copy">
            <span className="hero-tag"><i className="bi bi-stars me-2" /> MACHINE LEARNING INSIGHTS</span>
            <h2>Understand the air.<br /><em>Predict what’s next.</em></h2>
            <p>Explore pollution patterns and generate estimates from your trained machine-learning model.</p>
            <a className="btn btn-hero" href="#predict">Make a prediction <i className="bi bi-arrow-up-right ms-2" /></a>
          </div>
          <div className="hero-art" aria-hidden="true">
            <div className="orb orb-one" /><div className="orb orb-two" />
            <div className="air-ring ring-one" /><div className="air-ring ring-two" />
            <div className="air-core"><i className="bi bi-wind" /></div>
            <span className="float-chip chip-top"><i className="bi bi-activity" /> Air signals</span>
            <span className="float-chip chip-bottom"><i className="bi bi-shield-check" /> Model-driven</span>
          </div>
        </section>

        {error && <div className="alert alert-warning mt-4" role="alert"><i className="bi bi-exclamation-triangle me-2" />{error}</div>}

        <div className="section-heading"><div><span className="eyebrow">AT A GLANCE</span><h3>Model overview</h3></div>
          <span className={`api-pill ${health?.status === "ok" ? "online" : ""}`}><span />{health?.status === "ok" ? "API connected" : "API offline"}</span>
        </div>
        <div className="metric-grid">
          <MetricCard icon="bi-database" label="Dataset rows" value={meta ? valueText(meta.rows, 0) : "—"} hint="Rows used after target cleanup" />
          <MetricCard icon="bi-bullseye" label="Prediction target" value={meta?.target || "Not set"} hint={targetNote} />
          <MetricCard icon="bi-speedometer2" label="Test MAE" value={meta ? valueText(meta.mae, 3) : "—"} hint="Lower is generally better" />
          <MetricCard icon="bi-bezier2" label="R² score" value={meta ? valueText(meta.r2, 3) : "—"} hint="Test-set model score" />
        </div>

        <div className="content-grid">
          <section className="panel prediction-panel" id="predict">
            <div className="panel-heading"><div><span className="eyebrow">INTERACTIVE TOOL</span><h3>Prediction studio</h3></div><span className="panel-icon"><i className="bi bi-sliders2" /></span></div>
            <p className="muted">Enter values for the input features used during training. Missing values are imputed by the pipeline.</p>
            {meta?.features?.length ? <form onSubmit={submitPrediction}>
              <div className="feature-fields">
                {meta.features.slice(0, 16).map((feature) => (
                  <div className="feature-field" key={feature}>
                    <label className="form-label" htmlFor={`feature-${feature}`}>{feature}</label>
                    <input className="form-control" id={`feature-${feature}`} value={formValues[feature] ?? ""}
                      onChange={(e) => setFormValues((old) => ({ ...old, [feature]: e.target.value }))}
                      placeholder={`Enter ${feature}`} />
                  </div>
                ))}
              </div>
              {meta.features.length > 16 && <p className="small text-secondary mt-2">Showing first 16 of {meta.features.length} features. Remaining features will be imputed.</p>}
              <button className="btn btn-primary action-btn" type="submit" disabled={busy}>{busy ? "Working…" : "Generate prediction"} <i className="bi bi-arrow-right ms-2" /></button>
            </form> : <div className="empty-state"><i className="bi bi-database-exclamation" /><strong>Model metadata unavailable</strong><span>Train the model and refresh this dashboard.</span></div>}
            {prediction && <div className="prediction-result"><span>ESTIMATED {prediction.target.toUpperCase()}</span><strong>{valueText(prediction.value, 3)}</strong><small>Model estimate only; interpret using the source dataset’s units and context.</small></div>}
          </section>

          <section className="panel insights-panel" id="model">
            <div className="panel-heading"><div><span className="eyebrow">MODEL EXPLORER</span><h3>Feature snapshot</h3></div><span className="panel-icon"><i className="bi bi-bar-chart-line" /></span></div>
            <p className="muted">Preview of the input columns supplied to the model. This is not a feature-importance ranking.</p>
            <div className="chart-wrap">
              {featureChart.length ? <ResponsiveContainer width="100%" height="100%">
                <BarChart data={featureChart} margin={{ top: 10, right: 8, left: -22, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e9edf3" />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#7d8797" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: "#7d8797" }} axisLine={false} tickLine={false} />
                  <Tooltip />
                  <Bar dataKey="value" name="Display index" fill="#3c9c86" radius={[5, 5, 0, 0]} />
                </BarChart>
              </ResponsiveContainer> : <div className="chart-empty">Train the model to display feature names.</div>}
            </div>
            <div className="insight-note"><i className="bi bi-info-circle" /><span><strong>Evaluation tip</strong> Compare MAE with the baseline MAE in your report. A lower model MAE is evidence the model improves over the simple median baseline.</span></div>
          </section>
        </div>

        <section className="panel batch-panel">
          <div className="panel-heading"><div><span className="eyebrow">BATCH PROCESSING</span><h3>Predict from a CSV</h3></div><span className="panel-icon"><i className="bi bi-file-earmark-spreadsheet" /></span></div>
          <p className="muted">Upload a CSV containing the same feature columns as your training data. The backend returns a new CSV with a prediction column.</p>
          <form className="batch-form" onSubmit={submitBatch}>
            <input className="form-control" type="file" accept=".csv,text/csv" onChange={(e) => setBatchFile(e.target.files?.[0] || null)} />
            <button className="btn btn-outline-primary action-btn" disabled={busy} type="submit"><i className="bi bi-download me-2" />Run batch prediction</button>
          </form>
          {batchMessage && <div className="small mt-3" role="status">{batchMessage}</div>}
        </section>

        <footer className="footer"><span>AirScope AI · AQI & Pollution Prediction</span><span>Academic prototype · Validate before real-world use</span></footer>
      </section>
    </main>
  );
}
