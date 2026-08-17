"""MIND-PALACE AGENT SWARM — voting + work, talking in SYMBOLIC code.

Chris directive 2026-08-16: mind-palace agents vote, do work, and TALK IN
PURE CODE — messages are Sophia rotor-symbolic encodings, never prose.

Castes (from the night-cycle doctrine), each seated in a palace wing:
  GAMMA   (East Wing — AI/ML Foundry):   proposes work from the FOW frontier
  ALPHA   (North Wing — Experiments):    scores impact (what moves the needle)
  EPSILON (South Wing — Tests/Archive): scores RISK, holds the VETO
  BETA    (West Wing — Core Systems):    scores feasibility (deterministic apply?)
  CORTEX  (Main Atrium):                 aggregates, writes the dialogue log

Voting: each caste scores a proposal in decibans (10*log10(1+score)). A winner
needs quorum (>=3 votes) + mean ban >= Nash theta* = log10(C_miss/C_false) +
no Epsilon veto. Deterministic tie-break: highest mean ban, then smallest id.

Communication: every dialogue entry carries `sym` = Sophia.encode(message) and
`text` = Sophia.decode(sym) — the SAME string by self-inverse construction.
No prose anywhere else. Pure code, the palace way.
"""
from __future__ import annotations
import hashlib, json, math, os, re, sys, time
from typing import Dict, List, Optional, Tuple

sys.path.insert(0, "/root/Sophia")  # sandbox sibling repo
try:
    from sophia.symbol import Sophia
except ImportError:
    Sophia = None  # swarm degrades to plain hashes if the codec is absent

# ---- castes, seated in the palace -------------------------------------------
CASTES = {
    "GAMMA":   {"wing": "east",   "room": "AI/ML Foundry",   "w": {"impact": 0.55, "novelty": 0.35, "risk": 0.10}},
    "ALPHA":   {"wing": "north",  "room": "Experiments",     "w": {"impact": 0.70, "novelty": 0.10, "risk": 0.20}},
    "EPSILON": {"wing": "south",  "room": "Tests/Archive",   "w": {"impact": 0.20, "novelty": 0.05, "risk": 0.75}},
    "BETA":    {"wing": "west",   "room": "Core Systems",    "w": {"impact": 0.40, "novelty": 0.10, "risk": 0.50}},
    "CORTEX":  {"wing": "atrium", "room": "Main Atrium",     "w": {"impact": 0.50, "novelty": 0.20, "risk": 0.30}},
}
QUORUM = 3
C_MISS, C_FALSE = 2.0, 1.0
THETA = math.log10(C_MISS / C_FALSE)  # Nash gate (bans)
BAN = lambda s: 10 * math.log10(1 + s) if s > 0 else 0.0


def _sym() -> Optional[object]:
    return Sophia() if Sophia is not None else None


def talk(message: str) -> Dict[str, str]:
    """Pure-code message: the rotor-symbolic encoding + its self-inverse echo."""
    m = _sym()
    if m is None:
        return {"sym": "", "text": "", "codec": "absent"}
    sym = m.encode(message)
    back = m.decode(sym)
    return {"sym": sym, "text": back, "codec": "sophia-rotor",
            "roundtrip_ok": back == message}


# ---- scoring ----------------------------------------------------------------
def score(proposal: Dict, caste: str) -> Dict:
    """Deterministic per-caste score -> decibans + structured vote."""
    w = CASTES[caste]["w"]
    impact = proposal.get("impact", 0.5)
    risk = proposal.get("risk", 0.3)
    novelty = proposal.get("novelty", 0.3)
    raw = w["impact"] * impact + w["novelty"] * novelty + w["risk"] * (1 - risk)
    ban = BAN(raw)
    veto = caste == "EPSILON" and risk > 0.8
    vote = -1 if veto else (1 if ban >= THETA else 0)
    return {"caste": caste, "ban": round(ban, 3), "vote": vote, "veto": veto,
            "raw": round(raw, 3)}


def proposal_features(seed: Dict) -> Dict:
    """Map a FOW seed to {impact, risk, novelty} deterministically."""
    marker = seed.get("marker", "")
    kind = seed.get("kind", "fow")
    target = seed.get("target", "")
    impact = 0.8 if marker == "MISSING" else (0.7 if marker == "UNTESTED" else 0.5)
    if marker == "TODO":
        impact = 0.6
    risk = 0.1 if marker == "MISSING" else (0.3 if marker == "UNTESTED" else 0.5)
    novelty = 0.6 if kind == "repo" else (0.4 if marker == "UNTESTED" else 0.2)
    return {"impact": impact, "risk": risk, "novelty": novelty,
            "title": f"{marker}: {target}"}


def quorum(votes: List[Dict], proposal_id: str) -> Dict:
    """Quorum + Nash gate + veto check. Deterministic tie-break."""
    non_zero = [v for v in votes if v["vote"] != 0]
    n_yes = sum(1 for v in votes if v["vote"] == 1)
    veto = any(v.get("veto", False) for v in votes)
    mean_ban = sum(v["ban"] for v in votes) / len(votes) if votes else 0.0
    passed = (len(non_zero) >= QUORUM and n_yes >= QUORUM
              and mean_ban >= THETA and not veto)
    return {"proposal_id": proposal_id, "passed": passed, "yes": n_yes,
            "votes_cast": len(non_zero), "mean_ban": round(mean_ban, 3),
            "veto": veto, "threshold": round(THETA, 3)}


# ---- safe winners: deterministic work the swarm can actually DO -------------
MIT = """MIT License

Copyright (c) 2026 Chris Lloyd

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE."""


