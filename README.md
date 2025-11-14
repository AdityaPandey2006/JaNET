# JaNET – Graph-Based Social Network Analysis

JaNET is a social network system that models users and their interactions as a graph.
It provides tools to analyze hidden structure, relationships, and content relevance across the network using standard graph algorithms.

## Features

- Friend recommendation using Jaccard Similarity
- Shortest path between users using Bidirectional BFS
- Personalized post recommendation using a simplified PageRank
- Dynamic friendship strengths based on chat frequency
- Strongest underlying connection network using Minimum Spanning Forest (MSF)
- Visualizers for graph structure and MSF
- Scripts for generating mass users and posts for large-scale testing

## How It Works

### Friend Recommendation
Uses Jaccard Similarity on friends-of-friends to rank potential connections.

### Shortest Path
Bidirectional BFS computes the smallest degree of separation between any two users.

### Post Recommendation
A simplified PageRank scores posts based on relevance to the user’s network and interactions.

### Dynamic Friendship Strength
Edges are weighted based on chat frequency, making the network evolve dynamically over time.

### Minimum Spanning Forest
Builds an MSF over the weighted graph to extract the strongest backbone of the network.

## Project Structure

```
JaNET/
│
├── backend/
│   ├── models/
│   │   ├── User.js
│   │   ├── Post.js
│   │   └── Chat.js
│   ├── routes/
│   │   ├── users.js
│   │   ├── posts.js
│   │   ├── friends.js
│   │   ├── chats.js
│   │   ├── community.js
│   │   └── visualisers.js
│   ├── utils/
│   ├── create_mass_posts.js
│   ├── graph-visualizer.html
│   ├── msf_visualizer.html
│   └── server.js
│
└── client/
```

## Running the Project

### Backend

```
cd backend
npm install
npm start/node server.js
```

Requires a `.env` file with:

```
MONGO_URI=your_connection_string
PORT=5000
```

## Scripts

- create_mass_posts.js — generate random sample posts from provided examples for testing.

## Visualizers

- graph-visualizer.html — network structure visualization, along with Shortest path between any 2 users visualized.
- msf_visualizer.html — minimum spanning forest visualization.