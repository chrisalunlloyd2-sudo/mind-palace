"""Mind-palace swarm: symbolic pure-code dialogue + quorum voting."""
import json, os, sys, tempfile
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, "/root/Sophia")
import swarm


def test_talk_is_pure_symbolic_roundtrip():
    t = swarm.talk("approve C-207 add tests to error_log")
    assert t["roundtrip_ok"] is True
    assert t["sym"] != "approve C-207 add tests to error_log"  # actually encoded
    assert t["text"] == "approve C-207 add tests to error_log"  # decodes back
    assert t["codec"] == "sophia-rotor"


def test_vote_epsilon_veto_on_high_risk():
    v = swarm.score({"impact": 0.9, "risk": 0.9, "novelty": 0.1}, "EPSILON")
    assert v["veto"] is True and v["vote"] == -1
    v2 = swarm.score({"impact": 0.9, "risk": 0.2, "novelty": 0.1}, "EPSILON")
    assert v2["veto"] is False


def test_quorum_requires_three_yes_and_nash_gate():
    votes = [{"vote": 1, "ban": 3.0}, {"vote": 1, "ban": 2.5}, {"vote": 1, "ban": 2.0},
             {"vote": 0, "ban": 0.5}, {"vote": 1, "ban": 3.2}]
    q = swarm.quorum(votes, "p1")
    assert q["passed"] is True and q["yes"] == 4
    # low bans -> below Nash gate
    low = [{"vote": 1, "ban": 0.1}, {"vote": 1, "ban": 0.2}, {"vote": 1, "ban": 0.15}]
    q2 = swarm.quorum(low, "p2")
    assert q2["passed"] is False  # mean_ban < THETA


def test_quorum_veto_blocks():
    votes = [{"vote": 1, "ban": 3.0}, {"vote": 1, "ban": 3.0}, {"vote": 1, "ban": 3.0},
             {"vote": 1, "ban": 3.0}, {"vote": -1, "ban": 3.0, "veto": True}]
    q = swarm.quorum(votes, "p3")
    assert q["veto"] is True and q["passed"] is False


def test_apply_win_license_add_only():
    with tempfile.TemporaryDirectory() as td:
        os.makedirs(os.path.join(td, "R"))
        res = swarm.apply_win({"repo": "R", "marker": "MISSING", "target": "R/LICENSE"}, td)
        assert res["applied"] is True
        # ADD-only: second attempt refuses
        res2 = swarm.apply_win({"repo": "R", "marker": "MISSING", "target": "R/LICENSE"}, td)
        assert res2["applied"] is False and res2["reason"] == "exists"


def test_apply_win_test_skeleton():
    with tempfile.TemporaryDirectory() as td:
        os.makedirs(os.path.join(td, "R", "pkg"))
        res = swarm.apply_win({"repo": "R", "marker": "UNTESTED",
                               "target": "pkg/mod.py"}, td)
        assert res["applied"] is True
        tp = os.path.join(td, "R", "tests", "test_mod.py")
        assert os.path.exists(tp)
        txt = open(tp).read()
        assert "importlib" in txt and "test_mod_importable" in txt


def test_run_round_symbolic_dialogue():
    with tempfile.TemporaryDirectory() as td:
        seeds = [{"seed_id": "abc1234567", "kind": "fow", "repo": "R",
                  "target": "R/LICENSE", "action": "add LICENSE", "marker": "MISSING"}]
        sp = os.path.join(td, "seeds.jsonl")
        with open(sp, "w") as fh:
            fh.write(json.dumps(seeds[0]) + "\n")
        r = swarm.run_round(sp, os.path.join(td, "dialogue.jsonl"), root=td,
                            dry_run=True)
        assert r["done"] is True and r["symbolic"] is True
        assert r["dialogue_entries"] == 1
