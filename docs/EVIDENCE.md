# Evidence notes for the officer visit

Working notes, not a review. Nothing in this file is linked from the app, and
no catalogue entry is described anywhere as verified because of it. The review
sheets were re-stamped once, in v1.3.0, because the source labels below changed
what a sheet prints: every sheet now carries `v1.3.0 · catalogue fd4e3f2`, and
`node tools/review-sheet.js --check` passes. No verdict in any sheet changed,
and nothing was marked reviewed.

What this is: for each catalogue entry, the public sources I could find and
open, and an honest verdict on whether they support what the entry says. It
exists so that a conversation with an agriculture officer starts from "here is
what I could check and here is what I could not", instead of from a list of
questions with no preparation behind them.

How it was done. Every URL below was opened on **18 November 2026** and read
before it was cited. Nothing is cited from memory, from a search snippet alone,
or from a document I could not open. Only official or institutional publishers
are used: ICAR, CSIR, NITI Aayog, the Government of India's agriculture
programme documents, the J&K Agriculture Production and Horticulture
departments, and SKUAST. No news site, blog, seed seller or consultancy appears
in the source list.

What the verdicts mean:

- **supported** — an official source states the entry's main claim for J&K, and
  where the entry names a district or zone, a source places it there.
- **partly supported** — the activity or the scheme is documented for J&K, but
  at least one claim the entry makes (a district detail, a cost, a return, a
  timing) is not in any source I could open. The unsupported part is named.
- **not found** — I could not find an official source that states the claim. No
  entry in this catalogue fell into this category outright; the gaps are
  narrower than that and are recorded per entry and in the last section.

One structural note before the entries: a catalogue entry is not a claim that a
given plot suits a crop; it is a prompt for a conversation. So "supported" here
means the activity and its regional placement are documented, never that the
entry is right for a particular farmer.

---

## Sources opened

| Id | Document | Publisher | URL | What it supports |
| --- | --- | --- | --- | --- |
| S1 | Jammu and Kashmir profile | ICAR | <https://icar.org.in/en/node/17267> | State-level farming systems: horticulture-based valley, apple/walnut/apricot, rice-mustard and rice-oat fodder in the valley, rice-wheat and maize-wheat in Jammu. |
| S2 | Farmer's Guide for Jammu and Kashmir | Department of Agriculture and Cooperation, Government of India | <https://farmech.dac.gov.in/Content/FarmerGuide/JK/1J.html> | Agro-climatic zone structure, elevation and rainfall range, leading crops per zone, and the share of India's temperate fruit grown here. |
| S3 | Roadmap for Horticulture Development in the UT of Jammu and Kashmir | NITI Aayog | <https://www.niti.gov.in/sites/default/files/2026-04/Roadmap-for-Horticulture-Development-in-the-UT-of-Jammu-and-Kashmir.pdf> | The four agro-climatic zones with their district coverage, district crop clusters, the four saffron districts, and the protected-cultivation target. |
| S4 | Saffron production | CSIR-Indian Institute of Integrative Medicine | <https://iiim.res.in/saffron-production/> | Saffron districts, karewa soils, elevation band, and the Pampore concentration. |
| S5 | Economic Revival of J&K Saffron Sector (National Mission on Saffron) | Rashtriya Krishi Vikas Yojana, Government of India | <https://rkvy.da.gov.in/static/download/pdf/Saffron_Mission.pdf> | Saffron districts in the mission's own words, and why karewa uplands are used (irrigation is generally unavailable there). |
| S6 | Agro Climatic Status of the Division | Department of Horticulture, Jammu | <https://hortijmu.jk.gov.in/agroclimate.html> | The three Jammu-division zones with altitude bands, and the fruit crops listed as suitable in each. |
| S7 | District Wise Focused Crops | Department of Horticulture, Jammu | <https://hortijmu.jk.gov.in/districtwise.html> | Which zones each Jammu district spans, and the fruit crops the department focuses on there. |
| S8 | Package of Practices for Vegetable Crops, 2020 | SKUAST-Jammu, Directorate of Extension | <https://skuastjammu.ac.in/newsite/pdf/1693218037POP%20Vegetable%20POP%202020.pdf.pdf> | Kitchen gardening as a documented practice, the three Jammu zones, and hill vegetable production out of the plains season. The 2020 edition replaced the 2016 one during the v1.3.0 source pass; it is still a Jammu-division document. |
| S9 | Implementation guidelines of 29 projects cleared by the apex committee (HADP) | Holistic Agriculture Development Program, J&K | <https://hadp.jk.gov.in/pdfs/ig.pdf> | Scheme support and cost norms for protected cultivation and beekeeping, and the UT's own fodder deficit figures. |

