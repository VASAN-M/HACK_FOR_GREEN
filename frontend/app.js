/* ============================================================
   GreenBharat AI — Enhanced Dashboard JavaScript
   Navigation, map, health advisory, modals, 8 chart types
   ============================================================ */

const API_BASE = window.location.origin + "/api";
const REFRESH_INTERVAL = 3000;

// Chart instances
let aqiBarChart = null;
let pm25LineChart = null;
let weatherChart = null;
let pollutantDonut = null;
let aqiHistogram = null;
let pollutantGroupedBar = null;
let aqiAreaChart = null;
let cityRadar = null;

// Store latest city data globally
let latestCities = [];

// Chart.js global config
Chart.defaults.color = '#94a3b8';
Chart.defaults.font.family = "'Inter', sans-serif";
Chart.defaults.font.size = 11;

// --- Helpers ---
function getAqiColor(aqi) {
    if (aqi <= 50) return '#34d399';
    if (aqi <= 100) return '#fbbf24';
    if (aqi <= 200) return '#f97316';
    if (aqi <= 300) return '#ef4444';
    if (aqi <= 400) return '#a855f7';
    return '#7c3aed';
}

function getAqiClass(category) {
    return {
        'Good': 'aqi-good', 'Satisfactory': 'aqi-satisfactory',
        'Moderate': 'aqi-moderate', 'Poor': 'aqi-poor',
        'Very Poor': 'aqi-verypoor', 'Severe': 'aqi-severe',
    }[category] || 'aqi-moderate';
}

function getAqiCategory(aqi) {
    if (aqi <= 50) return 'Good';
    if (aqi <= 100) return 'Satisfactory';
    if (aqi <= 200) return 'Moderate';
    if (aqi <= 300) return 'Poor';
    if (aqi <= 400) return 'Very Poor';
    return 'Severe';
}

function formatTime(isoString) {
    if (!isoString) return '';
    try {
        const d = new Date(isoString);
        return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    } catch { return ''; }
}

function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

// City colors
const cityColors = {
    'Delhi': '#ef4444', 'Mumbai': '#3b82f6', 'Bangalore': '#34d399',
    'Chennai': '#fbbf24', 'Kolkata': '#a855f7', 'Hyderabad': '#f97316',
    'Pune': '#06b6d4', 'Jaipur': '#ec4899',
};

// --- Navigation ---
function toggleNav() {
    document.getElementById('slideNav').classList.toggle('open');
    document.getElementById('navOverlay').classList.toggle('open');
}
function closeNav() {
    document.getElementById('slideNav').classList.remove('open');
    document.getElementById('navOverlay').classList.remove('open');
}

