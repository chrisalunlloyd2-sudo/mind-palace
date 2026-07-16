# MindPalace

A first-person, graph-based data explorer for the sovereign memory system.

## Core idea

Every memory is a **room** in a palace. Every relationship is a **hallway**. You walk through your own topology.

- Nodes = memories, entities, projects, keywords, emails, hypotheses
- Edges = relationships, causality, recency, tags
- Hallways = transitions between mental states
- Events = insights, alerts, daily digests, agent votes

## Design method

Built using the **level flow graph / topological layout** method:

1. Define nodes and edges (logical graph)
2. Establish pacing graph (tension/curiosity over distance)
3. Translate to 2D spatial layout (bubble diagram)
4. Implement first-person constraints (sightlines, landmarks, speed)
5. Graybox prototype in 3D
6. Define player state machine

## Implementation plan

- **Frontend:** Three.js (WebGL) for lightweight browser-based first-person walking
- **Backend:** Python FastAPI serving the memory graph as JSON
- **Data source:** SOV KV/KG at `/root/sov/`, plus GitHub repos, emails, dashboard data
- **Language:** Python + JavaScript/TypeScript

## Status

Phase 0: repo skeleton and graph spec.
