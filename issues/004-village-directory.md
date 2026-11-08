# 004: A village name cannot be found yet

**Status.** Open. This is the largest honest gap in the app and the first item in
`docs/MASTER-BRIEF.md`.

**What is missing.** A citable, machine-readable list of revenue villages for each
district, with the tehsil, block and patwar halqa each belongs to. The app shows
official counts — 6,832 revenue villages, 207 tehsils, 1,646 patwar halqas — but
cannot let a farmer find theirs.

**Why it has not shipped.** The counts are published; the lists are published per
district in formats that differ by district. Anantnag's NIC page lists 342 census
villages against 394 revenue villages in the official table, so that list fails
the reconciliation rule this project applies to every district row. Transcribing
names from page images would produce plausible errors, which is the failure mode
the whole project is built to avoid. Shipping one district out of twenty would
look like coverage that does not exist.

**What would close it.**

1. Obtain a list per district from the Census 2011 village directory, the LGD
   village directory, or the district NIC page.
2. Reconcile the row count to `LAND.admin(district).villages`; a mismatch is a
   build failure, not a warning.
3. Ship names and parents only — village, tehsil, block, halqa. No crop, soil or
   irrigation attribute, because no public dataset carries one at village level.
4. For any district that does not reconcile, show "list not held here" rather
   than filling the gap.

**What it must not become.** A search box that suggests a nearby-sounding village,
or a village page with typical crops. Both would be invented detail with a
confident interface.