// --- Tab Switching ---
function switchTab(tab) {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    event.target.classList.add('active');
    // Scroll to relevant section
    const targets = { 'overview': 'summary', 'analytics': 'chartsSection1', 'insights': 'alertSection' };
    const el = document.getElementById(targets[tab] || 'summary');
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// --- City Detail Modal ---
function showCityDetail(cityName) {
    const city = latestCities.find(c => c.city === cityName);
    if (!city) return;

    const color = getAqiColor(city.aqi);
    const healthAdvice = getHealthAdvice(city.aqi, city.aqi_category);

    document.getElementById('cityModalBody').innerHTML = `
        <div class="modal-city-name">${city.city}</div>
        <div class="modal-aqi-big" style="color:${color}">${city.aqi}</div>
        <div class="modal-category" style="color:${color}">${city.aqi_category}</div>
        <div class="modal-grid">
            <div class="modal-stat">
                <div class="modal-stat-label">PM2.5</div>
                <div class="modal-stat-value">${city.pm25}</div>
            </div>
            <div class="modal-stat">
                <div class="modal-stat-label">PM10</div>
                <div class="modal-stat-value">${city.pm10}</div>
            </div>
            <div class="modal-stat">
                <div class="modal-stat-label">NO₂</div>
                <div class="modal-stat-value">${city.no2}</div>
            </div>
            <div class="modal-stat">
                <div class="modal-stat-label">SO₂</div>
                <div class="modal-stat-value">${city.so2}</div>
            </div>
            <div class="modal-stat">
                <div class="modal-stat-label">CO</div>
                <div class="modal-stat-value">${city.co}</div>
            </div>
            <div class="modal-stat">
                <div class="modal-stat-label">O₃</div>
                <div class="modal-stat-value">${city.o3}</div>
            </div>
            <div class="modal-stat">
                <div class="modal-stat-label">Temperature</div>
                <div class="modal-stat-value">${city.temperature}°C</div>
            </div>
            <div class="modal-stat">
                <div class="modal-stat-label">Humidity</div>
                <div class="modal-stat-value">${city.humidity}%</div>
            </div>
            <div class="modal-stat">
                <div class="modal-stat-label">Wind Speed</div>
                <div class="modal-stat-value">${city.wind_speed} km/h</div>
            </div>
        </div>
        <div class="modal-health">
            <h4>🏥 Health Advisory</h4>
            <p>${healthAdvice}</p>
        </div>
    `;
    document.getElementById('cityModal').classList.add('open');
}

function closeCityModal(event) {
    if (event && event.target !== event.currentTarget) return;
    document.getElementById('cityModal').classList.remove('open');
}

// --- Health Advice Generator ---
function getHealthAdvice(aqi, category) {
    if (aqi <= 50) return "Air quality is excellent. Enjoy outdoor activities freely. Great day for jogging, cycling, and outdoor sports.";
    if (aqi <= 100) return "Air quality is acceptable. Sensitive individuals (asthma, elderly) should limit prolonged outdoor exertion.";
    if (aqi <= 200) return "Breathing discomfort possible on prolonged exposure. Reduce outdoor exercise. Children and elderly should limit time outdoors. Wear a mask if cycling or walking long distances.";
    if (aqi <= 300) return "⚠️ Unhealthy air. Avoid outdoor activities. Use N95 masks outdoors. Keep windows closed. Run air purifiers indoors. People with respiratory conditions should stay indoors.";
    if (aqi <= 400) return "🚨 Very unhealthy. All outdoor activities should be avoided. Mandatory mask usage if going outside. Seal gaps in windows and doors. Medical attention recommended for breathing difficulty.";
    return "🛑 SEVERE: Hazardous air quality. Stay indoors completely. Seal all windows. Use air purifiers on maximum. Seek medical attention for any respiratory symptoms. Avoid all outdoor exposure.";
}

function getHealthLevel(aqi) {
    if (aqi <= 50) return 'good';
    if (aqi <= 200) return 'moderate';
    if (aqi <= 300) return 'poor';
    return 'severe';
}

// --- Data Fetching ---
async function fetchJSON(endpoint) {
    try {
        const resp = await fetch(`${API_BASE}${endpoint}`);
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        return await resp.json();
    } catch (e) {
        console.warn(`[Fetch] ${endpoint}:`, e.message);
        return null;
    }
}

// --- Update Functions ---
async function updateSummary() {
    const data = await fetchJSON('/summary');
    if (!data) return;
    document.getElementById('totalCities').textContent = data.total_cities || '—';
    document.getElementById('avgAqi').textContent = data.avg_aqi || '—';
    document.getElementById('avgAqiCategory').textContent = getAqiCategory(data.avg_aqi || 0);
    document.getElementById('worstCity').textContent = data.worst_city || '—';
    document.getElementById('worstAqi').textContent = data.worst_aqi ? `AQI ${data.worst_aqi}` : '—';
    document.getElementById('bestCity').textContent = data.best_city || '—';
    document.getElementById('bestAqi').textContent = data.best_aqi ? `AQI ${data.best_aqi}` : '—';
    document.getElementById('totalReadings').textContent = data.total_readings?.toLocaleString() || '—';
    document.getElementById('alertCount').textContent = data.cities_above_200 || '0';
}

async function updateCityCards() {
    const data = await fetchJSON('/aqi');
    if (!data || !data.cities || data.cities.length === 0) return;

    latestCities = data.cities;
    const grid = document.getElementById('cityGrid');
    grid.innerHTML = '';

    if (data.last_update) {
        document.getElementById('lastUpdate').textContent = `Updated: ${formatTime(data.last_update)}`;
    }

    data.cities.forEach(city => {
        const cls = getAqiClass(city.aqi_category);
        const card = document.createElement('div');
        card.className = `city-card ${cls}`;
        card.onclick = () => showCityDetail(city.city);
        card.innerHTML = `
            <div class="city-name">${city.city}</div>
            <div class="city-aqi">${city.aqi}</div>
            <div class="city-category">${city.aqi_category}</div>
            <div class="city-details">
                <div class="city-detail">PM2.5: <span>${city.pm25}</span></div>
                <div class="city-detail">PM10: <span>${city.pm10}</span></div>
                <div class="city-detail">Temp: <span>${city.temperature}°C</span></div>
                <div class="city-detail">Wind: <span>${city.wind_speed} km/h</span></div>
                <div class="city-detail">NO₂: <span>${city.no2}</span></div>
                <div class="city-detail">O₃: <span>${city.o3}</span></div>
            </div>
            <div class="city-card-click">Click for details →</div>
        `;
        grid.appendChild(card);
    });

    // Update map markers
    updateMapMarkers(data.cities);
    // Update health advisories
    updateHealthAdvisory(data.cities);

    return data.cities;
}

// --- Map Marker Updates ---
function updateMapMarkers(cities) {
    cities.forEach(city => {
        const marker = document.getElementById(`marker-${city.city}`);
        if (!marker) return;
        const color = getAqiColor(city.aqi);
        const dots = marker.querySelectorAll('.marker-dot');
        const pulses = marker.querySelectorAll('.marker-pulse');
        dots.forEach(d => { d.style.fill = color; });
        pulses.forEach(p => { p.style.stroke = color; });
    });
}

// --- Health Advisory ---
function updateHealthAdvisory(cities) {
    const grid = document.getElementById('healthGrid');
    grid.innerHTML = '';

    // Sort by AQI descending for health advisory
    const sorted = [...cities].sort((a, b) => b.aqi - a.aqi);

    sorted.forEach(city => {
        const level = getHealthLevel(city.aqi);
        const advice = getHealthAdvice(city.aqi, city.aqi_category);
        const actions = getHealthActions(city.aqi);

        const card = document.createElement('div');
        card.className = `health-card level-${level}`;
        card.innerHTML = `
            <div class="health-city">
                ${city.city}
                <span class="city-aqi-badge">AQI ${city.aqi}</span>
            </div>
            <div class="health-advice">${advice}</div>
            <div class="health-actions">
                ${actions.map(a => `<span class="health-action-tag">${a}</span>`).join('')}
            </div>
        `;
        grid.appendChild(card);
    });
}

function getHealthActions(aqi) {
    if (aqi <= 50) return ['✅ Outdoor Safe', '🏃 Exercise OK', '🪟 Open Windows'];
    if (aqi <= 100) return ['🚶 Limit Exertion', '👴 Sensitive Caution'];
    if (aqi <= 200) return ['😷 Wear Mask', '🏠 Limit Outdoor', '👶 Kids Indoor'];
    if (aqi <= 300) return ['😷 N95 Mask', '🏠 Stay Indoor', '🫁 Air Purifier'];
    if (aqi <= 400) return ['🚫 No Outdoor', '😷 N95 Required', '🏥 Medical Alert'];
    return ['🛑 Emergency', '🚫 Seal Indoors', '🏥 Seek Medical'];
}

// --- Chart Updates ---
async function updateCharts(cities) {
    if (!cities || cities.length === 0) return;

    const labels = cities.map(c => c.city);
    const aqiValues = cities.map(c => c.aqi);
    const barColors = aqiValues.map(a => getAqiColor(a));

    // --- Bar Chart ---
    const barCtx = document.getElementById('aqiBarChart').getContext('2d');
    if (aqiBarChart) {
        aqiBarChart.data.labels = labels;
        aqiBarChart.data.datasets[0].data = aqiValues;
        aqiBarChart.data.datasets[0].backgroundColor = barColors;
        aqiBarChart.update('none');
    } else {
        aqiBarChart = new Chart(barCtx, {
            type: 'bar',
            data: { labels, datasets: [{ label: 'AQI', data: aqiValues, backgroundColor: barColors, borderRadius: 6, borderSkipped: false, barPercentage: 0.6 }] },
            options: {
                responsive: true, maintainAspectRatio: false,
                plugins: { legend: { display: false }, tooltip: { backgroundColor: 'rgba(17,24,39,0.95)', borderColor: 'rgba(255,255,255,0.1)', borderWidth: 1 } },
                scales: {
                    x: { grid: { display: false }, ticks: { font: { size: 10 } } },
                    y: { grid: { color: 'rgba(255,255,255,0.04)' }, beginAtZero: true }
                }
            }
        });
    }

    // --- Donut ---
    const avgP = {
        'PM2.5': +(cities.reduce((s, c) => s + c.pm25, 0) / cities.length).toFixed(1),
        'PM10': +(cities.reduce((s, c) => s + c.pm10, 0) / cities.length).toFixed(1),
        'NO₂': +(cities.reduce((s, c) => s + c.no2, 0) / cities.length).toFixed(1),
        'SO₂': +(cities.reduce((s, c) => s + c.so2, 0) / cities.length).toFixed(1),
        'CO': +(cities.reduce((s, c) => s + c.co, 0) / cities.length).toFixed(2),
        'O₃': +(cities.reduce((s, c) => s + c.o3, 0) / cities.length).toFixed(1),
    };
    const donutColors = ['#ef4444', '#f97316', '#fbbf24', '#a855f7', '#3b82f6', '#06b6d4'];
    const donutCtx = document.getElementById('pollutantDonut').getContext('2d');

    if (pollutantDonut) {
        pollutantDonut.data.datasets[0].data = Object.values(avgP);
        pollutantDonut.update('none');
    } else {
        pollutantDonut = new Chart(donutCtx, {
            type: 'doughnut',
            data: { labels: Object.keys(avgP), datasets: [{ data: Object.values(avgP), backgroundColor: donutColors, borderColor: '#0a0f1a', borderWidth: 3, hoverOffset: 8 }] },
            options: {
                responsive: true, maintainAspectRatio: false, cutout: '62%',
                plugins: { legend: { position: 'right', labels: { padding: 12, usePointStyle: true, pointStyleWidth: 10, font: { size: 10 } } } }
            }
        });
    }

    // --- Histogram: AQI Distribution ---
    const buckets = [0, 0, 0, 0, 0, 0]; // Good, Sat, Mod, Poor, VPoor, Severe
    cities.forEach(c => {
        if (c.aqi <= 50) buckets[0]++;
        else if (c.aqi <= 100) buckets[1]++;
        else if (c.aqi <= 200) buckets[2]++;
        else if (c.aqi <= 300) buckets[3]++;
        else if (c.aqi <= 400) buckets[4]++;
        else buckets[5]++;
    });
    const histLabels = ['Good\n(0-50)', 'Satisfactory\n(51-100)', 'Moderate\n(101-200)', 'Poor\n(201-300)', 'Very Poor\n(301-400)', 'Severe\n(401+)'];
    const histColors = ['#34d399', '#fbbf24', '#f97316', '#ef4444', '#a855f7', '#7c3aed'];
    const histCtx = document.getElementById('aqiHistogram').getContext('2d');

    if (aqiHistogram) {
        aqiHistogram.data.datasets[0].data = buckets;
        aqiHistogram.update('none');
    } else {
        aqiHistogram = new Chart(histCtx, {
            type: 'bar',
            data: { labels: histLabels, datasets: [{ label: 'Cities', data: buckets, backgroundColor: histColors, borderRadius: 8, barPercentage: 0.7 }] },
            options: {
                responsive: true, maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    x: { grid: { display: false }, ticks: { font: { size: 9 }, maxRotation: 0 } },
                    y: { grid: { color: 'rgba(255,255,255,0.04)' }, beginAtZero: true, ticks: { stepSize: 1 }, title: { display: true, text: 'Number of Cities', font: { size: 10 } } }
                }
            }
        });
    }

    // --- Grouped Bar: Pollutant Comparison ---
    const grpCtx = document.getElementById('pollutantGroupedBar').getContext('2d');
    if (pollutantGroupedBar) {
        pollutantGroupedBar.data.labels = labels;
        pollutantGroupedBar.data.datasets[0].data = cities.map(c => c.pm25);
        pollutantGroupedBar.data.datasets[1].data = cities.map(c => c.pm10);
        pollutantGroupedBar.data.datasets[2].data = cities.map(c => c.no2);
        pollutantGroupedBar.update('none');
    } else {
        pollutantGroupedBar = new Chart(grpCtx, {
            type: 'bar',
            data: {
                labels,
                datasets: [
                    { label: 'PM2.5', data: cities.map(c => c.pm25), backgroundColor: '#ef4444', borderRadius: 4, barPercentage: 0.8, categoryPercentage: 0.7 },
                    { label: 'PM10', data: cities.map(c => c.pm10), backgroundColor: '#f97316', borderRadius: 4, barPercentage: 0.8, categoryPercentage: 0.7 },
                    { label: 'NO₂', data: cities.map(c => c.no2), backgroundColor: '#fbbf24', borderRadius: 4, barPercentage: 0.8, categoryPercentage: 0.7 },
                ]
            },
            options: {
                responsive: true, maintainAspectRatio: false,
                plugins: { legend: { labels: { usePointStyle: true, pointStyleWidth: 10, font: { size: 10 } } } },
                scales: {
                    x: { grid: { display: false }, ticks: { font: { size: 9 } } },
                    y: { grid: { color: 'rgba(255,255,255,0.04)' }, beginAtZero: true, title: { display: true, text: 'μg/m³', font: { size: 10 } } }
                }
            }
        });
    }

    // --- Radar Chart ---
    const radarCtx = document.getElementById('cityRadar').getContext('2d');
    // Normalize values for radar (0-100 scale)
    const topCities = cities.slice(0, 4);
    const radarDatasets = topCities.map(city => ({
        label: city.city,
        data: [
            Math.min(city.pm25 / 1.5, 100),
            Math.min(city.pm10 / 2, 100),
            Math.min(city.no2 / 0.8, 100),
            Math.min(city.temperature / 0.45, 100),
            Math.min(city.humidity, 100),
            Math.min(city.wind_speed * 5, 100),
        ],
        borderColor: cityColors[city.city] || '#94a3b8',
        backgroundColor: (cityColors[city.city] || '#94a3b8') + '15',
        borderWidth: 2,
        pointRadius: 3,
        pointBackgroundColor: cityColors[city.city] || '#94a3b8',
    }));

    if (cityRadar) {
        cityRadar.data.datasets = radarDatasets;
        cityRadar.update('none');
    } else {
        cityRadar = new Chart(radarCtx, {
            type: 'radar',
            data: {
                labels: ['PM2.5', 'PM10', 'NO₂', 'Temp', 'Humidity', 'Wind'],
                datasets: radarDatasets,
            },
            options: {
                responsive: true, maintainAspectRatio: false,
                plugins: { legend: { labels: { usePointStyle: true, pointStyleWidth: 8, font: { size: 10 } } } },
                scales: {
                    r: {
                        grid: { color: 'rgba(255,255,255,0.06)' },
                        angleLines: { color: 'rgba(255,255,255,0.06)' },
                        pointLabels: { font: { size: 10 }, color: '#94a3b8' },
                        ticks: { display: false },
                        suggestedMin: 0,
                        suggestedMax: 100,
                    }
                }
            }
        });
    }
}

