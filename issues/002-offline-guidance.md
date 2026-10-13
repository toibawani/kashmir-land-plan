# Feature: offline guidance panel

**What the app does now.** The app is offline-first: once opened, everything
except live weather keeps working. The offline indicator is a calm banner and
the weather section is hidden when there is no connection.

**What is rough.** A farmer who just opened the app does not know which features
are still available and which need a connection. "It is working offline" tells
them the app is alive but not what the offline state means for their task
— will the visit card work? Can they open a saved plan? Is the weather section
just waiting?

**What a future version could do.** Show a short guidance banner the first time
the app is offline (and when connectivity returns), in plain language:
- your saved plans and the visit card still work
- live weather needs a connection
- nothing is uploaded anywhere

**Status.** Not built in this round. The offline state is handled by a calm
banner in `js/app.js` and the weather screen hides the live panel.
