#!/usr/bin/env python3
"""
build_world.py — Mind Palace world model builder (self-contained)
=================================================================
Reads data/toc_tok.json (single source of truth) and writes
data/world.json — the SAME world the Virtual Desktop and 4D view render.
Project = room, task = bookshelf object, agent = desktop entity.

  python3 scripts/build_world.py        # regenerate data/world.json
  python3 scripts/build_world.py --test # self-test

Deterministic: identical tree → identical world (hex-anchored layout).
"""
import json, os, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TREE = os.path.join(ROOT, "data", "toc_tok.json")
OUT = os.path.join(ROOT, "data", "world.json")

TYPE_COLORS = {"project": "#00c853", "task": "#00b0ff", "agent": "#ffd600",
               "folder": "#9e9e9e", "root": "#ff5252"}


def walk(node):
    yield node
    for child in node.get("children", {}).values():
        yield from walk(child)


def hex_to_position(hx, scale=4.0):
    """Hex axial (q,r) → deterministic world position. Same tree → same layout."""
    try:
        q, r = (int(x) for x in str(hx).split(","))
    except Exception:
        q, r = 0, 0
    return {"x": q * scale, "z": r * scale}


def build(tree):
    nodes = list(walk(tree.get("root", tree)))
    rooms, desktop = [], {"Agents": [], "Projects": [], "Tasks": [], "Memory": []}

    for n in nodes:
        path = n.get("path", "/")
        if path == "/":
            continue
        name = n.get("title") or path.rstrip("/").split("/")[-1]
        ntype = n.get("type", "folder")
        hexc = n.get("hex", "0,0")
        content = n.get("content", "")

        if ntype == "project":
            pos = hex_to_position(hexc)
            rooms.append({
                "name": name, "path": path, "type": "project", "hex": hexc,
                "description": content,
                "position": pos,
                "color": TYPE_COLORS["project"],
                "bookshelf": {
                    "folders": [{"name": "Tasks", "type": "folder",
                                 "files": [c.get("title") or c.get("path", "").split("/")[-1]
                                           for c in n.get("children", {}).values()]}],
                    "surfaceFiles": [{"name": "README.md", "content": f"# {name}\n\n{content}"}]
                }
            })
            desktop["Projects"].append({"name": name, "path": path, "hex": hexc, "kind": "folder"})
        elif ntype == "task":
            desktop["Tasks"].append({"name": name, "path": path, "hex": hexc, "kind": "file", "content": content})
        elif ntype == "agent":
            desktop["Agents"].append({"name": name, "path": path, "hex": hexc, "kind": "file", "content": content})
        else:
            desktop["Memory"].append({"name": name, "path": path, "hex": hexc, "kind": "file", "content": content})

    return {"generated": "deterministic", "rooms": rooms, "desktop": desktop}


def main():
    if "--test" in sys.argv:
        tree = json.load(open(TREE))
        w = build(tree)
        assert len(w["rooms"]) == 6, f"rooms={len(w['rooms'])}"
        assert len(w["desktop"]["Agents"]) == 4, f"agents={len(w['desktop']['Agents'])}"
        assert len(w["desktop"]["Tasks"]) >= 12, f"tasks={len(w['desktop']['Tasks'])}"
        # determinism: two builds identical
        w2 = build(json.load(open(TREE)))
        assert json.dumps(w, sort_keys=True) == json.dumps(w2, sort_keys=True)
        print(f"✓ {len(w['rooms'])} rooms, {len(w['desktop']['Agents'])} agents, "
              f"{len(w['desktop']['Tasks'])} tasks — deterministic")
        return
    w = build(json.load(open(TREE)))
    json.dump(w, open(OUT, "w"), indent=2)
    print(f"[world] {len(w['rooms'])} rooms, "
          f"{sum(len(v) for v in w['desktop'].values())} desktop items → {OUT}")


if __name__ == "__main__":
    main()