async function updateTrendCharts() {
    const data = await fetchJSON('/trends?limit=200');
    if (!data || !data.trends || data.trends.length === 0) return;

    const trends = data.trends;
    const cityTrends = {};
    trends.forEach(t => {
        if (!cityTrends[t.city]) cityTrends[t.city] = [];
        cityTrends[t.city].push(t);
    });

    // --- PM2.5 Line Chart ---
    const pm25Datasets = [];
    Object.entries(cityTrends).forEach(([city, trs]) => {
        const last25 = trs.slice(-25);
        pm25Datasets.push({
            label: city, data: last25.map(t => t.pm25),
            borderColor: cityColors[city] || '#94a3b8', backgroundColor: 'transparent',
            borderWidth: 2, tension: 0.4, pointRadius: 0, pointHoverRadius: 4,
        });
    });
    const maxPts = Math.max(...Object.values(cityTrends).map(t => Math.min(t.length, 25)));
    const pm25Labels = Array.from({ length: maxPts }, (_, i) => i + 1);
    const pm25Ctx = document.getElementById('pm25LineChart').getContext('2d');

    if (pm25LineChart) {
        pm25LineChart.data.labels = pm25Labels;
        pm25LineChart.data.datasets = pm25Datasets;
        pm25LineChart.update('none');
    } else {
        pm25LineChart = new Chart(pm25Ctx, {
            type: 'line',
            data: { labels: pm25Labels, datasets: pm25Datasets },
            options: {
                responsive: true, maintainAspectRatio: false,
                interaction: { mode: 'index', intersect: false },
                plugins: { legend: { labels: { usePointStyle: true, pointStyleWidth: 8, font: { size: 9 }, padding: 8 } } },
                scales: { x: { display: false }, y: { grid: { color: 'rgba(255,255,255,0.04)' }, title: { display: true, text: 'PM2.5 (μg/m³)', font: { size: 10 } } } }
            }
        });
    }

    // --- Weather Chart ---
    const weatherDatasets = [];
    Object.entries(cityTrends).forEach(([city, trs]) => {
        const last18 = trs.slice(-18);
        weatherDatasets.push({
            label: `${city}`, data: last18.map(t => t.temperature),
            borderColor: cityColors[city] || '#94a3b8', backgroundColor: 'transparent',
            borderWidth: 2, tension: 0.4, pointRadius: 0, yAxisID: 'y',
        });
    });
    const avgHumidity = [];
    for (let i = 0; i < 18; i++) {
        let sum = 0, count = 0;
        Object.values(cityTrends).forEach(trs => {
            const idx = trs.length - 18 + i;
            if (idx >= 0 && idx < trs.length) { sum += trs[idx].humidity; count++; }
        });
        avgHumidity.push(count ? sum / count : 0);
    }
    weatherDatasets.push({
        label: 'Avg Humidity', data: avgHumidity,
        borderColor: 'rgba(6,182,212,0.5)', backgroundColor: 'rgba(6,182,212,0.06)',
        borderWidth: 1.5, fill: true, tension: 0.4, pointRadius: 0, yAxisID: 'y1',
    });
    const weatherCtx = document.getElementById('weatherChart').getContext('2d');

    if (weatherChart) {
        weatherChart.data.labels = Array.from({ length: 18 }, (_, i) => i + 1);
        weatherChart.data.datasets = weatherDatasets;
        weatherChart.update('none');
    } else {
        weatherChart = new Chart(weatherCtx, {
            type: 'line',
            data: { labels: Array.from({ length: 18 }, (_, i) => i + 1), datasets: weatherDatasets },
            options: {
                responsive: true, maintainAspectRatio: false,
                interaction: { mode: 'index', intersect: false },
                plugins: { legend: { labels: { usePointStyle: true, pointStyleWidth: 8, font: { size: 9 }, padding: 6 } } },
                scales: {
                    x: { display: false },
                    y: { type: 'linear', position: 'left', grid: { color: 'rgba(255,255,255,0.04)' }, title: { display: true, text: 'Temp °C', font: { size: 10 } } },
                    y1: { type: 'linear', position: 'right', grid: { drawOnChartArea: false }, title: { display: true, text: 'Humidity %', font: { size: 10 } }, min: 0, max: 100 }
                }
            }
        });
    }

    // --- AQI Area Chart ---
    const areaDatasets = [];
    Object.entries(cityTrends).forEach(([city, trs]) => {
        const last20 = trs.slice(-20);
        const col = cityColors[city] || '#94a3b8';
        areaDatasets.push({
            label: city, data: last20.map(t => t.aqi),
            borderColor: col, backgroundColor: col + '12',
            borderWidth: 2, fill: true, tension: 0.4, pointRadius: 0,
        });
    });
    const areaLabels = Array.from({ length: 20 }, (_, i) => i + 1);
    const areaCtx = document.getElementById('aqiAreaChart').getContext('2d');

    if (aqiAreaChart) {
        aqiAreaChart.data.labels = areaLabels;
        aqiAreaChart.data.datasets = areaDatasets;
        aqiAreaChart.update('none');
    } else {
        aqiAreaChart = new Chart(areaCtx, {
            type: 'line',
            data: { labels: areaLabels, datasets: areaDatasets },
            options: {
                responsive: true, maintainAspectRatio: false,
                interaction: { mode: 'index', intersect: false },
                plugins: { legend: { labels: { usePointStyle: true, pointStyleWidth: 8, font: { size: 9 }, padding: 8 } } },
                scales: {
                    x: { display: false },
                    y: { grid: { color: 'rgba(255,255,255,0.04)' }, beginAtZero: true, title: { display: true, text: 'AQI', font: { size: 10 } } }
                }
            }
        });
    }
}

