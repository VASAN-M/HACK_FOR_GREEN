# 🌿 GreenBharat AI — Real-Time Environmental Intelligence System

A real-time air quality monitoring and AI-powered sustainability advisor for Indian cities, built with the **Pathway** framework for **Hack For Green Bharat 2026**.

## 🎯 What It Does

- **Live AQI Monitoring** — Tracks air quality across 8 Indian cities (Delhi, Mumbai, Bangalore, Chennai, Kolkata, Hyderabad, Pune, Jaipur) with real-time updates
- **Anomaly Detection** — Auto-detects pollution spikes (PM2.5 > 60, AQI > 200) and issues CRITICAL/WARNING alerts
- **AI Environmental Advisor** — RAG-powered chat that answers questions about air quality, sustainability, and India's climate using a curated knowledge base
- **Live Dashboard** — Premium dark-themed dashboard with gauges, charts, alert feed, and AI chat — all auto-updating every 3 seconds

## 🏗️ Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌──────────────┐    ┌───────────┐
│ Data Simulator   │───▶│ Pathway Pipeline  │───▶│ REST API     │───▶│ Dashboard │
│ (data_simulator) │    │ (pipeline.py)     │    │ (api_server) │    │ (frontend)│
│ Simulated IoT    │    │ Stream Processing │    │ Flask Server │    │ HTML/JS   │
│ sensor data      │    │ AQI + Anomalies   │    │              │    │ Chart.js  │
└─────────────────┘    └──────────────────┘    └──────┬───────┘    └───────────┘
                                                       │
┌─────────────────┐                           ┌──────▼───────┐
│ Knowledge Base   │──────────────────────────▶│ RAG Server   │
│ (knowledge/*.md) │   Auto-indexes on change  │ (rag_server) │
│ AQI, Climate,    │                           │ Pathway LLM  │
│ Sustainability   │                           └──────────────┘
└─────────────────┘
```

## 🔧 Pathway Usage

| Feature | Pathway Component | Purpose |
|---------|-------------------|---------|
| Live Data Ingestion | `pw.io.csv.read()` | Watches `./data/` for new sensor data |
| Stream Processing | `.filter()`, `.groupby().reduce()` | Real-time AQI aggregation & anomaly detection |
| Output Streaming | `pw.io.jsonlines.write()` | Writes processed results as JSONL |
| Live RAG Index | `DocumentStore` + `BruteForceKnnFactory` | Auto-updating vector index for Q&A |
| Knowledge Server | `DocumentStoreServer` | Serves RAG queries via HTTP |

**One-line rule compliance**: ✅ The system automatically updates when new data arrives — Pathway's reactive engine ensures all outputs reflect the latest data.

## 📦 Setup & Run

### Prerequisites
- Python 3.10+
- Linux/WSL (Pathway requires Linux)

### Install
```bash
cd hackforgreen
pip install -r requirements.txt
```

### Run (3 terminals)

**Terminal 1** — Start the data simulator:
```bash
python data_simulator.py
```

**Terminal 2** — Start the Pathway pipeline:
```bash
python pipeline.py
```

**Terminal 3** — Start the API + Dashboard:
```bash
python api_server.py
```

Open **http://localhost:5000** in your browser.

### Optional: RAG Server (Terminal 4)
```bash
# Set your OpenAI key first
export OPENAI_API_KEY=your_key_here
python rag_server.py
```

> Without an API key, the RAG server runs in fallback mode with keyword matching.

## 📁 Project Structure

```
hackforgreen/
├── data/                     # Live data directory (Pathway watches this)
├── knowledge/                # RAG knowledge base
│   ├── air_quality_guidelines.md
│   ├── sustainability_tips.md
│   └── climate_india.md
├── output/                   # Pathway JSONL outputs (auto-generated)
├── data_simulator.py         # Simulates live sensor data
├── pipeline.py               # Pathway streaming pipeline
├── rag_server.py             # RAG Q&A server
├── api_server.py             # REST API + frontend server
├── frontend/
│   ├── index.html            # Dashboard UI
│   ├── style.css             # Dark glassmorphism theme
│   └── app.js                # Real-time charts & data fetching
├── requirements.txt
├── .env.example
└── README.md
```

## 🛤️ Tracks

- ✅ **Sustainability** — real-time environmental monitoring, green recommendations
- ✅ **Climate & Environment** — pollution tracking, AQI analysis, weather data
- ✅ **AI / Machine Learning** — RAG pipeline, real-time streaming ML

## 🏆 Key Features

1. **Real-time streaming** — Data updates every 4 seconds, dashboard refreshes every 3 seconds
2. **Pathway-native** — Uses Pathway for both stream processing AND RAG indexing
3. **Auto-updating** — Add/modify knowledge docs → RAG answers adapt instantly
4. **8 city coverage** — Delhi, Mumbai, Bangalore, Chennai, Kolkata, Hyderabad, Pune, Jaipur
5. **Anomaly detection** — Automated pollution spike alerts with severity levels
6. **AI chat** — Ask questions about air quality, sustainability, and climate in natural language

---

**Built for Hack For Green Bharat 2026 🇮🇳**
**Powered by Pathway Real-Time Framework**
