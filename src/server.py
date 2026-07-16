"""FastAPI server for MindPalace graph and UI assets."""
import json
import os
from pathlib import Path
from fastapi import FastAPI
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles

from graph_builder import build_graph_from_sov, load_sov_kv, load_sov_entities, load_sov_edges

app = FastAPI(title="MindPalace")

WEB_DIR = Path(__file__).parent.parent / "web"


@app.get("/")
def root():
    return FileResponse(WEB_DIR / "index.html")


@app.get("/graph.json")
def graph():
    kv = load_sov_kv()
    entities = load_sov_entities()
    edges = load_sov_edges()
    g = build_graph_from_sov(kv, entities, edges)
    return JSONResponse(content=g.to_dict())


app.mount("/", StaticFiles(directory=WEB_DIR), name="static")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8080)