Two of these are old documents and are used only for the statements above, not
for any current figure: S2 describes 14 districts, which dates it, and S5 is a
2010 mission project whose area and production numbers are not current.

---

## Baramulla district sheet

Sheet: `review-sheets/Baramulla.csv`, six entries, version `v1.2.7 ·
catalogue d20337e`. Baramulla is in the Kashmir valley, which the sources place
in the temperate zone (S2, S3). The district also appears by name in the NITI
roadmap's pear cluster, with Budgam and Pulwama, and in its cherry cluster, with
Ganderbal and Srinagar (S3).

I looked for a Baramulla district horticulture page of the kind several Jammu
districts publish. `baramulla.nic.in/horticulture` returns 404, and the district
home page has no horticulture section, so there is no district-level page to
cite. That is a gap in what is available, not evidence against anything.

### `beekeeping` — Beekeeping as an allied activity

Entry text: "Beekeeping as an allied activity".

Sources found:

- **S9**, HADP implementation guidelines, Project 6 (beekeeping): assistance for
  establishing bee colonies at 50–80% under MIDH/KVIC, 40% for strengthening
  existing units, 40% for equipment, 100% NBHM support for GIS traceability
  labs, and a component for migratory beekeeping. Supports: the activity is
  recognised and subsidised in J&K, at 50 colonies per unit, in clusters.
- **S3**, NITI roadmap: lists honey among the UT's noted products, alongside
  saffron and kala zeera. Supports: beekeeping has an established place in the
  UT's horticulture economy.

Verdict: **partly supported**. The activity, its unit size and its subsidy route
are documented. The entry's regional details — that the valley's forage season
is short and colonies need winter management, and that orchard and oilseed
forage is what carries it — are not stated in any source I could open. Those are
plausible and consistent with S1's description of the valley's cropping, but
plausible is not the same as sourced.

### `fodder_or_pasture` — Fodder crop or managed pasture

Entry text: "Fodder crop or managed pasture".

Sources found:

- **S1**, ICAR: the major cropping systems in the valley include rice-oat
  fodder. Supports: fodder is part of the established valley rotation, as the
  entry says.
- **S9**, HADP Project 28, Development of Fodder Resources for UT of J&K: green
  fodder requirement about 139 lakh tonnes against about 64 lakh tonnes
  produced, an overall deficit near 41%, and only about 4% of cultivated area
  under fodder crops. Supports: there is a real, officially measured gap that a
  fodder crop would address, which is the entry's core argument.
- **S2**, Farmer's Guide: fodder crops appear within the zone cropping patterns.
  Supports: fodder is a normal part of the system rather than an experiment.

Verdict: **supported** for the claim that fodder fits the valley system and that
a fodder gap exists. The entry's advice to ask which species the local office
recommends is exactly right: none of these documents names a species for
Baramulla.

### `intercrop_or_improve` — Improve what you already grow, or add an intercrop

Entry text: "Improve what you already grow, or add an intercrop".

Sources found:

- **S1**, ICAR: valley systems are rice-mustard and rice-oat fodder; Jammu runs
  rice-wheat where irrigated and maize-wheat where rainfed. Supports: the entry's
  named rotations, including "rice followed by mustard or oats" for the valley.
- **S2**, Farmer's Guide: rice is the chief crop of the Kashmir zone, followed by
  maize, barley and wheat. Supports: the crop hierarchy the entry describes.
