const express=require('express');
const router=express.Router();
const User=require('../models/User');
const Post=require('../models/Post');
const mongoose=require('mongoose');

router.post('/:id/addPost', async(req,res)=>{
    try{
        const userId = req.params.id;
        const {title,description} = req.body;
        const userObj = await User.findById(userId);
        if (!userObj) {
            return res.status(404).json({ message: "User not found" });
        }

        const newPost = new Post({
            title,
            description,
            likes: 0,
            author: userId,
        });

        const savedPost = await newPost.save();

          //push the post to user's post id
        await User.updateOne(
            { _id: userId },
            { $push: { Posts: { postId: savedPost._id } } }
        );

        res.status(201).json({
            message: "Post added successfully",
            post: savedPost
        });
    }
    catch (err){
        console.error(err);
        res.status(500).json({ message: "Server error while adding post", error: err.message });
    }
});

router.get('/allposts', async (req, res) => {
    try {
        const posts = await Post.find({}, { title: 1, description: 1, _id: 0 });
        res.status(200).json(posts);
    } catch (err) {
        res.status(500).json({ message: "Error fetching posts", error: err.message });
    }
});

//user posts

router.get('/:id/userPosts', async (req, res) => {
  try {
    console.log("Fetching posts for user");
    const userId = req.params.id;
    console.log("User ID:", userId);
    console.log("Post model name:", Post.modelName);
    const count = await Post.countDocuments();
    console.log("Total posts in DB:", count);

    const mongoId = new mongoose.Types.ObjectId(userId);

    const posts = await Post.find({ author: mongoId }, 'title description');

    console.log("Found posts:", posts.length);

    if (!posts || posts.length === 0) {
      return res.status(404).json({ message: "No posts found for this user." });
    }

    console.log("sending response");
    res.status(200).json({ posts });
  } catch (err) {
    console.error("Error fetching posts:", err);
    res.status(500).json({ message: "Server error while fetching posts." });
  }
});


