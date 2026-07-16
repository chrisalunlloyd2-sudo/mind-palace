"""Fetch public repos for the palace from GitHub API."""
import json
import os
import urllib.request
from datetime import datetime, timezone


def fetch_repos(owner: str, token: str, per_page: int = 100) -> list:
    url = f"https://api.github.com/users/{owner}/repos?per_page={per_page}"
    req = urllib.request.Request(
        url,
        headers={
            "Authorization": f"token {token}",
            "Accept": "application/vnd.github+json",
            "User-Agent": "mind-palace",
        },
    )
    with urllib.request.urlopen(req, timeout=30) as resp:
        return json.loads(resp.read().decode("utf-8"))


def main():
    owner = "chrisalunlloyd2-sudo"
    token = os.environ.get("GITHUB_TOKEN")
    if not token:
        raise RuntimeError("GITHUB_TOKEN required")

    repos = fetch_repos(owner, token)
    graph = {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "nodes": [],
        "edges": [],
    }

    graph["nodes"].append({
        "id": "hub:github",
        "type": "zone_hub",
        "label": "GitHub Hall",
        "payload": {"zone": "github", "description": "A long hallway of repositories."},
    })

    for i, repo in enumerate(repos):
        rid = f"repo:{repo['name']}"
        graph["nodes"].append({
            "id": rid,
            "type": "repo_room",
            "label": repo["name"],
            "payload": {
                "description": repo.get("description") or "",
                "url": repo["html_url"],
                "language": repo.get("language") or "unknown",
                "stars": repo.get("stargazers_count", 0),
                "updated": repo.get("updated_at", ""),
                "created": repo.get("created_at", ""),
                "private": repo.get("private", False),
            },
        })
        graph["edges"].append({
            "source": "hub:github",
            "target": rid,
            "type": "contains",
            "weight": 1.0,
        })

    out_path = "web/graph.json"
    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    with open(out_path, "w") as f:
        json.dump(graph, f, indent=2)
    print(f"wrote {out_path}: {len(graph['nodes'])} nodes, {len(graph['edges'])} edges")


if __name__ == "__main__":
    main()
