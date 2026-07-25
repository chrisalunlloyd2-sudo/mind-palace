# Mind Palace Lakehouse — Architecture

## Overview
Multi-level 3D lakehouse with interactive objects, filing system, and SOV data bridge.
Built as a modular WebGL 2.0 application with a planned Java FX desktop port.

## Directory Structure
```
mind-palace/
├── src/
│   ├── engine/          # WebGL renderer, camera, lighting
│   │   ├── renderer.js  # WebGL 2.0 core with shaders
│   │   ├── camera.js    # First-person 6DOF camera
│   │   └── lakehouse.js # Main entry point, orchestrator
│   ├── map/             # Map loader, room definitions, levels
│   │   └── map_loader.js
│   ├── objects/         # Interactive object system
│   │   └── object_system.js
│   ├── physics/         # Movement, collision, object physics
│   │   └── collision.js
│   ├── ui/              # HUD, inventory, interaction prompts
│   │   └── hud.js
│   ├── data/            # SOV bridge, content integration
│   │   └── filing_system.js
│   └── desktop/         # Java FX port (Phase 5)
│       └── Main.java
├── maps/
│   ├── lakehouse/       # Main environment
│   │   └── map.json
│   ├── templates/       # Room blueprints
│   └── objects/         # Object definitions
├── assets/              # Source textures, models
├── tools/               # Map editor, asset compiler
└── docs/                # Architecture docs
```

## Phases

### Phase 0 — Architecture & Asset Pipeline
- WebGL 2.0 renderer with shaders
- Camera system with mouse lock
- Map format and room definitions
- Object system with 20+ object types

### Phase 1 — WebGL 3D Engine
- Texture-mapped floors/ceilings
- Dynamic lighting (point, ambient, emissive)
- Fog for depth atmosphere
- Chunk-based rendering

### Phase 2 — Lakehouse Environment
- 19 rooms across 4 levels
- 15+ room types (living room, kitchen, office, library, etc.)
- Level transitions (stairs, elevator)
- Exterior (porch, deck, lake view)

### Phase 3 — Interactive Objects & Physics
- Container objects (drawers, cabinets, trunks)
- Movable furniture (HL1-style chair pushing)
- Minecraft-style placement system
- Raycast-based interaction

### Phase 4 — Filing System & SOV Bridge
- File cabinets with 2-4 drawers
- Color-coded folders by category
- Documents with text/links
- Auto-populate from SOV KV/KG data

### Phase 5 — Desktop Port (Java FX)
- Shared core logic in pure Java
- Java FX 3D renderer
- Higher polygon counts, PBR materials
- Native file system access

### Phase 6 — Modular Code Architecture
- Clean separation of concerns
- Event-driven communication
- State persistence (localStorage)
- Build pipeline

## Controls
- WASD — Move
- Mouse — Look (click to lock)
- E — Interact
- F — Push object
- Q — Cancel placement
- I — Toggle inventory
- M — Toggle minimap
- Esc — Close menus

## Object Types
- container: Drawers, cabinets, trunks (open/close, hold items)
- furniture: Static or movable (tables, beds, shelves)
- movable: Pick up, push, place (chairs, boxes)
- document: Readable content (folders, notes)
- door: Open, lock, transition
- switch: Toggle state (lights, fireplace)

## Filing System
- 3 cabinets (Main Archive, Office Files, Deep Archive)
- 10+ folders across 6 categories
- Auto-populates from SOV KV/KG when available
- Search and filter capabilities
