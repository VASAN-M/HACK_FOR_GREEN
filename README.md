GreenBharat AI

Real-Time Environmental Intelligence System








GreenBharat AI is a stream-driven environmental monitoring platform that combines real-time AQI processing, anomaly detection, and AI-powered sustainability guidance for Indian cities.

Built using the Pathway reactive streaming framework for Hack For Green Bharat 2026.

Overview

Most air quality platforms display static AQI values and historical charts. They do not:

Detect abnormal pollution spikes in real time

Provide contextual environmental explanations

Offer interactive sustainability guidance

React automatically to knowledge updates

GreenBharat AI integrates streaming analytics and retrieval-augmented AI into a unified environmental intelligence system.

Key Features
Real-Time AQI Monitoring

Simulated IoT data ingestion

Continuous stream processing

Aggregated AQI and PM2.5 metrics

Reactive dashboard updates

Anomaly Detection

Rule-based spike detection:

PM2.5 > 60 → WARNING

AQI > 200 → CRITICAL

Live alert feed integration

AI Environmental Advisor

Retrieval-Augmented Generation (RAG)

Auto-indexing markdown knowledge base

Natural language Q&A

Climate and sustainability guidance grounded in curated documents

Interactive Dashboard

Real-time gauges and trend charts

Alert stream

Integrated AI chat interface

Automatic refresh without manual reload

Supported Cities

Delhi

Mumbai

Bangalore

Chennai

Kolkata

Hyderabad

Pune

Jaipur

The architecture is city-agnostic and extensible.

Architecture
System Flow
Data Simulator
    ↓
Pathway Streaming Pipeline
    ↓
JSONL Output Stream
    ↓
REST API (Flask)
    ↓
Web Dashboard

Knowledge Base (Markdown)
    ↓
Pathway DocumentStore
    ↓
RAG Server
    ↓
Chat Interface

Technology Stack

Streaming Engine

Pathway

Backend

Python 3.10+

Flask

Frontend

HTML

CSS

JavaScript

Chart.js

AI / RAG

Pathway DocumentStore

BruteForceKnnFactory

OpenAI API (optional)

Data Format

CSV ingestion

JSONL streaming output

Repository Structure
hackforgreen/
│
├── data/                  # Live data directory
├── knowledge/             # Markdown knowledge base
├── output/                # Streamed JSONL output
│
├── src/
│   ├── backend/
│   ├── pipeline/
│   └── simulator/
│
├── frontend/
├── requirements.txt
└── README.md
Quick Start
Requirements

Python 3.10+

Linux or WSL (Pathway requires Linux runtime)

1. Clone Repository
git clone https://github.com/VASAN-M/HACK_FOR_GREEN.git
cd HACK_FOR_GREEN
2. Create Virtual Environment

Linux / WSL:

python3 -m venv venv
source venv/bin/activate
3. Install Dependencies
pip install -r requirements.txt
4. Run the System

Open three terminals.

Terminal 1 — Data Simulator

python -m src.simulator.data_simulator

Terminal 2 — Pathway Pipeline

python -m src.pipeline.pipeline

Terminal 3 — API Server

python -m src.backend.api_server

Access the dashboard at:

http://localhost:5000
Optional: Enable AI Chat (RAG Mode)

Set your OpenAI API key:

export OPENAI_API_KEY=your_key_here
python -m src.backend.rag_server

If no API key is provided, fallback keyword mode is used.

Design Principles

Streaming-first architecture

Modular service separation

Deterministic anomaly detection

Auto-updating knowledge index

Clear data contracts via JSONL

Limitations

Uses simulated IoT data

Threshold-based anomaly detection

No distributed scaling

No authentication layer

No persistent time-series storage

Future Improvements

Adaptive anomaly detection using rolling statistics

Predictive AQI forecasting

Cloud-native deployment

Distributed stream partitioning

Role-based access control

Persistent storage integration

Contributing

Contributions are welcome.

Fork the repository

Create a feature branch

Commit changes

Submit a pull request

Before submitting:

Ensure code runs in Linux/WSL

Follow modular structure inside src/

Keep changes focused and documented

License

This project is licensed under the MIT License.

Create a LICENSE file in the root with:

MIT License

Copyright (c) 2026 Vasanth
Acknowledgment

Built for Hack For Green Bharat 2026 using the Pathway real-time framework.