router.get('/:id/user', async (req, res) => {
    try {
        const posts = await Post.find({},'title description');
        res.json(posts);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

function findFriends(userid){
    const userObj = User.findById(userid);

    if(!userObj){
        res.status(500).json({message: "User Does not exist"});
        return;
    }
    
    const friends = userObj.friends.map((friend)=>{
        return friend.userId;
    })

    return friends;
}

//Personalized PageRank algorithm for post recommendation using friends
// Personalized PageRank-based post recommendation
// Usage: GET /api/posts/:id/postrec?top=10
router.get('/:id/postrec', async (req, res) => {
  try {
    const userId = req.params.id;
    const topK = parseInt(req.query.top || "10", 10);
    const damping = 0.85;      // typical PageRank damping factor
    const tol = 1e-6;          // convergence tolerance
    const maxIter = 200;

    // 1) Load users (only fields we need)
    const users = await User.find({}, { _id: 1, friends: 1, Posts: 1, name: 1, username: 1, email: 1 }).lean();

    if (!users || users.length === 0) {
      return res.status(200).json({ message: "No users found", recommendations: [] });
    }

    // build id -> index maps
    const idToIndex = {};
    const indexToId = [];
    users.forEach((u, idx) => {
      const idStr = String(u._id);
      idToIndex[idStr] = idx;
      indexToId[idx] = idStr;
    });
    const n = users.length;

    // 2) Build adjacency lists (outgoing) and in-neighbor lists for fast PR iteration
    const outSum = new Array(n).fill(0);       // sum of outgoing weights for each node
    const inNeighbors = new Array(n).fill(0).map(()=>[]); // inNeighbors[j] = [{i, w}, ...]
    for (let i = 0; i < n; ++i) {
      const u = users[i];
      const frm = String(u._id);
      const frList = Array.isArray(u.friends) ? u.friends : [];
      for (const f of frList) {
        let toId = null;
        let weight = 1;
        if (f && typeof f === 'object') {
          toId = f.userId ? String(f.userId) : (f._id ? String(f._id) : null);
          weight = (typeof f.weight === 'number' && !isNaN(f.weight)) ? f.weight : 1;
        } else {
          toId = String(f);
        }
        if (!toId) continue;
        if (!(toId in idToIndex)) {
          // friend points to a user not in the fetched list (shouldn't happen if all users fetched)
          continue;
        }
        const j = idToIndex[toId];
        outSum[i] += weight;
        inNeighbors[j].push({ i, w: weight });
      }
    }

    // 3) personalization vector e: put all mass on target user (personalized PageRank)
    const e = new Array(n).fill(0);
    if (!(userId in idToIndex)) {
      // if userId not found, fallback to uniform personalization
      for (let i=0;i<n;i++) e[i]=1/n;
    } else {
      e[idToIndex[String(userId)]] = 1.0;
    }

    // 4) Power iteration for personalized PageRank
    // PR_new[j] = (1-damping)*e[j] + damping * (sum over in-neighbors i of PR[i] * w_ij / outSum[i]) + damping * dangling_sum * e[j]
    let PR = new Array(n).fill(1.0 / n);
    let temp = new Array(n).fill(0);
    let converged = false;
    for (let iter=0; iter<maxIter; ++iter) {
      const danglingSum = PR.reduce((acc, val, idx) => acc + ((outSum[idx] === 0) ? val : 0), 0);
      // compute contributions
      for (let j=0;j<n;++j) temp[j] = (1 - damping) * e[j]; // teleport part
      // add in-neighbor contributions
      for (let j=0;j<n;++j) {
        let sum = 0;
        const inn = inNeighbors[j];
        for (const {i, w} of inn) {
          const denom = outSum[i] || 0;
          if (denom > 0) sum += PR[i] * (w / denom);
        }
        temp[j] += damping * sum;
      }
      // add dangling distribution proportionally to personalization vector
      if (danglingSum > 0) {
        for (let j=0;j<n;++j) temp[j] += damping * danglingSum * e[j];
      }
      // normalize (optional: PR sums to 1 if e sums to 1)
      const s = temp.reduce((a,b)=>a+b, 0);
      for (let j=0;j<n;++j) temp[j] = temp[j] / (s || 1);
      // check convergence (L1)
      const diff = PR.reduce((acc, val, idx) => acc + Math.abs(val - temp[idx]), 0);
      PR = temp.slice();
      if (diff < tol) { converged = true; break; }
    }
    // console.log("PR converged:", converged);

    // 5) Map posts -> authors (we rely on User.Posts arrays that you maintain)
    // collect all post ids and track post->author
    const postIdToAuthor = new Map();
    const postIds = [];
    for (let i=0;i<n;++i) {
      const u = users[i];
      if (Array.isArray(u.Posts)) {
        for (const p of u.Posts) {
          // p may be { postId: ObjectId } or raw id
          const pid = (p && p.postId) ? String(p.postId) : String(p);
          postIdToAuthor.set(pid, String(u._id));
          postIds.push(pid);
        }
      }
    }

    // if no posts available, return empty
    if (postIds.length === 0) {
      return res.status(200).json({ message: "No posts available", recommendations: [] });
    }

    // 6) Fetch the Post documents for the postIds (dedupe)
    const uniquePostIds = Array.from(new Set(postIds));
    const posts = await Post.find({ _id: { $in: uniquePostIds } }).lean();

    // find max likes for normalization
    let maxLikes = 0;
    for (const p of posts) {
      if (p.likes && p.likes > maxLikes) maxLikes = p.likes;
    }
    if (maxLikes === 0) maxLikes = 1;

    // 7) Score posts: score = PR(author) * (1 + likes / maxLikes)
    const authorIndexCache = {}; // map authorId -> index -> PR
    const scoreList = [];
    for (const p of posts) {
      const pid = String(p._id);
      const authorId = postIdToAuthor.get(pid);
      if (!authorId) continue;
      let aidx = authorIndexCache[authorId];
      if (aidx === undefined) {
        aidx = idToIndex[authorId];
        authorIndexCache[authorId] = aidx;
      }
      const authorPR = (aidx === undefined) ? 0 : PR[aidx] || 0;
      const likes = (typeof p.likes === 'number') ? p.likes : 0;
      const score = authorPR * (1 + (likes / maxLikes));
      scoreList.push({ post: p, authorId, score });
    }

    // 8) Sort scores descending and return topK
    scoreList.sort((a,b) => b.score - a.score);
    const top = scoreList.slice(0, topK).map(item => {
      // include author brief info
      const author = users[idToIndex[item.authorId]] || {};
      return {
        post: item.post,
        author: { _id: item.authorId, name: author.name, username: author.username, email: author.email },
        score: item.score
      };
    });

    return res.status(200).json({ message: "recommendations", recommendations: top });

  } catch (err) {
    console.error("Error in /:id/postrec", err);
    return res.status(500).json({ message: "Server error while computing recommendations", error: err.message });
  }
});



router.get('/:postId/like', async(req,res) => {
    try{
        const { postId } = req.params;
        const { userId } = req.body;
        
        if (!mongoose.isValidObjectId(postId) || !mongoose.isValidObjectId(userId)) {
            return res.status(400).json({ message: 'Invalid postId or userId' });
        }

        const update = await Post.findOneAndUpdate(
            {_id: postId, likedBy: {$ne: userId}},
            { $addToSet: { likedBy: userId }, $inc: { likes: 1 } },
            { new: true }
        ).lean();

        if(!update){
            const exists = await Post.findById(postId).lean();
            if(!exists) return res.status(404).json({message: 'Post not found'});
            return res.status(200).json({message: 'Already liked', likes: exists.likes});
        }

        return res.status(200).json({ message: 'Liked', likes: update.likes });
    }
    catch(err){
        res.status(500).json({message: err.message});
    }
});

router.get('/:postId/likes', async (req, res) => {
    try {
        const { postId } = req.params;
        const userId = req.query.userId;
        if (!mongoose.isValidObjectId(postId)) return res.status(400).json({ message: 'Invalid postId' });

        const projection = userId && mongoose.isValidObjectId(userId) ? { likes: 1, likedBy: 1 } : { likes: 1 };
        const post = await Post.findById(postId, projection).lean();
        if (!post) return res.status(404).json({ message: 'Post not found' });

        const liked = userId && mongoose.isValidObjectId(userId) && Array.isArray(post.likedBy)
        ? post.likedBy.some(id => String(id) === String(userId)) : undefined;

        // If we fetched likedBy just to check user-specific like, don't return whole array
        return res.status(200).json({ likes: post.likes, liked });
    } catch (err) {
        console.error("Error getting likes:", err);
        return res.status(500).json({ message: 'Server error', error: err.message });
    }
});

router.delete('/deleteallposts', async (req, res) => {
  try {
    // safety: require explicit confirmation query param
    if (req.query.confirm !== 'true') {
      return res.status(400).json({
        message: "This route will permanently delete ALL posts. To proceed add ?confirm=true to the URL."
      });
    }

    // Delete all Post documents
    const deleteResult = await Post.deleteMany({});
    // Clear the Posts array in all User documents
    // This sets Posts to an empty array for every user that has Posts field
    const updateResult = await User.updateMany(
      { "Posts.0": { $exists: true } }, // only update users who actually have Posts
      { $set: { Posts: [] } }
    );

    return res.status(200).json({
      message: 'All posts deleted and user post references cleared.',
      deletedPosts: deleteResult.deletedCount ?? 0,
      usersUpdated: updateResult.nModified ?? updateResult.modifiedCount ?? 0
    });
  } catch (err) {
    console.error("Error in deleteallposts:", err);
    return res.status(500).json({ message: "Server error while deleting posts", error: err.message });
  }
});

module.exports=router;