# Land Research Sources

This document lists the public, reputable sources used to improve the land intelligence of My Land, My Plan. The goal is to make recommendations more regionally specific for Jammu & Kashmir while staying fully honest about what is known vs what requires local verification.

## Primary Sources

### Official Government Sources

1. **Department of Horticulture, Jammu**
   - URL: https://hortijmu.jk.gov.in/agroclimate.html
   - Used for: Jammu Division agro-climatic zones and elevation bands
   - Key data: Three zones (Sub-tropical 300-1000m, Intermediate 1000-1500m, Temperate >1500m), monsoon rainfall (1200-1500mm), district coverage

2. **Government of India, Department of Agriculture and Cooperation, Farmer's Guide for Jammu and Kashmir**
   - URL: https://farmech.dac.gov.in/Content/FarmerGuide/JK/1J.html
   - Used for: Regional zone structure, leading crops, elevation and rainfall gradients
   - Key data: Western Himalayan agro-climatic zone, rice leading in Kashmir zone, maize and wheat in Jammu, temperate fruit share

3. **Jammu & KAPD Agricultural Profile**
   - URL: https://www.jkapd.nic.in/pdf/agendaa.pdf
   - Used for: Land utilization patterns, cropping systems, agro-ecological sub-regions
   - Key data: Geographic coordinates, altitude ranges, climate context

### Institutional Research Sources

4. **ICAR, Jammu and Kashmir Profile**
   - URL: https://icar.org.in/en/node/17267
   - Used for: Cultivated area percentage, rainfed proportion, farming systems
   - Key data: 3.3% cultivated area, 60% rainfed, horticulture-based farming in Kashmir valley, rice-wheat and maize-wheat systems

5. **MDPI Study: Impacts of Erratic Snowfall on Apple Orchards in Kashmir Valley (2020)**
   - URL: https://www.mdpi.com/2071-1050/12/21/9206
   - Used for: Apple orchard distribution across Kashmir valley districts
   - Key data: Apple orchards cover 1330 km2, South Kashmir ~56% of orchard area, North Kashmir 32%, Central Kashmir 12%, Baramulla highest area (305 km2), apple contributes 27% to J&K economy

6. **SKUAST-J Rabi Crops Package of Practices**
   - URL: https://www.kvkkishtwar.org/pdf/Package%20of%20Practices%20for%20Rabi%20Crops.pdf
   - Used for: Jammu region cropping systems, pulse and oilseed crops
   - Key data: Three agro-climatic zones (sub-tropical up to 800m, intermediate 800-1500m, temperate above 1500m), chickpea/field pea/lentils as major pulses, mustard/toria oilseeds

7. **Krishi Vigyan Kendra Kulgam Study: Apple Planting Systems in Kashmir Valley**
   - URL: https://doi.org/10.61739/tbf.2023.12.2.350
   - Used for: Apple yield variations across high, mid, and low altitudes
   - Key data: Yield variations by zone and planting density, high-density planting considerations

### Saffron Sources

8. **CSIR Indian Institute of Integrative Medicine, Saffron Production**
   - URL: https://iiim.res.in/saffron-production/
   - Used for: Saffron growing districts in J&K
   - Key data: Saffron grown mainly in Pulwama, Budgam, Srinagar, Kishtwar

9. **Rashtriya Krishi Vikas Yojana, National Mission on Saffron**
   - URL: https://rkvy.da.gov.in/static/download/pdf/Saffron_Mission.pdf
   - Used for: Pampore belt location, karewa uplands
   - Key data: Pampore belt in Pulwama as largest saffron growing area, karewa uplands

### Planning and Policy Sources

10. **NITI Aayog, Roadmap for Horticulture Development in UT of Jammu and Kashmir**
    - URL: https://www.niti.gov.in/
    - Used for: Broad agro-climatic zone structure, district classifications
    - Key data: Four major agro-climatic zones, district placement in subtropical and intermediate zones

## How These Sources Were Used

### Region and Zone Data (js/regions.js)
- Official elevation bands from Department of Horticulture Jammu
- Apple orchard distribution from MDPI study
- District-specific notes for apple concentration (Baramulla highest, South Kashmir leading)
- Saffron district documentation from CSIR-IIIM and RKVY sources

### Catalogue Improvements (js/catalogue.js)
- **orchard_temp**: Added apple concentration data, noted South/North/Central Kashmir distribution, mentioned erratic snowfall risks
- **intercrop_or_improve**: Added established cropping systems (rice-wheat-moong, rice-wheat-fodder, maize-wheat), mentioned pulses and oilseeds for Jammu hills
- **kitchen_garden**: Zone notes for temperature and season length differences
- **fodder_or_pasture**: Zone notes for established fodder practices

## Claims Level

### General Claims (Apply broadly to zone)
- "Temperate fruit and nuts are the established system" (valley_temperate)
- "Rice-wheat where irrigated and maize-wheat where rainfed" (jammu_plains)
- "Maize-wheat rotations on rainfed land" (jammu_hills)

### District-Specific Claims (Where sources support them)
- "Baramulla district has the highest land under apple orchards" (MDPI study)
- "South Kashmir has the highest concentration of apple orchards" (MDPI study)
- "Pulwama is the main saffron producing district" (CSIR-IIIM, RKVY)
- "Kishtwar grows saffron on suitable uplands" (CSIR-IIIM)

### No Precise Figures (Removed to pass honesty guards)
- No specific percentages in catalogue copy
- No exact orchard area figures in farmer-facing text
- No economic contribution percentages in options
- Research figures remain in comments/docs only

## What Still Needs Local Verification

The research improves regional context but cannot replace local verification for:
- Exact plot suitability for specific crops
- Current scheme rules and eligibility
- Local pest and disease patterns
- Recommended varieties for specific micro-areas
- Market conditions and buyer availability
- Soil type and drainage at plot level

These are exactly the questions the app generates for farmers to ask at their local agriculture office.

## Date Range

Sources accessed and incorporated: 2025

## Limitations

- The MDPI apple study is from 2020; orchard area may have changed since
- Official cropping patterns may shift with policy changes
- Climate change effects mentioned in the study (erratic snowfall) are ongoing
- Elevation bands are coarse; individual plots may differ significantly
- District grouping is by majority zone; some districts span multiple zones

## Future Research

As the app evolves, additional research could include:
- More recent orchard area data if available
- District-wise cropping statistics from agriculture department
- Soil survey data for better drainage/soil type guidance
- Market access and transport infrastructure by region
- Climate adaptation guidance specific to J&K farming systems
