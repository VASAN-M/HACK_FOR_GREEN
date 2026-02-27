"""
GreenBharat AI — REST API Server
Bridges Pathway pipeline outputs to the frontend dashboard.
Reads JSONL output files and serves them as JSON API endpoints.
"""

import os
import json
import time
import requests
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from collections import defaultdict

app = Flask(__name__, static_folder="frontend")
CORS(app)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
OUTPUT_DIR = os.path.join(BASE_DIR, "output")
DATA_DIR = os.path.join(BASE_DIR, "data")
RAG_URL = "http://localhost:8011"

# Cache for parsed JSONL data
_cache = {}
_cache_time = {}
CACHE_TTL = 2  # seconds


def read_jsonl(filename):
    """Read a JSONL file and return list of dicts, with caching."""
    filepath = os.path.join(OUTPUT_DIR, filename)
    now = time.time()

    if filename in _cache and now - _cache_time.get(filename, 0) < CACHE_TTL:
        return _cache[filename]

    records = []
    if os.path.exists(filepath):
        try:
            with open(filepath, "r", encoding="utf-8") as f:
                for line in f:
                    line = line.strip()
                    if line:
                        try:
                            record = json.loads(line)
                            records.append(record)
                        except json.JSONDecodeError:
                            continue
        except Exception as e:
            print(f"[API] Error reading {filename}: {e}")

    _cache[filename] = records
    _cache_time[filename] = now
    return records


def read_csv_data():
    """Read the raw sensor CSV for trend data."""
    import csv
    filepath = os.path.join(DATA_DIR, "sensor_data.csv")
    records = []
    if os.path.exists(filepath):
        try:
            with open(filepath, "r", encoding="utf-8") as f:
                reader = csv.DictReader(f)
                for row in reader:
                    records.append(row)
        except Exception as e:
            print(f"[API] Error reading CSV: {e}")
    return records


# --- API Endpoints ---

@app.route("/api/aqi", methods=["GET"])
def get_aqi():
    """Get latest AQI readings per city."""
    records = read_csv_data()
    if not records:
        return jsonify({"cities": [], "last_update": None})

    # Get latest reading per city
    city_latest = {}
    for record in records:
        city = record.get("city", "")
        city_latest[city] = record

    cities = []
    for city, data in city_latest.items():
        cities.append({
            "city": city,
            "aqi": int(float(data.get("aqi", 0))),
            "aqi_category": data.get("aqi_category", "Unknown"),
            "pm25": float(data.get("pm25", 0)),
            "pm10": float(data.get("pm10", 0)),
            "no2": float(data.get("no2", 0)),
            "so2": float(data.get("so2", 0)),
            "co": float(data.get("co", 0)),
            "o3": float(data.get("o3", 0)),
            "temperature": float(data.get("temperature", 0)),
            "humidity": float(data.get("humidity", 0)),
            "wind_speed": float(data.get("wind_speed", 0)),
            "timestamp": data.get("timestamp", ""),
        })

    # Sort by AQI descending
    cities.sort(key=lambda x: -x["aqi"])

    return jsonify({
        "cities": cities,
        "last_update": cities[0]["timestamp"] if cities else None,
    })


@app.route("/api/alerts", methods=["GET"])
def get_alerts():
    """Get anomaly alerts."""
    records = read_csv_data()
    alerts = []
    for record in records:
        aqi = int(float(record.get("aqi", 0)))
        pm25 = float(record.get("pm25", 0))
        if aqi > 200 or pm25 > 60:
            alert_type = "CRITICAL" if aqi > 300 else "WARNING" if aqi > 200 else "CAUTION"
            alerts.append({
                "timestamp": record.get("timestamp", ""),
                "city": record.get("city", ""),
                "aqi": aqi,
                "pm25": pm25,
                "aqi_category": record.get("aqi_category", ""),
                "alert_type": alert_type,
            })

    # Return last 50 alerts, most recent first
    alerts.reverse()
    return jsonify({"alerts": alerts[:50], "total": len(alerts)})


