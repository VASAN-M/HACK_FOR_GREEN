# Air Quality Index (AQI) Guidelines — India & WHO Standards

## Indian National Air Quality Index (NAQI)

The National Air Quality Index (NAQI) was launched in India on October 17, 2014. It provides a single number to represent air quality by considering eight pollutants: PM10, PM2.5, NO2, SO2, CO, O3, NH3, and Pb.

### AQI Categories

| AQI Range | Category       | Health Implications                                                                 | Color  |
|-----------|----------------|------------------------------------------------------------------------------------|--------|
| 0–50      | Good           | Minimal impact on health                                                            | Green  |
| 51–100    | Satisfactory   | Minor breathing discomfort to sensitive people                                      | Yellow |
| 101–200   | Moderate       | Breathing discomfort to people with lung/heart disease, children, and older adults   | Orange |
| 201–300   | Poor           | Breathing discomfort on prolonged exposure; discomfort to people with heart disease  | Red    |
| 301–400   | Very Poor      | Respiratory illness on prolonged exposure; effect on heart disease patients          | Purple |
| 401–500   | Severe         | Serious health impacts on all; may need to avoid outdoor activity entirely           | Maroon |

### Key Pollutants and Their Safe Limits

#### PM2.5 (Fine Particulate Matter, ≤2.5 μm)
- **WHO Guideline (2021)**: Annual mean ≤5 μg/m³; 24-hour mean ≤15 μg/m³
- **India NAAQS**: Annual mean ≤40 μg/m³; 24-hour mean ≤60 μg/m³
- **Health Effects**: Penetrates deep into lungs and bloodstream. Long-term exposure causes cardiovascular disease, lung cancer, and respiratory infections. Leading environmental risk factor for premature death.

#### PM10 (Particulate Matter, ≤10 μm)
- **WHO Guideline (2021)**: Annual mean ≤15 μg/m³; 24-hour mean ≤45 μg/m³
- **India NAAQS**: Annual mean ≤60 μg/m³; 24-hour mean ≤100 μg/m³
- **Health Effects**: Causes respiratory issues, aggravates asthma, and increases hospital admissions.

#### NO2 (Nitrogen Dioxide)
- **WHO Guideline**: Annual mean ≤10 μg/m³; 24-hour mean ≤25 μg/m³
- **India NAAQS**: Annual mean ≤40 μg/m³; 24-hour mean ≤80 μg/m³
- **Sources**: Vehicle exhaust, power plants, industrial emissions
- **Health Effects**: Inflames airways, worsens asthma, reduces lung function.

#### SO2 (Sulfur Dioxide)
- **WHO Guideline**: 24-hour mean ≤40 μg/m³
- **India NAAQS**: Annual mean ≤50 μg/m³; 24-hour mean ≤80 μg/m³
- **Sources**: Burning fossil fuels, industrial processes
- **Health Effects**: Causes respiratory problems, contributes to acid rain.

#### CO (Carbon Monoxide)
- **Safe Level**: 8-hour mean ≤4 mg/m³
- **Sources**: Incomplete combustion, vehicle exhaust, biomass burning
- **Health Effects**: Reduces oxygen delivery in blood, dangerous at high concentrations.

#### O3 (Ground-level Ozone)
- **WHO Guideline**: 8-hour mean ≤100 μg/m³
- **India NAAQS**: 8-hour mean ≤100 μg/m³
- **Sources**: Formed by reaction of sunlight with NOx and VOCs
- **Health Effects**: Triggers asthma, reduces lung function, causes chest pain.

## AQI Calculation Formula

The AQI for each pollutant sub-index is calculated using linear interpolation:

```
AQI_p = ((I_high - I_low) / (C_high - C_low)) * (C_p - C_low) + I_low
```

Where:
- C_p = the actual concentration of pollutant p
- C_low = the breakpoint concentration ≤ C_p
- C_high = the breakpoint concentration ≥ C_p
- I_low = the AQI value corresponding to C_low
- I_high = the AQI value corresponding to C_high

The overall AQI is the maximum of all individual pollutant sub-indices.

## India's Most Polluted Cities (Historical Data)

Delhi, Kanpur, Varanasi, Ghaziabad, Gurugram, and Patna consistently rank among India's most polluted cities. Delhi's winter AQI regularly exceeds 400 due to crop stubble burning, vehicular emissions, and temperature inversions.

## Seasonal Air Quality Patterns in India

- **Winter (Nov–Feb)**: Worst air quality due to temperature inversions trapping pollutants, crop burning, and increased heating
- **Summer (Mar–Jun)**: Moderate; dust storms in North India raise PM10
- **Monsoon (Jul–Sep)**: Best air quality; rain washes out pollutants
- **Post-Monsoon (Oct–Nov)**: Rapid deterioration; Diwali firecrackers and stubble burning
