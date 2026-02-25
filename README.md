# EsotericInkSite

## Scope

Static front-end for Esoteric Ink.

## Runtime

- Local preview port: `4173`
- Local preview URL: `http://localhost:4173/index.html`
- WordPress runtime: loader-based embed supported

## Document Set

- `index.html`: home surface
- `socials.html`: channel and storefront routing surface
- `about.html`: factual project/profile surface

## Asset Set

- `CSSMAIN.css`: layout, typography, effects, motion
- `JSMAIN.js`: boot/flicker orchestration, SPA-style nav swap, title/version enforcement
- `dev_server.py`: local HTTP preview server
- `launch-preview.bat`: local server entrypoint
- `stop-preview.bat`: local server shutdown

## Behavior

- Navigation model: in-page shell swap via `JSMAIN.js`
- Intro model: element-level flicker sequence with top-to-bottom bias
- Top bar model: stable during flicker pass
- Version label target: `ESOTERIC INK SUBSYSTEMS™ v3.86`