@app.route("/api/trends", methods=["GET"])
def get_trends():
    """Get historical trend data for charts."""
    city = request.args.get("city", None)
    limit = int(request.args.get("limit", 100))

    records = read_csv_data()

    if city:
        records = [r for r in records if r.get("city") == city]

    # Return last N records
    records = records[-limit:]

    trends = []
    for record in records:
        trends.append({
            "timestamp": record.get("timestamp", ""),
            "city": record.get("city", ""),
            "aqi": int(float(record.get("aqi", 0))),
            "pm25": float(record.get("pm25", 0)),
            "pm10": float(record.get("pm10", 0)),
            "temperature": float(record.get("temperature", 0)),
            "humidity": float(record.get("humidity", 0)),
        })

    return jsonify({"trends": trends})


@app.route("/api/stats", methods=["GET"])
def get_stats():
    """Get city-wise aggregated stats."""
    records = read_jsonl("city_stats.jsonl")
    if not records:
        # Compute from CSV
        csv_data = read_csv_data()
        city_data = defaultdict(list)
        for r in csv_data:
            city_data[r.get("city", "")].append(r)

        stats = []
        for city, readings in city_data.items():
            aqis = [int(float(r.get("aqi", 0))) for r in readings]
            pm25s = [float(r.get("pm25", 0)) for r in readings]
            temps = [float(r.get("temperature", 0)) for r in readings]
            if aqis:
                stats.append({
                    "city": city,
                    "avg_aqi": round(sum(aqis) / len(aqis), 1),
                    "max_aqi": max(aqis),
                    "min_aqi": min(aqis),
                    "avg_pm25": round(sum(pm25s) / len(pm25s), 1),
                    "max_pm25": round(max(pm25s), 1),
                    "avg_temp": round(sum(temps) / len(temps), 1),
                    "reading_count": len(aqis),
                })
        stats.sort(key=lambda x: -x["avg_aqi"])
        return jsonify({"stats": stats})

    return jsonify({"stats": records})


@app.route("/api/ask", methods=["POST"])
def ask_rag():
    """Query the RAG knowledge base."""
    data = request.json
    query = data.get("query", "")

    if not query:
        return jsonify({"error": "No query provided"}), 400

    try:
        # Try Pathway RAG server first
        resp = requests.post(
            f"{RAG_URL}/v1/answer",
            json={"query": query},
            timeout=10,
        )
        if resp.status_code == 200:
            return jsonify(resp.json())
    except requests.exceptions.ConnectionError:
        pass
    except Exception as e:
        print(f"[API] RAG query error: {e}")

    # Fallback: try root endpoint
    try:
        resp = requests.post(
            RAG_URL,
            json={"query": query},
            timeout=10,
        )
        if resp.status_code == 200:
            return jsonify(resp.json())
    except:
        pass

    return jsonify({
        "answer": "The RAG server is not currently available. Please start it with: python rag_server.py",
        "sources": []
    })


@app.route("/api/summary", methods=["GET"])
def get_summary():
    """Get a real-time summary of environmental status."""
    records = read_csv_data()
    if not records:
        return jsonify({"summary": "No data available yet. Start the data simulator."})

    # Get latest per city
    city_latest = {}
    for r in records:
        city_latest[r.get("city", "")] = r

    total_cities = len(city_latest)
    aqis = [int(float(r.get("aqi", 0))) for r in city_latest.values()]
    avg_aqi = sum(aqis) / len(aqis) if aqis else 0
    worst_city = max(city_latest.values(), key=lambda r: int(float(r.get("aqi", 0))))
    best_city = min(city_latest.values(), key=lambda r: int(float(r.get("aqi", 0))))
    severe_count = sum(1 for a in aqis if a > 200)

    summary = {
        "total_cities": total_cities,
        "total_readings": len(records),
        "avg_aqi": round(avg_aqi),
        "worst_city": worst_city.get("city", ""),
        "worst_aqi": int(float(worst_city.get("aqi", 0))),
        "best_city": best_city.get("city", ""),
        "best_aqi": int(float(best_city.get("aqi", 0))),
        "cities_above_200": severe_count,
    }
    return jsonify(summary)


# --- Frontend Serving ---

@app.route("/")
def serve_frontend():
    return send_from_directory("frontend", "index.html")


@app.route("/frontend/<path:path>")
def serve_static(path):
    return send_from_directory("frontend", path)


if __name__ == "__main__":
    print("=" * 60)
    print("  🌐 GreenBharat AI — API Server")
    print("=" * 60)
    print("  Dashboard: http://localhost:5000")
    print("  API Base:  http://localhost:5000/api/")
    print("=" * 60)
    app.run(host="0.0.0.0", port=5000, debug=True)
