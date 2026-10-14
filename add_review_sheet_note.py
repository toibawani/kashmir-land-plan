# Append a content note under the generated sheet.
p = "REVIEW_SHEET.md"
s = open(p).read()
anchor = "This sheet is generated from the live catalogue. The app builds its"
if anchor in s:
    s = s.replace(anchor, anchor + "\n\nA copy of this sheet travels with the paper: the reference an officer writes on, and the maintainer fills in once.", 1)
open(p, "w").write(s)
