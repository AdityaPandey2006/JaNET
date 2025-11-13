# visualizer.py
"""
Interactive static visualizer + optional path PNG export.

Usage:
  python visualizer.py                # writes graph.png, graph_nodes.json, graph_edges.json, graph_static.html
  python visualizer.py <start> <target>  # additionally saves graph_path.png with highlighted path

Requirements:
  pip install requests networkx matplotlib
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

def fetch_shortest_path(start_id, target_id):
    url = f"{BASE_URL}/api/users/{start_id}/shortestpath"
    r = requests.get(url, params={"target": target_id}, timeout=10)
    if r.status_code == 200:
        payload = r.json()
        return payload.get("path") or []
    else:
        return None

def build_graph_from_embedded_friends(users):
    G = nx.Graph()
    for u in users:
        uid = str(u.get('_id') or u.get('id') or u.get('username') or u.get('email') or "")
        if not uid:
            continue
        label = u.get('name') or u.get('username') or uid
        G.add_node(uid, label=label, meta=u)

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
            if fid not in G:
                G.add_node(fid, label=fid, meta={})
            if not G.has_edge(uid, fid):
                G.add_edge(uid, fid)
    return G

def save_png(G, fname="graph.png", highlight_path=None):
    pos = nx.spring_layout(G, seed=42)
    labels = {n: G.nodes[n].get('label', str(n)) for n in G.nodes()}
    plt.figure(figsize=(12, 9))
    nx.draw_networkx_nodes(G, pos, node_size=300, node_color="#4c72b0")
    nx.draw_networkx_edges(G, pos, alpha=0.6)
    nx.draw_networkx_labels(G, pos, labels, font_size=8)

    if highlight_path and len(highlight_path) >= 2:
        path_nodes = list(dict.fromkeys(highlight_path))
        nx.draw_networkx_nodes(G, pos, nodelist=path_nodes, node_size=350, node_color="#ff7f0e")
        path_edges = []
        for a, b in zip(highlight_path[:-1], highlight_path[1:]):
            if G.has_edge(a, b) or G.has_edge(b, a):
                path_edges.append((a, b))
        if path_edges:
            nx.draw_networkx_edges(G, pos, edgelist=path_edges, width=3.0, edge_color="#d62728")

    plt.axis('off')
    plt.tight_layout()
    plt.savefig(fname, dpi=150)
    plt.close()
    print("Saved", fname)

def write_json_dumps(G, nodes_file="graph_nodes.json", edges_file="graph_edges.json"):
    nodes = []
    for n in G.nodes():
        nodes.append({"id": n, "label": G.nodes[n].get("label"), "meta": G.nodes[n].get("meta", {})})
    edges = [{"from": a, "to": b} for a,b in G.edges()]
    Path(nodes_file).write_text(json.dumps(nodes, indent=2), encoding="utf-8")
    Path(edges_file).write_text(json.dumps(edges, indent=2), encoding="utf-8")
    print("Wrote", nodes_file, "and", edges_file)

def write_static_html(G, out="graph_static.html", title="Interactive Graph"):
    nodes = [{"id": n, "label": G.nodes[n].get("label"), "meta": G.nodes[n].get("meta", {})} for n in G.nodes()]
    edges = [{"from": a, "to": b} for a,b in G.edges()]

    nodes_js = json.dumps(nodes, separators=(",", ":"))
    edges_js = json.dumps(edges, separators=(",", ":"))
    api_base_js = json.dumps(BASE_URL)

    html = f"""<!doctype html>
<html>
<head>
  <meta charset="utf-8"><title>{title}</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link href="https://unpkg.com/vis-network@9.1.2/dist/vis-network.min.css" rel="stylesheet" />
  <style>
    html,body{{height:100%;margin:0;font-family:Arial}}
    #network{{width:100%;height:80vh;border:1px solid #ddd}}
    #controls{{padding:8px;background:#f6f6f6;border-bottom:1px solid #ddd}}
    #legend{{position:fixed;right:12px;bottom:12px;background:#fff;padding:8px;border:1px solid #ddd;border-radius:6px;font-size:13px}}
  </style>
