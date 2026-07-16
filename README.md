# 🏛️ MindPalace

A first-person, Wolfenstein-style memory palace for exploring GitHub repositories and sovereign data.

## Live URL

https://chrisalunlloyd2-sudo.github.io/mind-palace/

## What it is

- **Main floor / GitHub Hall:** a long corridor where every door leads to one of your GitHub repos.
- **Inside each room:** bookshelves (stub) holding READMEs, source files, docs, issues, hypotheses.
- **Basement:** locked door leading to real SOV databases / KG / KV / logit (TBD).
- **Archivist mode:** password unlocks editing, book creation, wall editing, and basement access.

## Controls

- **WASD / arrows** — walk
- **Mouse** — look
- **Click** — lock pointer
- **P** — open archivist login
- Default password: `viper:clamchowder` (client-side gate only)

## Repo structure

```
mind-palace/
├── scripts/
│   ├── fetch_repos.py      # GitHub API → repos.json
│   └── build_palace.py      # repos.json → palace.json room graph
├── viewer/                  # static site deployed to GitHub Pages
│   ├── index.html
│   ├── css/palace.css
│   ├── js/
│   │   ├── engine.js        # raycasting renderer
│   │   ├── palace.js        # graph loading / room detection
│   │   ├── auth.js          # password gate
│   │   └── main.js          # entry point
│   └── data/
│       └── palace.json      # generated palace graph
└── .github/workflows/
    └── deploy.yml           # auto-build + deploy every 6 hours
```

## Development

```bash
python3 scripts/fetch_repos.py
python3 scripts/build_palace.py
# open viewer/index.html in browser, or run a local server:
python3 -m http.server 8080 --directory viewer
```

## Roadmap

- [x] Wolfenstein-style hallway walker
- [x] Auto-populated GitHub repo doors
- [x] Password-gated edit/basement mode
- [ ] Bookshelves with real file listings per repo
- [ ] SOV basement integration (real KG/KV/logit)
- [ ] Wall/note editing backed by a real store
- [ ] Cloudflare real auth upgrade