async function updateAlerts() {
    const data = await fetchJSON('/alerts');
    if (!data || !data.alerts) return;

    const feed = document.getElementById('alertFeed');
    document.getElementById('alertTotal').textContent = `${data.total || 0} alerts`;

    if (data.alerts.length === 0) {
        feed.innerHTML = '<div class="loading-placeholder">No anomalies detected — air quality within safe limits ✅</div>';
        return;
    }

    feed.innerHTML = '';
    data.alerts.slice(0, 30).forEach(alert => {
        const item = document.createElement('div');
        item.className = 'alert-item';
        item.innerHTML = `
            <span class="alert-badge ${alert.alert_type}">${alert.alert_type}</span>
            <span class="alert-city">${alert.city}</span>
            <span class="alert-info">AQI ${alert.aqi} · PM2.5 ${alert.pm25}</span>
            <span class="alert-time">${formatTime(alert.timestamp)}</span>
        `;
        feed.appendChild(item);
    });
}

// --- AI Chat ---
async function sendChat() {
    const input = document.getElementById('chatInput');
    const query = input.value.trim();
    if (!query) return;

    const messages = document.getElementById('chatMessages');

    const userMsg = document.createElement('div');
    userMsg.className = 'chat-msg user';
    userMsg.innerHTML = `<div class="chat-avatar">You</div><div class="chat-bubble">${escapeHtml(query)}</div>`;
    messages.appendChild(userMsg);
    input.value = '';
    messages.scrollTop = messages.scrollHeight;

    const loadingMsg = document.createElement('div');
    loadingMsg.className = 'chat-msg bot';
    loadingMsg.innerHTML = `<div class="chat-avatar">AI</div><div class="chat-bubble" style="opacity:0.6">Thinking...</div>`;
    messages.appendChild(loadingMsg);
    messages.scrollTop = messages.scrollHeight;

    try {
        const resp = await fetch(`${API_BASE}/ask`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query }),
        });
        const data = await resp.json();
        loadingMsg.remove();

        const botMsg = document.createElement('div');
        botMsg.className = 'chat-msg bot';
        const answer = data.answer || 'Sorry, I could not process that query.';
        const sources = data.sources && data.sources.length > 0
            ? `<br><span style="font-size:0.58rem;color:#64748b">Sources: ${data.sources.join(', ')}</span>` : '';
        botMsg.innerHTML = `<div class="chat-avatar">AI</div><div class="chat-bubble">${escapeHtml(answer)}${sources}</div>`;
        messages.appendChild(botMsg);
    } catch (e) {
        loadingMsg.remove();
        const errMsg = document.createElement('div');
        errMsg.className = 'chat-msg bot';
        errMsg.innerHTML = `<div class="chat-avatar">AI</div><div class="chat-bubble" style="color:var(--accent-red)">Unable to reach AI advisor. Make sure RAG server is running.</div>`;
        messages.appendChild(errMsg);
    }
    messages.scrollTop = messages.scrollHeight;
}

// Enter key handler
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('chatInput').addEventListener('keydown', (e) => {
        if (e.key === 'Enter') sendChat();
    });
    // Close modal on Escape
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeCityModal();
            closeNav();
        }
    });
});

// --- Main Refresh Loop ---
async function refreshDashboard() {
    try {
        const [_, cities] = await Promise.all([updateSummary(), updateCityCards()]);
        await Promise.all([updateCharts(cities), updateTrendCharts(), updateAlerts()]);
    } catch (e) {
        console.warn('[Refresh] Error:', e.message);
    }
}

refreshDashboard();
setInterval(refreshDashboard, REFRESH_INTERVAL);