- **S9**, HADP: crop diversification and inclusion of pulses and oilseeds are
  explicit programme objectives. Supports: a second crop or a changed rotation
  is a supported route, not a private idea.

Verdict: **supported**. The rotation names in the entry match the two documents
that describe J&K cropping systems. What is not sourced is any yield or income
effect of the change, and the entry does not claim one.

### `kitchen_garden` — Kitchen garden and mixed vegetables

Entry text: "Kitchen garden and mixed vegetables".

Sources found:

- **S8**, SKUAST-Jammu package of practices: kitchen gardening is described as
  the most efficient use of household organic waste and used water, and
  vegetables are noted as suitable for backyards, roofs and corridors. Supports:
  the practice and its small-area, low-input character.
- **S9**, HADP: vegetables under open and protected cultivation are a programme
  component, with MIDH norms. Supports: there is official support for vegetable
  growing, including on small areas.
- **S3**, NITI roadmap: vegetables, including off-season and hydroponic, are
  recommended across all zones and districts. Supports: vegetables are a
  supported direction for the UT, not only for Jammu.

Verdict: **partly supported**, and now cited in the app with that limit on
show. The practice is documented, but S8 is a Jammu-division document and
speaks about Jammu's three zones. I found no official source describing
kitchen-garden practice in the Kashmir valley specifically, which is what
Baramulla needs. Since v1.3.0 the entry cites S8 with the visible label "Jammu
division, not confirmed for the Kashmir valley", so a reader sees the gap
rather than having to find this file. The entry's own claims are modest and its
water warning is generic; the gap is the local practice, not the idea.

### `protected_cultivation` — Protected cultivation: polyhouse, mushroom or nursery

Entry text: "Protected cultivation: polyhouse, mushroom or nursery".

Sources found:

- **S9**, HADP: protected cultivation is a listed intervention, with assistance
  under MIDH norms to a maximum of 600 m² per beneficiary, extendable by 400 m²
  on a divisional committee's recommendation, with clusters designated per
  division. Supports: the structure, the scale and the subsidy route all exist.
- **S3**, NITI roadmap: proposes increasing protected cultivation by 6,000–8,000
  units across all districts, and names off-season polyhouse vegetables as a
  diversification model. Supports: official intent to expand exactly this.
- **S9**, HADP Project 3: hi-tech greenhouse and polyhouse components to be run
  on MIDH norms. Supports: the scheme the officer would actually use.

Verdict: **partly supported**. The scheme, the size and the direction are well
documented. The entry's economic claims — that a structure earns from a much
smaller area and that the margin is in management — are not in these documents,
and the entry already refuses to give a cost. Mushroom and nursery, named in the
title, are not covered by these sources; the documents I found address
polyhouse and greenhouse.

### `orchard_temp` — Temperate fruit and nut trees

Entry text: "Temperate fruit and nut trees".

Sources found:

- **S1**, ICAR: the valley's farming is predominantly horticulture based, with
  apple, walnut and apricot the important fruits; apple alone covers about 1.08
  lakh ha in the state. Supports: tree fruit is the established system, so
  advice, planting material and buyers exist locally, as the entry says.
- **S2**, Farmer's Guide: nearly 75% of India's temperate fruit, mainly apples,
  is grown here. Supports: the crop's regional importance.
- **S3**, NITI roadmap: Baramulla appears in the pear cluster (with Budgam and
  Pulwama) and the cherry cluster (with Ganderbal and Srinagar); the valley's
  districts are listed under the temperate band. Supports: the district-level
  claim that temperate fruit is planted in Baramulla specifically.
- **S6**, Jammu horticulture zones: temperate crops include apple, pear, stone
  fruits, walnut, pecan and almond. Supports: the species list the entry uses,
  for the temperate band generally.

Verdict: **supported**. This is the best-evidenced entry in the Baramulla sheet:
its main claim, that temperate fruit and nuts are the established system on
suitable ground here, is stated in three independent official documents. What
remains local and unsourced is exactly what the entry says remains local:
whether a particular site's elevation, winter cold and frost pockets suit a
particular species and variety.

