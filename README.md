# EsotericInkSite

Standalone Esoteric Ink front-end (no WordPress dependency required for local development).

## Local Preview (Recommended)

1. Run `launch-preview.bat`.
2. Browser opens to `http://localhost:4173/index.html`.
3. Edit files in this repo and refresh the same browser tab.
4. Run `stop-preview.bat` when done.

## Pages

- `index.html` - Home
- `socials.html` - Socials
- `about.html` - About

## Core Assets

- `CSSMAIN.css` - Visual style and animation rules
- `JSMAIN.js` - Boot logic, version label enforcement, and page behavior

## Behavior Notes

- Top nav is intentionally kept stable during boot (no boot flicker).
- Background boot flicker is disabled; content chunks carry the intro effect.
- Post-boot cascade is opt-in. To enable it for a root container, add:
  - `data-ei-cascade-after-boot="true"` on `#ei-spa-root`

## Troubleshooting

- If preview does not open, run `launch-preview.bat` from Command Prompt to see errors.
- If Python is missing, install Python and ensure `py` or `python` is on PATH.
- If server is stuck, run `stop-preview.bat` then `launch-preview.bat` again.
