# visualize_static.py
"""
Simple static visualizer:
 - Fetches all users once from /api/users
 - Uses the friends array inside each user (if present) to build edges
 - Saves graph.png, graph_nodes.json, graph_edges.json
 - Writes a self-contained static HTML (graph_static.html) that embeds nodes+edges
"""
import json
from pathlib import Path
import requests
import networkx as nx
import matplotlib.pyplot as plt
import sys

BASE_URL = "http://localhost:5000"
USERS_ENDPOINT = f"{BASE_URL}/api/users"

def fetch_users():
    r = requests.get(USERS_ENDPOINT, timeout=10)
    r.raise_for_status()
    return r.json()

def build_graph_from_embedded_friends(users):
    G = nx.Graph()
    # add nodes
    for u in users:
        uid = str(u.get('_id') or u.get('id') or u.get('username') or u.get('email') or "")
        if not uid:
            continue
        label = u.get('name') or u.get('username') or uid
        G.add_node(uid, label=label, meta=u)

    # add edges from embedded friends arrays (if any)
    for u in users:
        uid = str(u.get('_id') or u.get('id') or u.get('username') or u.get('email') or "")
        if not uid: 
            continue
        friends = u.get('friends') or []
        if not isinstance(friends, list):
            continue
        for f in friends:
            if isinstance(f, dict):
                fid = f.get('userId') or f.get('_id') or f.get('id') or f.get('friendId')
            else:
                fid = f
            if fid is None:
                continue
            fid = str(fid)
            if fid == uid:
                continue
            # ensure node exists
            if fid not in G:
                G.add_node(fid, label=fid, meta={})
            G.add_edge(uid, fid)
    return G

def save_png(G, fname="graph.png"):
    pos = nx.spring_layout(G, seed=42)
    labels = {n: G.nodes[n].get('label', str(n)) for n in G.nodes()}
    plt.figure(figsize=(10,8))
    nx.draw_networkx_nodes(G, pos, node_size=300)
    nx.draw_networkx_edges(G, pos, alpha=0.6)
    nx.draw_networkx_labels(G, pos, labels, font_size=8)
    plt.axis('off')
    plt.tight_layout()
    plt.savefig(fname, dpi=150)
    print("Saved", fname)

def write_json_dumps(G):
    nodes = []
    for n in G.nodes():
        nodes.append({"id": n, "label": G.nodes[n].get("label"), "meta": G.nodes[n].get("meta", {})})
    edges = [{"from": a, "to": b} for a,b in G.edges()]
    Path("graph_nodes.json").write_text(json.dumps(nodes, indent=2), encoding="utf-8")
    Path("graph_edges.json").write_text(json.dumps(edges, indent=2), encoding="utf-8")
    print("Wrote graph_nodes.json and graph_edges.json")

def write_static_html(G, out="graph_static.html", title="Static Graph"):
    # embed nodes/edges directly into HTML so file is standalone
    nodes = [{"id": n, "label": G.nodes[n].get("label"), "meta": G.nodes[n].get("meta", {})} for n in G.nodes()]
    edges = [{"from": a, "to": b} for a,b in G.edges()]

    nodes_js = json.dumps(nodes, separators=(",", ":"))
    edges_js = json.dumps(edges, separators=(",", ":"))

    html = f"""<!doctype html>
<html>
<head>
  <meta charset="utf-8"><title>{title}</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link href="https://unpkg.com/vis-network@9.1.2/dist/vis-network.min.css" rel="stylesheet" />
  <style>html,body{{height:100%;margin:0;font-family:Arial}}#network{{width:100%;height:95vh;border:1px solid #ddd}}</style>
</head>
<body>
  <div style="padding:8px;background:#f6f6f6;border-bottom:1px solid #ddd;">
    <strong>{title}</strong> — Nodes: {len(nodes)}, Edges: {len(edges)}
  </div>
  <div id="network"></div>
  <script src="https://unpkg.com/vis-network@9.1.2/dist/vis-network.min.js"></script>
  <script>
    const nodes = new vis.DataSet({nodes_js});
    const edges = new vis.DataSet({edges_js});
    const container = document.getElementById('network');
    const data = {{ nodes, edges }};
    const options = {{ nodes:{{shape:'dot',size:16}}, edges:{{smooth:true}}, physics:{{stabilization:true}} }};
    const network = new vis.Network(container, data, options);
    network.on('click', params => {{
      if (params.nodes.length) {{
        const n = nodes.get(params.nodes[0]);
        alert("Node: "+n.id+"\\nLabel: "+n.label);
      }}
    }});
  </script>
</body>
</html>"""
    Path(out).write_text(html, encoding="utf-8")
    print("Wrote", out)

def main():
    try:
        users = fetch_users()
    except Exception as e:
        print("Failed to fetch users:", e)
        sys.exit(1)

    print("Fetched", len(users), "users")
    G = build_graph_from_embedded_friends(users)
    print("Graph nodes, edges:", G.number_of_nodes(), G.number_of_edges())

    save_png(G, "graph.png")
    write_json_dumps(G)
    write_static_html(G, "graph_static.html")
    print("Done. Open graph_static.html in a browser.")

if __name__ == "__main__":
    main()