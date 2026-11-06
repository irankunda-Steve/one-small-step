# One Small Step

A focused, zero-dependency website for people who feel overwhelmed or
procrastinate. Pick one task, define one small next step, and keep going
one step at a time. The first visit opens directly into the tool.

## Location

`C:\Users\irank\Projects\one-small-step\`

## Quick start

No build step, no packages. Serve the folder over HTTP (ES modules require
`http://`, not `file://`):

```powershell
cd C:\Users\irank\Projects\one-small-step
python -m http.server 8080
# then open http://localhost:8080
```

## What it does

- **Screen 1 — choose a task:** prompt, free-text field, Continue.
- **Screen 2 — define a next step:** task shown as context, Back link that
  preserves the task, free-text field, Continue.
- **Screen 3 — ready to act:** task + Edit, next step prominent + Edit,
  Done. No progress bar. Editing the task preserves the existing next
  step for revision; continuing returns to the ready screen.
- **Screen 4 — step completed:** “Nice work. One step at a time.”, the
  completed step with a checkmark, “Choose the next step” (same task,
  blank field). No progress bar, no second action.
- **Validation:** empty Continue shows “Add a response to keep going.”
  near the field and does not advance.
- **Saving:** automatic, on-device (`localStorage` key
  `onesmallstep.plan.v1`), no Save button or account. Returning visitors
  resume their saved plan.
- **Design:** warm off-white page, sage accents, warm charcoal text,
  rounded sans-serif, narrow centered single column (same on phones),
  stepping-stone brand mark on every screen, one geometric illustration
  style with per-screen variations, muted-sage pill button, subtle fade.

## Architecture

```text
index.html          all four screens + brand + device note (no inline logic)
css/styles.css      design tokens, single-column layout, fade, responsive
js/store.js         DATA: plan model, validation, persistence (no DOM)
js/app.js           CONTROLLER: screen flow, prefill, edit/back wiring, boot
tests/store.test.js Node built-in test runner (node:test + assert)
```

Separation mirrors `northstar-dashboard`: `store.js` never touches the
DOM; `app.js` is the only file that reads/writes the document.

## Tests

```powershell
node --test tests/
```

## Limitations

- Single-user, single-browser: no accounts, no sync, no backend.
- Storage quota is the browser's `localStorage` limit (~5 MB).
- `file://` opening may block ES modules — use the local server above.
