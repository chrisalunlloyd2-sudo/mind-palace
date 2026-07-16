"""Generate palace.json room graph from fetched repos."""
import json
import os
from datetime import datetime, timezone


def main():
    with open("viewer/data/palace.json") as f:
        data = json.load(f)

    rooms = []
    edges = []

    # Central atrium
    rooms.append({
        "id": "atrium:main",
        "type": "atrium",
        "label": "Main Atrium",
        "payload": {"description": "Entrance hall. GitHub Hall to the north. Basement stairs locked."},
    })

    # GitHub Hall hub
    rooms.append({
        "id": "hall:github",
        "type": "hall",
        "label": "GitHub Hall",
        "payload": {"description": f"A long corridor lined with {len(data['repos'])} repository doors."},
    })
    edges.append({"source": "atrium:main", "target": "hall:github", "type": "north", "weight": 1})

    # Basement (locked)
    rooms.append({
        "id": "basement:sov",
        "type": "basement",
        "label": "SOV Basement",
        "payload": {"description": "Real databases, KG, KV, logit, and per-machine graphs. Locked until authenticated.", "locked": True},
    })
    edges.append({"source": "atrium:main", "target": "basement:sov", "type": "down", "weight": 1})

    # Repo rooms along the hall
    for i, repo in enumerate(data["repos"]):
        rid = f"repo:{repo['name']}"
        rooms.append({
            "id": rid,
            "type": "repo_room",
            "label": repo["name"],
            "payload": repo,
        })
        edges.append({"source": "hall:github", "target": rid, "type": "door", "weight": 1})

    palace = {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "nodes": rooms,
        "edges": edges,
        "spawn": "atrium:main",
    }
    out = "viewer/data/palace.json"
    with open(out, "w") as f:
        json.dump(palace, f, indent=2)
    print(f"wrote {out}: {len(rooms)} rooms, {len(edges)} edges")


if __name__ == "__main__":
    main()
