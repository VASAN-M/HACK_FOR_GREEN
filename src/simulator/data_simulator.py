"""
GreenBharat AI — Real-Time Environmental Data Simulator
Simulates live sensor data from 8 Indian cities by continuously
appending rows to CSV files in ./data/ directory.
Pathway's pw.io.csv.read() will auto-detect new data.
"""

import csv
import os
import time
import random
import math
from datetime import datetime

# --- Configuration ---
DATA_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "data")
OUTPUT_FILE = os.path.join(DATA_DIR, "sensor_data.csv")
INTERVAL_SECONDS = 4  # Time between data points

# Indian cities with baseline pollution profiles
CITIES = {
    "Delhi": {
        "lat": 28.6139, "lon": 77.2090,
        "pm25_base": 85, "pm10_base": 140, "no2_base": 45,
        "so2_base": 18, "co_base": 1.8, "o3_base": 35,
        "temp_base": 28, "humidity_base": 55, "wind_base": 6,
    },
    "Mumbai": {
        "lat": 19.0760, "lon": 72.8777,
        "pm25_base": 35, "pm10_base": 70, "no2_base": 30,
        "so2_base": 12, "co_base": 1.2, "o3_base": 28,
        "temp_base": 30, "humidity_base": 75, "wind_base": 12,
    },
    "Bangalore": {
        "lat": 12.9716, "lon": 77.5946,
        "pm25_base": 28, "pm10_base": 55, "no2_base": 25,
        "so2_base": 8, "co_base": 0.9, "o3_base": 25,
        "temp_base": 26, "humidity_base": 60, "wind_base": 8,
    },
    "Chennai": {
        "lat": 13.0827, "lon": 80.2707,
        "pm25_base": 25, "pm10_base": 50, "no2_base": 22,
        "so2_base": 10, "co_base": 0.8, "o3_base": 30,
        "temp_base": 32, "humidity_base": 70, "wind_base": 14,
    },
    "Kolkata": {
        "lat": 22.5726, "lon": 88.3639,
        "pm25_base": 50, "pm10_base": 95, "no2_base": 35,
        "so2_base": 14, "co_base": 1.4, "o3_base": 32,
        "temp_base": 29, "humidity_base": 72, "wind_base": 7,
    },
    "Hyderabad": {
        "lat": 17.3850, "lon": 78.4867,
        "pm25_base": 30, "pm10_base": 60, "no2_base": 28,
        "so2_base": 9, "co_base": 1.0, "o3_base": 26,
        "temp_base": 30, "humidity_base": 55, "wind_base": 9,
    },
    "Pune": {
        "lat": 18.5204, "lon": 73.8567,
        "pm25_base": 26, "pm10_base": 52, "no2_base": 24,
        "so2_base": 7, "co_base": 0.8, "o3_base": 24,
        "temp_base": 27, "humidity_base": 58, "wind_base": 10,
    },
    "Jaipur": {
        "lat": 26.9124, "lon": 75.7873,
        "pm25_base": 45, "pm10_base": 90, "no2_base": 32,
        "so2_base": 11, "co_base": 1.3, "o3_base": 30,
        "temp_base": 31, "humidity_base": 40, "wind_base": 11,
    },
}

CSV_HEADERS = [
    "timestamp", "city", "latitude", "longitude",
    "pm25", "pm10", "no2", "so2", "co", "o3",
    "temperature", "humidity", "wind_speed", "aqi", "aqi_category"
]


def calculate_aqi(pm25, pm10, no2, so2, co, o3):
    """Calculate AQI using simplified Indian NAQI breakpoints."""
    def sub_index(value, breakpoints):
        for i in range(len(breakpoints) - 1):
            c_low, c_high, i_low, i_high = breakpoints[i]
            if value <= c_high:
                return ((i_high - i_low) / (c_high - c_low)) * (value - c_low) + i_low
        return breakpoints[-1][3]  # Return max if exceeds all breakpoints

    pm25_bp = [
        (0, 30, 0, 50), (31, 60, 51, 100), (61, 90, 101, 200),
        (91, 120, 201, 300), (121, 250, 301, 400), (251, 500, 401, 500)
    ]
    pm10_bp = [
        (0, 50, 0, 50), (51, 100, 51, 100), (101, 250, 101, 200),
        (251, 350, 201, 300), (351, 430, 301, 400), (431, 600, 401, 500)
    ]
    no2_bp = [
        (0, 40, 0, 50), (41, 80, 51, 100), (81, 180, 101, 200),
        (181, 280, 201, 300), (281, 400, 301, 400), (401, 600, 401, 500)
    ]

    sub_indices = [
        sub_index(pm25, pm25_bp),
        sub_index(pm10, pm10_bp),
        sub_index(no2, no2_bp),
    ]
    return max(sub_indices)


