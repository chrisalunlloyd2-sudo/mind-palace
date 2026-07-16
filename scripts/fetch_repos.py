"""Fetch GitHub repos for the palace."""
import json
import os
import urllib.request
from datetime import datetime, timezone


def fetch_repos(owner, token, per_page=100):
    url = f"https://api.github.com/users/{owner}/repos?per_page={per_page}"
    req = urllib.request.Request(
        url,
        headers={
            "Authorization": f"token {token}",
            "Accept": "application/vnd.github+json",
            "User-Agent": "mind-palace",
        },
    )
    with urllib.request.urlopen(req, timeout=60) as resp:
        return json.loads(resp.read().decode("utf-8"))


def main():
    owner = "chrisalunlloyd2-sudo"
    token = os.environ.get("GITHUB_TOKEN")
    if not token:
        raise RuntimeError("GITHUB_TOKEN required")
    repos = fetch_repos(owner, token)
    data = {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "owner": owner,
        "repos": [
            {
                "name": r["name"],
                "description": r.get("description") or "",
                "url": r["html_url"],
                "language": r.get("language") or "unknown",
                "stars": r.get("stargazers_count", 0),
                "updated": r.get("updated_at", "")[:10],
                "created": r.get("created_at", "")[:10],
                "private": r.get("private", False),
            }
            for r in repos
        ],
    }
    out = "viewer/data/palace.json"
    os.makedirs(os.path.dirname(out), exist_ok=True)
    with open(out, "w") as f:
        json.dump(data, f, indent=2)
    print(f"wrote {out}: {len(data['repos'])} repos")


if __name__ == "__main__":
    main()
