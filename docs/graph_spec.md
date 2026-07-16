# MindPalace Graph Specification

## 1. Logical Graph (Nodes V, Edges E)

### Node types

| Type | Description | Example |
|------|-------------|---------|
| `memory_room` | A stored memory or concept | "Aegis Daily Digest", "Hero Kernel" |
| `project_hub` | A project with many connected memories | "living-ascii-art", "aegis-agent-bridge" |
| `keyword_chamber` | A global keyword extracted by dream engine | "quantum", "kernel", "affiliate" |
| `agent_node` | An autonomous agent or service | "Aegis", "Moe", "Viper" |
| `email_archive` | A self-sent email or inbound mail | UID 80326, GitHub alert |
| `hypothesis_gate` | A testable hypothesis with open/closed status | "Publish viper-kernel walkthrough" |
| `event_spike` | A notable occurrence: alert, milestone, failure | "Payment failed", "Build green" |
| `daily_portal` | Entrance/exit representing today | "Today — 2026-07-16" |

### Edges

| Edge type | Source → Target | Meaning |
|-----------|-----------------|---------|
| `contains` | project_hub → memory_room | Project owns this memory |
| `mentions` | memory_room/email → keyword_chamber | Content contains keyword |
| `relates` | memory_room ↔ memory_room | Semantic or temporal link |
| `votes_on` | agent_node → hypothesis_gate | Agent opinion |
| `caused` | event_spike → memory_room | Event triggered or affected memory |
| `archived_in` | email_archive → memory_room | Email stored as memory |
| `connects_to` | daily_portal → memory_room | Today's starting point |

## 2. Pacing Graph

Emotional intensity mapped over walking distance:

- X-axis: cumulative meters walked from Today Portal
- Y-axis: cognitive load / urgency / curiosity

Key events placed inside hallways:

| Distance | Event | Type |
|----------|-------|------|
| 0m | Spawn at Today Portal | orientation |
| 5m | Flicker: yesterday's unresolved attention items | tension |
| 12m | Landmark: biggest open hypothesis gate | focus |
| 20m | Branch: choose project hub | decision |
| 30m | Sound cue: agent activity behind walls | immersion |
| 45m | Dead end if no action taken; return portal | closure |

## 3. Spatial Layout (Bubble Diagram)

- Hallway width: 2.5m (grand, readable) or 1.8m (claustrophobic mode)
- Ceiling: 3.2m
- Node rooms: 4m × 4m chambers
- Turns: 90° to occlude long sightlines
- Scale: 1 unit = 1 meter
- Walk speed: 1.4 m/s

## 4. First-Person Constraints

- Camera height: 1.7m
- Field of view: 75°
- No jump; smooth capsule collider
- Crouch to enter "deep memory" chambers (optional)
- Landmark at end of every long edge

## 5. Player State Machine

```
[Walking] --doorway--> [InRoom]
[InRoom] --inspect--> [Reading]
[Reading] --back--> [InRoom]
[InRoom] --doorway--> [Walking]
[Walking] --sprint--> [FastWalk]
[FastWalk] --stop--> [Walking]
```

## 6. Data Pipeline

```
SOV KV/KG  --extract-->  Python graph builder  --serve-->  FastAPI  --fetch-->  Three.js scene
```

Graph builder will read:
- `/root/sov/kv/data.json`
- `/root/sov/kg/entities.json`
- bridge state, analytics, traffic
- recent emails (via email account)