---

## The rest of the catalogue

The other 19 district sheets draw from the same eight entries. Coverage by
sheet, counted from the CSVs:

| Entry | Sheets that include it |
| --- | --- |
| `kitchen_garden`, `fodder_or_pasture`, `intercrop_or_improve`, `protected_cultivation`, `beekeeping` | all 20 |
| `orchard_temp` | 16 (all except Jammu, Kathua, Samba and Udhampur) |
| `orchard_subtrop` | 10 (Jammu, Kathua, Samba, Udhampur, Reasi, Rajouri, Poonch, Doda, Ramban, Kishtwar) |
| `saffron_karewa` | 4 (Pulwama, Budgam, Srinagar, Kishtwar) |

### `orchard_subtrop` — Sub-tropical fruit trees

Entry text: "Sub-tropical fruit trees".

Sources found:

- **S6**, Jammu horticulture zones: in the sub-tropical zone, suitable crops are
  mango, litchi, citrus, guava, ber, loquat, grapes and strawberry; un-irrigated
  sub-tropical ground is listed with mango, citrus, guava, ber and aonla.
  Supports: the species list in the entry, and the zone where it applies.
- **S7**, district-wise focused crops: Jammu, Samba, Kathua, Udhampur, Reasi,
  Rajouri, Poonch and Ramban have sub-tropical bands with citrus, mango, guava
  and aonla named. Supports: the district-level placement.
- **S3**, NITI roadmap: guava and citrus recommended for the sub-tropical and
  intermediate zones of Jammu, Samba, Kathua, Udhampur, Reasi and Rajouri.
  Supports: the same placement from a second institution.

Verdict: **supported**. The species and the districts match across a departmental
page, a district table and a national roadmap. The entry's caution that the
upper parts of these districts are too cold for most sub-tropical fruit is also
consistent with S6 and S7, which put those areas in the intermediate or
temperate bands — though neither document says it in those words.

### `saffron_karewa` — Saffron on suitable upland

Entry text: "Saffron on suitable upland".

Sources found:

- **S4**, CSIR-IIIM: saffron in J&K is grown primarily in four districts —
  Pulwama, Budgam, Srinagar and Kishtwar — on well-drained karewa soils at
  1,500–2,000 m, with 86% of the farming system at Pampore. Supports: the
  district list, the karewa requirement and the Pampore claim.
- **S5**, National Mission on Saffron: Pulwama is the main contributor,
  followed by Budgam, Srinagar and Kishtwar; karewa uplands are used because
  irrigation is generally unavailable there. Supports: the district order and
  the drainage-before-water point in the entry's water note.
- **S3**, NITI roadmap: saffron is grown exclusively in Pulwama, Budgam,
  Srinagar and Kishtwar; Pulwama and Kishtwar appear as the two concentrated
  clusters; the roadmap also proposes piloting saffron in non-traditional areas
  including Poonch and Bandipora. Supports: the four-district claim and the
  entry's warning that the crop follows the ground.

Verdict: **supported** for the four districts and the karewa requirement. Two
district details are thinner than the others and are on the question list
below: Kishtwar appears as a much smaller second cluster in S3, and the
"grown in and around Srinagar" line has no district-level production figure
behind it in any source I opened. The roadmap's proposal to pilot saffron
outside these four districts is also worth knowing before the visit: the
official position is not that the crop is limited forever.

---

## What the v1.3.0 source pass changed

This is the one round allowed to change source metadata. What moved, and what
did not:

1. **`niti_horticulture` now points at the roadmap itself.** It used to point at
   `https://www.niti.gov.in/`, the institute's home page, which contains no
   roadmap. The entry now cites the Roadmap for Horticulture Development PDF
   (S3 above), and the build fails a source that cites a site root.