</head>
<body>
  <div id="controls">
    <strong>{title}</strong>
    &nbsp; &nbsp; Nodes: {len(nodes)}, Edges: {len(edges)}
    &nbsp; &nbsp; Start ID: <select id="start" style="width:300px"></select>
    &nbsp; Target ID: <select id="target" style="width:300px"></select>
    &nbsp; <button id="find">Find shortest path</button>
    &nbsp; &nbsp; <button id="reset">Reset</button>
    <span id="status" style="margin-left:12px;color:#333"></span>
  </div>
  <div id="network"></div>
  <div id="legend">
    <div style="display:flex;align-items:center;"><div style="width:12px;height:12px;background:#4c72b0;border-radius:50%;margin-right:8px"></div>Normal</div>
    <div style="display:flex;align-items:center;margin-top:6px"><div style="width:12px;height:12px;background:#ff7f0e;border-radius:50%;margin-right:8px"></div>Path node</div>
    <div style="display:flex;align-items:center;margin-top:6px"><div style="width:20px;height:4px;background:#d62728;margin-right:8px"></div>Path edge</div>
  </div>

  <script src="https://unpkg.com/vis-network@9.1.2/dist/vis-network.min.js"></script>
  <script>
    const API_BASE = {api_base_js};
    const nodes = new vis.DataSet({nodes_js});
    const edges = new vis.DataSet({edges_js});

    // explicit default color so we can reliably restore it later
    const DEFAULT_NODE_COLOR = {{ background: '#4c72b0', border: '#2c5d9e' }};
    nodes.update(nodes.get().map(n => ({{ id: n.id, color: DEFAULT_NODE_COLOR }})));

    const container = document.getElementById('network');
    const data = {{ nodes, edges }};
    const options = {{ nodes:{{shape:'dot',size:16}}, edges:{{smooth:true, color:'#999'}}, physics:{{stabilization:true}} }};
    const network = new vis.Network(container, data, options);

    (function ensureEdgeIds() {{
      const allE = edges.get();
      const updates = allE.map(e => ({{ id: e.id || (e.from + '|' + e.to), from: e.from, to: e.to }}));
      edges.update(updates);
    }})();

    let lastPath = null;
    let tempEdgeIds = [];

    function resetStyles() {{
      if (typeof network !== 'undefined' && network && typeof network.unselectAll === 'function') {{
        try {{ network.unselectAll(); }} catch (e) {{ }}
      }}

      for (const teid of tempEdgeIds) {{
        try {{ edges.remove(teid); }} catch (e) {{ }}
      }}
      tempEdgeIds = [];

      const allNodes = nodes.get();
      const nodeUpdates = allNodes.map(n => ({{ id: n.id, color: DEFAULT_NODE_COLOR }}));
      nodes.update(nodeUpdates);

      const allEdges = edges.get();
      const edgeUpdates = allEdges.map(e => ({{ id: e.id, color: {{ color: '#999' }}, width: 1 }}));
      edges.update(edgeUpdates);

      document.getElementById('status').innerText = '';
      lastPath = null;
    }}

    function highlightPath(path) {{
      resetStyles();
      if (!path || path.length === 0) {{
        document.getElementById('status').innerText = 'No path';
        return;
      }}
      lastPath = path.slice();

      // color only the path nodes
      const nodeUpdates = path.map(id => ({{ id: id, color: {{ background: '#ff7f0e', border: '#b35506' }} }}));
      nodes.update(nodeUpdates);

      // color only edges that connect consecutive path nodes
      for (let i = 0; i < path.length - 1; i++) {{
        const a = path[i], b = path[i+1];
        const allE = edges.get();
        const match = allE.find(e => (e.from === a && e.to === b) || (e.from === b && e.to === a));
        if (match) {{
          edges.update({{ id: match.id, color: {{ color: '#d62728' }}, width: 3 }});
        }} else {{
          const newid = 'p|' + a + '|' + b;
          if (!edges.get(newid)) {{
            edges.add({{ id: newid, from: a, to: b, color: {{ color: '#d62728' }}, width: 3 }});
            tempEdgeIds.push(newid);
          }} else {{
            edges.update({{ id: newid, color: {{ color: '#d62728' }}, width: 3 }});
          }}
        }}
      }}

      document.getElementById('status').innerText = 'Path length: ' + (path.length - 1) + ' hops';
      try {{ network.fit({{ nodes: path, animation: true }}); }} catch (e) {{ }}
    }}

    function populateNodeSelects() {{
      const all = nodes.get().slice().sort((a,b) => (a.label||a.id).localeCompare(b.label||b.id));
      const startSel = document.getElementById('start');
      const targetSel = document.getElementById('target');
      startSel.innerHTML = '';
      targetSel.innerHTML = '';
      const emptyOpt = document.createElement('option');
      emptyOpt.value = '';
      emptyOpt.text = '-- pick node --';
      startSel.appendChild(emptyOpt.cloneNode(true));
      targetSel.appendChild(emptyOpt.cloneNode(true));
      for (const n of all) {{
        const label = (n.label ? (n.label + ' — ') : '') + n.id;
        const o1 = document.createElement('option');
        o1.value = n.id;
        o1.text = label;
        const o2 = o1.cloneNode(true);
        startSel.appendChild(o1);
        targetSel.appendChild(o2);
      }}
    }}

    populateNodeSelects();

    document.getElementById('find').addEventListener('click', async () => {{
      const start = document.getElementById('start').value;
      const target = document.getElementById('target').value;
      if (!start || !target) {{
        alert('please choose both start and target nodes from the dropdowns');
        return;
      }}
      resetStyles();
      document.getElementById('status').innerText = 'Searching...';
      try {{
        const url = API_BASE + '/api/users/' + encodeURIComponent(start) + '/shortestpath?target=' + encodeURIComponent(target);
        const resp = await fetch(url);
        const txt = await resp.text();
        let j = null;
        try {{ j = JSON.parse(txt); }} catch(e) {{ j = null; }}
        console.log('shortestpath response', resp.status, j || txt);
        if (!resp.ok) {{
          document.getElementById('status').innerText = 'Server returned ' + resp.status;
          alert('Server returned: ' + txt);
          return;
        }}
        const path = (j && j.path) ? j.path : [];
        highlightPath(path);
      }} catch (err) {{
        document.getElementById('status').innerText = 'Request failed';
        alert('Request failed: ' + err.message);
        console.error('fetch shortestpath error', err);
      }}
    }});

    document.getElementById('reset').addEventListener('click', resetStyles);

    network.on('click', params => {{
      // clicking empty space clears the highlight
      if (params.nodes.length === 0 && lastPath) {{
        resetStyles();
      }}
      if (params.nodes.length) {{
        const n = nodes.get(params.nodes[0]);
        const meta = n.meta || {{}};
        const label = n.label || n.id;
        alert("Node: " + n.id + "\\nLabel: " + label + "\\nMeta:\\n" + JSON.stringify(meta, null, 2));
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
    print("Wrote graph_static.html (open it in a browser).")

    if len(sys.argv) >= 3:
        start = sys.argv[1]
        target = sys.argv[2]
        print("Fetching shortest path from", start, "to", target)
        path = fetch_shortest_path(start, target)
        if path is None:
            print("Server returned error for shortestpath request")
        elif not path:
            print("No path found between given nodes")
        else:
            print("Path found (length):", len(path) - 1)
            save_png(G, "graph_path.png", highlight_path=path)
            print("Saved graph_path.png with highlighted path")

if __name__ == "__main__":
    main()