def get_aqi_category(aqi):
    """Return AQI category label."""
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


def generate_reading(city_name, city_config, tick):
    """Generate a single simulated sensor reading with realistic variation."""
    # Time-of-day effect (rush hours = more pollution)
    hour = datetime.now().hour
    time_factor = 1.0
    if 7 <= hour <= 10 or 17 <= hour <= 20:  # Rush hours
        time_factor = 1.3
    elif 1 <= hour <= 5:  # Night = less pollution
        time_factor = 0.6

    # Sinusoidal drift + random noise
    drift = math.sin(tick * 0.1) * 0.15
    noise = lambda: random.gauss(0, 0.12)

    # Occasional pollution spike (5% chance)
    spike = random.choice([1.0] * 19 + [2.0])

    pm25 = max(1, city_config["pm25_base"] * (time_factor + drift + noise()) * spike)
    pm10 = max(1, city_config["pm10_base"] * (time_factor + drift + noise()) * spike)
    no2 = max(1, city_config["no2_base"] * (time_factor + drift + noise()))
    so2 = max(0.5, city_config["so2_base"] * (1 + drift + noise()))
    co = max(0.1, city_config["co_base"] * (1 + noise()))
    o3 = max(1, city_config["o3_base"] * (1 + drift * 0.5 + noise()))

    temp = city_config["temp_base"] + random.gauss(0, 2)
    humidity = max(10, min(100, city_config["humidity_base"] + random.gauss(0, 5)))
    wind = max(0.5, city_config["wind_base"] + random.gauss(0, 2))

    aqi = calculate_aqi(pm25, pm10, no2, so2, co, o3)
    category = get_aqi_category(aqi)

    return {
        "timestamp": datetime.now().isoformat(),
        "city": city_name,
        "latitude": city_config["lat"],
        "longitude": city_config["lon"],
        "pm25": round(pm25, 1),
        "pm10": round(pm10, 1),
        "no2": round(no2, 1),
        "so2": round(so2, 1),
        "co": round(co, 2),
        "o3": round(o3, 1),
        "temperature": round(temp, 1),
        "humidity": round(humidity, 1),
        "wind_speed": round(wind, 1),
        "aqi": round(aqi),
        "aqi_category": category,
    }


def init_csv():
    """Initialize CSV file with headers if it doesn't exist."""
    os.makedirs(DATA_DIR, exist_ok=True)
    if not os.path.exists(OUTPUT_FILE):
        with open(OUTPUT_FILE, "w", newline="") as f:
            writer = csv.DictWriter(f, fieldnames=CSV_HEADERS)
            writer.writeheader()
        print(f"[INIT] Created {OUTPUT_FILE}")


def run_simulator():
    """Main loop: continuously generate and append sensor data."""
    init_csv()
    print("=" * 60)
    print("  🌿 GreenBharat AI — Environmental Data Simulator")
    print("=" * 60)
    print(f"  Generating data for {len(CITIES)} cities")
    print(f"  Output: {OUTPUT_FILE}")
    print(f"  Interval: {INTERVAL_SECONDS}s")
    print("=" * 60)

    tick = 0
    cities_list = list(CITIES.keys())

    try:
        while True:
            # Pick 2-4 random cities per tick for realistic staggered updates
            num_cities = random.randint(2, min(4, len(cities_list)))
            selected = random.sample(cities_list, num_cities)

            rows = []
            for city_name in selected:
                reading = generate_reading(city_name, CITIES[city_name], tick)
                rows.append(reading)

            # Append to CSV
            with open(OUTPUT_FILE, "a", newline="") as f:
                writer = csv.DictWriter(f, fieldnames=CSV_HEADERS)
                writer.writerows(rows)

            for row in rows:
                emoji = "🟢" if row["aqi"] <= 50 else "🟡" if row["aqi"] <= 100 else "🟠" if row["aqi"] <= 200 else "🔴" if row["aqi"] <= 300 else "🟣" if row["aqi"] <= 400 else "⚫"
                print(f"  {emoji} {row['city']:12s} | AQI: {row['aqi']:3d} ({row['aqi_category']:12s}) | PM2.5: {row['pm25']:5.1f} | Temp: {row['temperature']:4.1f}°C")

            tick += 1
            time.sleep(INTERVAL_SECONDS)

    except KeyboardInterrupt:
        print("\n[STOP] Simulator stopped.")


if __name__ == "__main__":
    run_simulator()
