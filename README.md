# 🏠 Mind Palace — Lakehouse

A multi-level 3D lakehouse with interactive furniture, file cabinets, movable objects, and a complete filing system. Built as a modular WebGL 2.0 application with a planned Java FX desktop port.

## Quick Start
1. Open `index-lakehouse.html` in a modern browser (Chrome/Firefox/Edge)
2. Click the canvas to lock your mouse
3. **WASD** to move, **Mouse** to look around
4. **E** to interact with objects, **F** to push chairs
5. Explore 19 rooms across 4 levels!

## Controls
| Key | Action |
|-----|--------|
| WASD | Move |
| Mouse | Look around (click to lock) |
| E | Interact (open drawers, read documents, toggle lights) |
| F | Push objects (HL1-style chair pushing) |
| I | Toggle inventory |
| M | Toggle minimap |
| Q | Cancel placement |
| Esc | Close menus |

## Features
- **19 rooms** across ground, upper, basement, and attic levels
- **20+ object types**: couches, tables, chairs, beds, bookshelves, file cabinets, fireplaces, lamps
- **Interactive containers**: open drawers, cabinets, trunks
- **Movable furniture**: push chairs like Half-Life 1
- **Filing system**: 3 cabinets with 10+ folders, auto-populated from SOV data
- **Document viewer**: read notes, view links to GitHub repos
- **Minimap**: real-time overhead view of your position
- **Minecraft-style placement**: pick up and place objects anywhere

## Architecture
See `docs/ARCHITECTURE.md` for the full 7-phase plan.

## Phases
- **Phase 0-1**: WebGL engine, camera, lighting ✓
- **Phase 2**: Lakehouse map with 19 rooms ✓
- **Phase 3**: Interactive objects & physics ✓
- **Phase 4**: Filing system & SOV bridge ✓
- **Phase 5**: Desktop Java FX port (planned)
- **Phase 6**: Modular code architecture ✓
- **Phase 7**: Polish & optimization (ongoing)

## Desktop Version
A Java FX port is planned with:
- Hardware-accelerated 3D rendering
- PBR materials and shadow mapping
- Native file system access
- Visual map editor
- Runnable JAR export