def apply_win(seed: Dict, root: str = "/root") -> Dict:
    """Apply a voted-safe seed: LICENSE / README / pyproject / test skeleton.
    ADD-only: never overwrites existing files. Returns what happened."""
    repo, target = seed.get("repo", ""), seed.get("target", "")
    base = os.path.join(root, repo)
    if not os.path.isdir(base):
        return {"applied": False, "reason": "repo missing", "target": target}
    marker = seed.get("marker", "")
    if marker == "MISSING" and target.endswith("LICENSE"):
        p = os.path.join(base, "LICENSE")
        if os.path.exists(p):
            return {"applied": False, "reason": "exists", "target": target}
        with open(p, "w") as fh:
            fh.write(MIT)
        return {"applied": True, "what": "LICENSE", "repo": repo, "file": "LICENSE"}
    if marker == "MISSING" and target.endswith("README.md"):
        p = os.path.join(base, "README.md")
        if os.path.exists(p):
            return {"applied": False, "reason": "exists", "target": target}
        with open(p, "w") as fh:
            fh.write(f"# {repo}\n\nFleet repo maintained by the Kernel economy.\n")
        return {"applied": True, "what": "README", "repo": repo, "file": "README.md"}
    if marker == "MISSING" and target.endswith("pyproject.toml"):
        p = os.path.join(base, "pyproject.toml")
        if os.path.exists(p):
            return {"applied": False, "reason": "exists", "target": target}
        with open(p, "w") as fh:
            fh.write(f"[build-system]\nrequires = [\"setuptools\"]\nbuild-backend = \"setuptools.build_meta\"\n\n[project]\nname = \"{repo.lower().replace('-', '_')}\"\nversion = \"0.1.0\"\n")
        return {"applied": True, "what": "pyproject", "repo": repo, "file": "pyproject.toml"}
    if marker == "UNTESTED":
        rel = os.path.normpath(target)  # e.g. "pkg/mod.py" or "AEGIS_INDEXER.py"
        stem = os.path.splitext(os.path.basename(rel))[0]
        test_p = os.path.join(base, "tests", f"test_{stem}.py")
        if os.path.exists(test_p):
            return {"applied": False, "reason": "exists", "target": target}
        # covered by ANY existing test? (same check the scanner uses)
        tdir = os.path.join(base, "tests")
        if os.path.isdir(tdir):
            for t in os.listdir(tdir):
                if t.startswith("test_") and t.endswith(".py"):
                    txt = open(os.path.join(tdir, t), encoding="utf-8",
                               errors="replace").read()
                    if re.search(r"\b" + re.escape(stem) + r"\b", txt):
                        return {"applied": False, "reason": "covered", "target": target}
        os.makedirs(os.path.dirname(test_p), exist_ok=True)
        # import path: repo-root-relative dotted module (root goes on sys.path)
        mod = rel.replace(os.sep, ".").replace(".py", "")
        with open(test_p, "w") as fh:
            fh.write('"""Swarm-seeded smoke test for {mod}."""\n'.format(mod=mod))
            fh.write("import importlib, os, sys\n\n\n")
            fh.write("def test_{stem}_importable():\n".format(stem=stem))
            fh.write("    sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))\n")
            fh.write("    m = importlib.import_module('{mod}')\n".format(mod=mod))
            fh.write("    assert m is not None\n")
        return {"applied": True, "what": "test_skeleton", "repo": repo, "file": test_p}
    return {"applied": False, "reason": f"unsupported marker {marker}", "target": target}


# ---- dialogue + rounds ------------------------------------------------------
def load_seeds(path: str) -> List[Dict]:
    if not os.path.exists(path):
        return []
    out = []
    for ln in open(path, encoding="utf-8", errors="replace"):
        ln = ln.strip()
        if ln:
            try:
                out.append(json.loads(ln))
            except json.JSONDecodeError:
                pass
    return out


def run_round(seeds_path: str, dialogue_path: str, root: str = "/root",
              max_winners: int = 2, dry_run: bool = True) -> Dict:
    """One symbolic voting round over the FOW frontier. Returns the report."""
    seeds = load_seeds(seeds_path)
    if not seeds:
        return {"round": "no seeds", "proposals": 0, "winners": [], "done": True}
    winners, applied = [], []
    dialogue = []
    for seed in seeds[:8]:
        feat = proposal_features(seed)
        votes = [score(feat, c) for c in CASTES]
        q = quorum(votes, seed.get("seed_id", "?"))
        # dialogue is PURE CODE: rotor symbols + structure, no prose
        msg = talk(f"{q['proposal_id']} yes={q['yes']} ban={q['mean_ban']}")
        entry = {"ts": int(time.time()), "proposal": q["proposal_id"],
                 "votes": votes, "quorum": q, **msg}
        dialogue.append(entry)
        if q["passed"]:
            winners.append({"seed": seed, "quorum": q})
    # apply winners (safe, ADD-only) — keep going until max_winners SUCCEED
    applied_count = 0
    for w in winners:
        if applied_count >= max_winners:
            break
        res = apply_win(w["seed"], root)
        if res["applied"]:
            if not dry_run:
                applied.append(res)
            applied_count += 1
    if not dry_run and dialogue:
        with open(dialogue_path, "a", encoding="utf-8") as fh:
            for d in dialogue:
                fh.write(json.dumps(d) + "\n")
    return {"round": "symbolic", "proposals": len(seeds[:8]), "passed": len(winners),
            "applied": applied if not dry_run else [a for a in applied],
            "dialogue_entries": len(dialogue),
            "symbolic": all(d.get("roundtrip_ok", False) for d in dialogue),
            "done": True}
