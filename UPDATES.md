# API Endpoint Updates

## 2026-08-26

- Fixed `GET /api/community/communities`: community DFS now uses the names loaded with the graph instead of reading a Mongoose query as a user object. See [community.js](backend/routes/community.js#L7) and [community.js](backend/routes/community.js#L23).

- Fixed `GET /api/users/:id/friendrecommendations`: friend lookups are awaited and friend-of-friend lookups run with `Promise.all`. See [users.js](backend/routes/users.js#L185) and [users.js](backend/routes/users.js#L206).

- Fixed `GET /api/posts/:id/user`: the query now filters posts by the requested author instead of returning every post. See [posts.js](backend/routes/posts.js#L90).

- Fixed `GET /api/users/search/:username`: the missing-user response now returns immediately, preventing duplicate responses. See [users.js](backend/routes/users.js#L94).

- Fixed `GET /api/vis/msf`: stale friend references are ignored instead of adding index `-1` to the adjacency list. See [visualisers.js](backend/routes/visualisers.js#L76).

- Fixed invalid-ID handling for user, friend-request, post, and shortest-path endpoints so malformed IDs return `400` responses. See [users.js](backend/routes/users.js#L77), [friends.js](backend/routes/friends.js#L18), [friends.js](backend/routes/friends.js#L97), [posts.js](backend/routes/posts.js#L63), [posts.js](backend/routes/posts.js#L88), and [visualisers.js](backend/routes/visualisers.js#L117).

- Fixed `GET /api/posts/:postId/like`: callers can now provide `userId` as a query parameter; the existing body fallback remains supported. See [posts.js](backend/routes/posts.js#L238).

- Fixed `POST /api/users/addmass`: requests missing a required password now return `400` before database validation. See [users.js](backend/routes/users.js#L40).

- Fixed `POST /api/friends/sendmass`: duplicate target IDs are skipped, and newly added requests are tracked during the same request. See [friends.js](backend/routes/friends.js#L107) and [friends.js](backend/routes/friends.js#L130).

- Fixed MSF request state leakage by declaring local friend variables. See [visualisers.js](backend/routes/visualisers.js#L73).

Validation: all modified route files pass `node --check`, and VS Code diagnostics report no errors. Runtime database testing still requires the backend dependencies and MongoDB connection to be available.
