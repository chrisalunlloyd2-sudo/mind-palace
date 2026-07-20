"""Generate palace.json with wing categorization and file/folder data."""
import json
import os
import urllib.request
from datetime import datetime, timezone

GITHUB_TOKEN = os.environ.get("GITHUB_TOKEN", "")

def get_repo_contents(owner, repo, path=""):
    """Fetch files and folders from GitHub API."""
    url = f"https://api.github.com/repos/{owner}/{repo}/contents/{path}"
    headers = {"Authorization": f"Bearer {GITHUB_TOKEN}"} if GITHUB_TOKEN else {}
    try:
        req = urllib.request.Request(url, headers=headers)
        with urllib.request.urlopen(req, timeout=10) as resp:
            items = json.loads(resp.read().decode())
            files = []
            folders = []
            for item in items:
                if item['type'] == 'file' and not item['name'].startswith('.'):
                    files.append(item['name'])
                elif item['type'] == 'dir' and not item['name'].startswith('.'):
                    folders.append(item['name'])
            return files[:50], folders[:20]
    except Exception as e:
        return [], []

def categorize_repo(name):
    """Assign repo to a wing based on name."""
    name_lower = name.lower()
    if 'aegis' in name_lower or 'viper' in name_lower or 'agent' in name_lower or 'bridge' in name_lower:
        return 'Core Systems', 'west'
    elif 'matrix' in name_lower or 'h2o' in name_lower or 'darwin' in name_lower or 'genetic' in name_lower or 'moe' in name_lower:
        return 'AI/ML Foundry', 'east'
    elif 'living' in name_lower or 'mind' in name_lower or 'ascii' in name_lower or 'palace' in name_lower or 'nova' in name_lower:
        return 'Experiments', 'north'
    elif 'test' in name_lower or 'e2e' in name_lower or 'sandbox' in name_lower:
        return 'Tests/Archive', 'south'
    else:
        return 'Active Projects', 'west'

def main():
    # Load existing palace.json to get repo list
    with open("viewer/data/palace.json") as f:
        data = json.load(f)

    rooms = []
    edges = []

    # Central atrium
    rooms.append({
        "id": "atrium:main",
        "type": "atrium",
        "label": "Main Atrium",
        "payload": {"description": "Entrance hall. Four wings branch from here."},
    })

    # Wing hubs
    wings = {
        'west': {'id': 'wing:west', 'label': 'West Wing — Core Systems'},
        'east': {'id': 'wing:east', 'label': 'East Wing — AI/ML Foundry'},
        'north': {'id': 'wing:north', 'label': 'North Wing — Experiments'},
        'south': {'id': 'wing:south', 'label': 'South Wing — Tests/Archive'},
    }
    
    for wing_id, wing_data in wings.items():
        rooms.append({
            "id": wing_data['id'],
            "type": "wing_hub",
            "label": wing_data['label'],
            "payload": {"description": f"Enter {wing_data['label'].split('—')[1].strip()}"},
        })
        edges.append({"source": "atrium:main", "target": wing_data['id'], "type": wing_id, "weight": 1})

    # Repo rooms organized by wing
    wing_counts = {'west': 0, 'east': 0, 'north': 0, 'south': 0}
    
    # Extract repo nodes from existing palace
    repo_nodes = [n for n in data['nodes'] if n['type'] == 'repo_room']
    
    for i, repo in enumerate(repo_nodes):
        category, wing = categorize_repo(repo['label'])
        
        # Fetch files/folders from GitHub
        owner = repo['payload'].get('owner', 'chrisalunlloyd2-sudo')
        repo_name = repo['payload'].get('name', repo['label'])
        files, folders = get_repo_contents(owner, repo_name)
        
        rid = f"repo:{repo['label']}"
        rooms.append({
            "id": rid,
            "type": "repo_room",
            "label": repo["label"],
            "payload": {
                **repo['payload'],
                "category": category,
                "wing": wing,
                "files": files,
                "folders": folders,
            },
        })
        edges.append({"source": wings[wing]['id'], "target": rid, "type": "door", "weight": 1})
        wing_counts[wing] += 1
        
        if (i + 1) % 10 == 0:
            print(f"  Processed {i+1}/{len(repo_nodes)} repos...")

    # Basement (locked)
    rooms.append({
        "id": "basement:sov",
        "type": "basement",
        "label": "SOV Basement",
        "payload": {"description": "Real databases, KG, KV, logit. Locked until authenticated.", "locked": True},
    })
    edges.append({"source": "atrium:main", "target": "basement:sov", "type": "down", "weight": 1})

    palace = {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "nodes": rooms,
        "edges": edges,
        "spawn": "atrium:main",
        "wing_counts": wing_counts,
    }
    
    out = "data/palace.json"
    os.makedirs("data", exist_ok=True)
    with open(out, "w") as f:
        json.dump(palace, f, indent=2)
    
    print(f"wrote {out}: {len(rooms)} rooms, {len(edges)} edges")
    print(f"Wing distribution: {wing_counts}")

if __name__ == "__main__":
    main()
