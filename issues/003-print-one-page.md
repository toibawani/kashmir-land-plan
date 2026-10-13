# Improvement: visit card prints on one clean page

**What the app does now.** `Ctrl/Cmd+P` on the visit card page prints the card
as a single page; section breaks and a small font keep it compact.

**What is rough.** The printed page still gets the browser's default page
header/footer, page numbers and white margins are not tuned. On some printers
the questions section may split awkwardly, and there is no printed page
reference (card title and the reference code) in the page header.

**What a future version could do.**
- Set `@page { margin: 20mm; size: A5 portrait; }` and suppress the browser
  header/footer so each printed page carries the card title and reference code.
- Add `page-break-before` on a "new visit" section so each farmer's card starts
  on its own page when many cards are printed.
- Make the "Made by MLMP" line part of the printed card so the paper artefact
  always shows its origin.

**Status.** Print is functional but unpolished; no silent TODO left in the
rendering path — this is an intentional polish backlog.
