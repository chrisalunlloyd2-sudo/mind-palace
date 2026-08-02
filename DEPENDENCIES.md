# Mind Palace — Dependencies (single source of truth)

## Frontend (the app itself)
- **Any modern browser / Android WebView** (WebGL 2.0 required for 3D/4D)
- Zero build step — plain HTML/CSS/JS, served statically

## Optional backend (SOV bridge — only if running the API)
```bash
pip3 install -r requirements.txt   # fastapi + uvicorn
```

## World model (no install needed)
- `data/toc_tok.json` — single source of truth (edit via SIMS1337
  `scripts/toc_tok/editor.py` or directly)
- `data/world.json` — generated: `python3 scripts/build_world.py`
- `js/local-repos.js` reads `data/world.json` first; GitHub public API
  only gap-fills repos not in the world (no duplicates)

## Verify
```bash
python3 scripts/build_world.py --test   # 6 rooms / 4 agents / 13 tasks, deterministic
```
