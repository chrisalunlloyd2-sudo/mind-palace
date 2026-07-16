"""Build a navigable graph from SOV memory data for MindPalace."""
import json
import os
import re
from datetime import datetime, timezone
from typing import Dict, List, Any


class MindGraph:
    def __init__(self):
        self.nodes: List[Dict[str, Any]] = []
        self.edges: List[Dict[str, Any]] = []
        self.node_index: Dict[str, int] = {}

    def add_node(self, node_id: str, node_type: str, label: str, payload: Dict[str, Any] = None) -> int:
        if node_id in self.node_index:
            return self.node_index[node_id]
        idx = len(self.nodes)
        self.nodes.append({
            "id": node_id,
            "type": node_type,
            "label": label,
            "payload": payload or {},
        })
        self.node_index[node_id] = idx
        return idx

    def add_edge(self, source: str, target: str, edge_type: str, weight: float = 1.0):
        if source not in self.node_index or target not in self.node_index:
            return
        self.edges.append({
            "source": source,
            "target": target,
            "type": edge_type,
            "weight": weight,
        })

    def to_dict(self) -> Dict[str, Any]:
        return {
            "nodes": self.nodes,
            "edges": self.edges,
            "generated_at": datetime.now(timezone.utc).isoformat(),
        }


def load_sov_kv(path: str = "/root/sov/kv/data.json") -> Dict[str, Any]:
    if not os.path.exists(path):
        return {}
    with open(path) as f:
        return json.load(f)


def load_sov_entities(path: str = "/root/sov/kg/entities.json") -> List[Dict[str, Any]]:
    if not os.path.exists(path):
        return []
    with open(path) as f:
        return json.load(f)


def load_sov_edges(path: str = "/root/sov/kg/edges.jsonl") -> List[Dict[str, Any]]:
    if not os.path.exists(path):
        return []
    edges = []
    with open(path) as f:
        for line in f:
            line = line.strip()
            if line:
                edges.append(json.loads(line))
    return edges


def extract_keywords(text: str) -> List[str]:
    if not isinstance(text, str):
        return []
    stop = {"the", "and", "for", "with", "from", "this", "that", "are", "was", "were", "been", "have", "has", "had",
            "will", "would", "could", "should", "may", "might", "must", "can", "not", "but", "than", "then",
            "they", "them", "their", "there", "these", "those", "you", "your", "our", "its", "his", "her"}
    words = [w.lower() for w in re.findall(r"[a-zA-Z][a-zA-Z0-9_+-]{3,}", text) if w.lower() not in stop]
    return list(dict.fromkeys(words))


def titleize_key(key: str) -> str:
    return key.replace("_", " ").replace(".", " ").strip().title()


def normalize_node_id(raw: str) -> str:
    """Map KG/SOV ids to MindPalace node ids."""
    raw = raw.lower().strip()
    if raw.startswith("kw:"):
        return f"keyword:{raw[3:]}"
    if raw.startswith("entity:"):
        raw = raw[7:]
    # Try to classify by name patterns
    if raw in {"user", "aegis", "moe", "viper", "kernel", "bridge"}:
        return f"agent:{raw}"
    return f"memory:{raw}"


def build_graph_from_sov(kv: Dict[str, Any], entities: List[Dict[str, Any]], edges: List[Dict[str, Any]]) -> MindGraph:
    graph = MindGraph()

    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    portal_id = f"portal:{today}"
    graph.add_node(portal_id, "daily_portal", f"Today — {today}", {"date": today})

    # Keywords
    all_keywords: List[str] = []
    keywords_raw = kv.get("global_keywords", "")
    if isinstance(keywords_raw, str):
        all_keywords = [w.strip() for w in keywords_raw.split(",") if len(w.strip()) > 3]
    elif isinstance(keywords_raw, list):
        all_keywords = keywords_raw

    # Project hubs from KV
    project_keys = [k for k in kv.keys() if k.startswith("project_") or any(p in k for p in [
        "living_ascii", "aegis_agent_bridge", "viper", "kernel", "foundry", "affiliate"
    ])]

    for key in project_keys[:30]:
        project_name = key.replace("project_", "").replace("_", " ").strip()
        if not project_name:
            continue
        node_id = f"project:{project_name}"
        label = titleize_key(project_name)
        graph.add_node(node_id, "project_hub", label, {"source_key": key})
        graph.add_edge(portal_id, node_id, "connects_to")

    # Keyword chambers
    for word in all_keywords[:60]:
        graph.add_node(f"keyword:{word}", "keyword_chamber", word)

    # Memory rooms from KV
    skip_keys = {"global_keywords", "self_email_uids", "dream_round_state", "nightly_insights"}
    for key, value in kv.items():
        if key in skip_keys:
            continue
        node_id = f"memory:{key}"
        label = titleize_key(key)
        payload = {"key": key}
        text_value = ""
        if isinstance(value, str):
            text_value = value[:2000]
            payload["preview"] = value[:200]
        elif isinstance(value, (dict, list)):
            text_value = json.dumps(value)[:2000]
            payload["preview"] = json.dumps(value)[:200]
        graph.add_node(node_id, "memory_room", label, payload)

        for pk in project_keys:
            pk_name = pk.replace("project_", "").replace("_", " ").strip()
            if pk_name and pk_name.lower() in key.lower():
                graph.add_edge(f"project:{pk_name}", node_id, "contains", weight=1.5)

        for word in all_keywords[:20]:
            if word.lower() in text_value.lower():
                graph.add_edge(node_id, f"keyword:{word}", "mentions", weight=0.7)

    # KG entities
    for entity in entities:
        eid = entity.get("id", "")
        labels = entity.get("labels", [])
        props = entity.get("props", {})
        label = props.get("name", eid)
        etype = "memory_room"
        if "Person" in labels:
            etype = "agent_node"
        elif "Keyword" in labels:
            etype = "keyword_chamber"
            label = eid.replace("kw:", "")
        elif "Project" in labels or "System" in labels or "Service" in labels or "Tool" in labels:
            etype = "project_hub"
        node_id = normalize_node_id(eid)
        # Don't overwrite keyword chambers with wrong type
        if node_id in graph.node_index:
            existing = graph.nodes[graph.node_index[node_id]]
            if existing["type"] == "keyword_chamber" and etype != "keyword_chamber":
                etype = "keyword_chamber"
        graph.add_node(node_id, etype, label, {"kg": entity})

    # KG edges
    for edge in edges:
        src_id = normalize_node_id(edge.get("src", ""))
        dst_id = normalize_node_id(edge.get("dst", ""))
        graph.add_edge(src_id, dst_id, edge.get("rel", "relates"), weight=edge.get("props", {}).get("weight", 1.0))

    # Link today's portal to most recently updated entity or memory
    recent_memories = sorted(kv.items(), key=lambda x: len(str(x[1])), reverse=True)[:5]
    for key, _ in recent_memories:
        graph.add_edge(portal_id, f"memory:{key}", "recent_memory", weight=1.2)

    return graph


def main():
    kv = load_sov_kv()
    entities = load_sov_entities()
    edges = load_sov_edges()
    graph = build_graph_from_sov(kv, entities, edges)
    out = graph.to_dict()
    out_path = "web/graph.json"
    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    with open(out_path, "w") as f:
        json.dump(out, f, indent=2)
    print(f"wrote {out_path}: {len(out['nodes'])} nodes, {len(out['edges'])} edges")


if __name__ == "__main__":
    main()