2. **`iiim_saffron` keeps its page and gains the label "Page last updated
   January 2021".** No current replacement was found that states the four
   saffron districts; the J&K Directorate of Agriculture saffron manual would be
   the right replacement, but its file could not be opened on the day of this
   pass, so it is not cited.
3. **`dac_jk_guide` keeps its document and gains the label "Older Government of
   India guide; its district list predates the current districts".** It remains
   sound for zones and cropping patterns and is still not to be used for
   administrative counts.
4. **`rkvy_saffron` keeps its document and gains the label "2010 mission
   document; its area and production figures are historical".** Its district
   statement is the reason it is cited, not its figures.
5. **Kitchen gardening gained a citation.** The entry had none; it now cites the
   2020 SKUAST-Jammu vegetable guide, carrying the label "Jammu division, not
   confirmed for the Kashmir valley". That label is the honest state of the
   evidence: the practice is documented, but not for this district.
6. **No wording changed.** No option, risk note, month, checklist item or
   question was edited, and no entry was marked reviewed.

Still open, and still not fixed here:

- No official source describes kitchen-garden practice in the Kashmir valley,
  and `baramulla.nic.in` publishes no horticulture page. Both gaps are about the
  availability of documents, and both argue for asking rather than asserting.
- The four tehsil lists and the older district booklets are unchanged by this
  pass; they carry their own scope labels now.

---

## Ask the officer first

The ten items I would raise before anything else, weakest evidence or most
district-dependent first. Each is a question, not a claim.

1. **Saffron in Kishtwar (`saffron_karewa`).** Official documents place Kishtwar
   as a much smaller second saffron cluster than Pulwama. *Is saffron still grown
   commercially in Kishtwar, on what kind of ground, and is planting material
   available there?*
2. **Saffron in Srinagar (`saffron_karewa`).** The district is named in all three
   saffron sources, but I found no district-level area or production figure.
   *Is saffron grown within Srinagar district now, and where — which villages or
   karewa blocks?*
3. **Saffron on a specific plot (`saffron_karewa`).** The sources give soil type
   and elevation band, not a test a farmer can apply.
   *What would you check on my ground before I spend anything on corms, and what
   does a corm cost from an approved source this season?*
4. **Kitchen garden in the valley (`kitchen_garden`).** The practice is
   documented, but in a Jammu-division package of practices. *In Baramulla, which
   vegetables does the department actually recommend for a household plot, and
   does the answer change between the valley floor and the side slopes?*
5. **Beekeeping forage and disease (`beekeeping`).** The scheme is documented;
   the seasonal and disease detail is not. *Who locally keeps hives, what do they
   forage on month by month here, and what is the current advice for mite
   treatment and wintering?*
6. **Fodder species (`fodder_or_pasture`).** The UT's fodder deficit is in the
   HADP document, but no source names a species for this district. *Which fodder
   crop would you sow on my land, in which season, and is seed available through
   the department?*
7. **Protected cultivation on a small plot (`protected_cultivation`).**
   Assistance runs to 600 m² under MIDH norms, extendable by 400 m², but the
   entry's economics are not sourced. *For a plot my size, what would a structure
   cost after subsidy, who would I sell to, and is mushroom or nursery covered by
   the same norms or a different one?*
8. **Temperate fruit site fit (`orchard_temp`).** The crop's regional importance
   is well sourced; the site question is not. *Given my elevation and frost
   pattern, which species and varieties would you plant, and which nursery stock
   is approved this year?*
9. **Sub-tropical fruit on the boundary (`orchard_subtrop`).** The districts and
   species are sourced, but the upper parts of Rajouri, Poonch and Reasi are in
   the intermediate or temperate bands. *Is my village in the sub-tropical band
   or above it, and if it is above, does anything on this list still work here?*
10. **Changing the existing rotation (`intercrop_or_improve`).** Rice-mustard and
    rice-oat are documented as valley systems, but not for my fields. *What would
    you change in my current rotation, what would it cost, and what happens to
    the harvest I already get if it does not work?*

---

Not reviewed, not verified, not linked from the app. The officer's answers are
what a review would be built from, and none has been given yet.
