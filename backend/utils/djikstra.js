
class PriorityQueue {
  constructor() {
    this.values = [];
  }

  push(pair) {
    this.values.push(pair);
    this.values.sort((a, b) => a[0] - b[0]); // Sort by distance(weights)
  }

  pop() {
    return this.values.shift();
  }

  isEmpty() {
    return this.values.length === 0;
  }
}

function dijkstra(adj, src) {
  const vec = new Array(adj.length).fill(Infinity); //to maintain distances array
  const pq = new PriorityQueue();  //priority queue to move directly to the next smallest distance node 

  pq.push([0, src]);
  vec[src] = 0;     //push the source node from where thr distance to the other nodes min distance (weights)is defines

  while (!pq.isEmpty()) {
    const [d, node] = pq.pop();

    if (d > vec[node]) continue;

    for (const [w, v] of adj[node]) {
      if (d + w < vec[v]) {            //relaxation d[u]+c(u,v)<d[v]-->d[v]=d[u]+c(u,v);
        vec[v] = d + w;
        pq.push([vec[v], v]);
      }
    }
  }

  return vec;
}

export default dijkstra;
//time complexity(O((V+E)Log(V)).......