"""
GreenBharat AI — Pathway Real-Time Streaming Pipeline
Ingests live sensor data, computes aggregations, detects anomalies,
and outputs processed results as JSON — all updating in real-time.
"""

import pathway as pw
import os
import json
from datetime import datetime


# --- Schema Definition ---
class SensorSchema(pw.Schema):
    timestamp: str
    city: str
    latitude: float
    longitude: float
    pm25: float
    pm10: float
    no2: float
    so2: float
    co: float
    o3: float
    temperature: float
    humidity: float
    wind_speed: float
    aqi: int
    aqi_category: str


# --- Configuration ---
DATA_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "data")
OUTPUT_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "output")
os.makedirs(OUTPUT_DIR, exist_ok=True)


def get_aqi_category(aqi):
    """Return AQI category string."""
    if aqi <= 50:
        return "Good"
    elif aqi <= 100:
        return "Satisfactory"
    elif aqi <= 200:
        return "Moderate"
    elif aqi <= 300:
        return "Poor"
    elif aqi <= 400:
        return "Very Poor"
    else:
        return "Severe"


def run_pipeline():
    """Main Pathway streaming pipeline."""
    print("=" * 60)
    print("  🌿 GreenBharat AI — Pathway Streaming Pipeline")
    print("=" * 60)
    print(f"  Watching: {DATA_DIR}")
    print(f"  Output:   {OUTPUT_DIR}")
    print("=" * 60)

    # --- Step 1: Ingest live CSV data ---
    sensor_data = pw.io.csv.read(
        DATA_DIR,
        schema=SensorSchema,
        mode="streaming",
        autocommit_duration_ms=2000,
    )

    # --- Step 2: Enrich with computed fields ---
    enriched = sensor_data.select(
        timestamp=sensor_data.timestamp,
        city=sensor_data.city,
        latitude=sensor_data.latitude,
        longitude=sensor_data.longitude,
        pm25=sensor_data.pm25,
        pm10=sensor_data.pm10,
        no2=sensor_data.no2,
        so2=sensor_data.so2,
        co=sensor_data.co,
        o3=sensor_data.o3,
        temperature=sensor_data.temperature,
        humidity=sensor_data.humidity,
        wind_speed=sensor_data.wind_speed,
        aqi=sensor_data.aqi,
        aqi_category=sensor_data.aqi_category,
    )

    # --- Step 3: Filter anomalies (pollution spikes) ---
    anomalies = enriched.filter(
        (enriched.pm25 > 60) | (enriched.aqi > 200)
    )

    anomaly_alerts = anomalies.select(
        timestamp=anomalies.timestamp,
        city=anomalies.city,
        aqi=anomalies.aqi,
        aqi_category=anomalies.aqi_category,
        pm25=anomalies.pm25,
        pm10=anomalies.pm10,
        alert_type=pw.if_else(
            anomalies.aqi > 300,
            pw.cast(str, "CRITICAL"),
            pw.if_else(
                anomalies.aqi > 200,
                pw.cast(str, "WARNING"),
                pw.cast(str, "CAUTION"),
            ),
        ),
    )

    # --- Step 4: City-wise aggregations ---
    city_stats = enriched.groupby(enriched.city).reduce(
        city=enriched.city,
        avg_aqi=pw.reducers.avg(enriched.aqi),
        max_aqi=pw.reducers.max(enriched.aqi),
        min_aqi=pw.reducers.min(enriched.aqi),
        avg_pm25=pw.reducers.avg(enriched.pm25),
        max_pm25=pw.reducers.max(enriched.pm25),
        avg_pm10=pw.reducers.avg(enriched.pm10),
        avg_temp=pw.reducers.avg(enriched.temperature),
        avg_humidity=pw.reducers.avg(enriched.humidity),
        reading_count=pw.reducers.count(),
    )

    # --- Step 5: Write outputs ---
    # All readings
    pw.io.jsonlines.write(enriched, os.path.join(OUTPUT_DIR, "all_readings.jsonl"))

    # Anomaly alerts
    pw.io.jsonlines.write(anomaly_alerts, os.path.join(OUTPUT_DIR, "alerts.jsonl"))

    # City stats
    pw.io.jsonlines.write(city_stats, os.path.join(OUTPUT_DIR, "city_stats.jsonl"))

    print("[PIPELINE] Starting Pathway engine...")
    print("[PIPELINE] Pipeline is LIVE — processing data in real-time!")
    print("[PIPELINE] Press Ctrl+C to stop.\n")

    # --- Step 6: Run the reactive engine ---
    pw.run(monitoring_level=pw.MonitoringLevel.NONE)


if __name__ == "__main__":
    run_pipeline()
