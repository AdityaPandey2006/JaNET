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
// Personalized PageRank-based post recommendation (fixed version)
// Usage: GET /api/posts/:id/postrec?top=10&alpha=0.6
router.get("/:id/postrec", async (req, res) => {
  try {
    const userId = req.params.id;
    const topK = Math.max(1, parseInt(req.query.top || "10", 10));

    //  Load all users with friends+posts
    const users = await User.find({}, { _id: 1, friends: 1, Posts: 1, name: 1, username: 1, email: 1 }).lean();
    if (users.length === 0)
      return res.status(200).json({ message: "No users found", recommendations: [] });

    const targetUser = users.find(u => String(u._id) === String(userId));
    if (!targetUser)
      return res.status(404).json({ message: "Target user not found" });

    const n = users.length;
    const basePriority = 1 / n;

    // getFriendSet helper to get set of friends of a user.....
    const getFriendSet = (u) => new Set((u.friends || []).map(f => String(f.userId)));

    // Target user’s friends
    const targetFriendSet = getFriendSet(targetUser);

    // Jaccard similarity for setting personalizerd ranks to the users frindss according to closernness
    const jaccard = (setA, setB) => {
      const intersection = [...setA].filter(x => setB.has(x)).length;
      const union = new Set([...setA, ...setB]).size;
      return union === 0 ? 0 : intersection / union;
    };

    // set inintial user prioirties....
    const userPriority = new Map(); // userId -> priority
    const PERSONAL_WEIGHT = 0.6; // controls personalization influence

    for (const u of users) {
      if (String(u._id) === String(userId)) {
        // Target user gets its own base priority (but we won't recommend own posts anyway)
        userPriority.set(String(u._id), basePriority);
        continue;
      }

      const friendSet = getFriendSet(u);
      const jac = jaccard(targetFriendSet, friendSet);

      const priority = basePriority + PERSONAL_WEIGHT * jac;  //set the jaccard similartity to 0.6 to not have to too much infuluece of friend on feed
      userPriority.set(String(u._id), priority);
    }

   //get all posts ids....
    const postIdToAuthor = new Map(); //map post ids to author to note their infuence on the posts too
    const allPostIds = []; //just to store thr post ids....

    for (const u of users) {
      if (!Array.isArray(u.Posts)) continue;
      for (const p of u.Posts) {
        const pid = (p.postId ? String(p.postId) : String(p));
        postIdToAuthor.set(pid, String(u._id));
        allPostIds.push(pid);
      }
    }

    if (allPostIds.length === 0)
      return res.status(200).json({ message: "No posts available", recommendations: [] });

    const uniquePostIds = [...new Set(allPostIds)];

    const posts = await Post.find({ _id: { $in: uniquePostIds } }).lean();

    // Find max likes so we can normalize for our formula...
    let maxLikes = Math.max(...posts.map(p => p.likes || 0), 1);

    //post scores.....
    const results = [];
    const LIKE_WEIGHT = 0.7;  // likes influence (strong)
    const PRIORITY_WEIGHT = 0.3; // author influence (light)

    for (const p of posts) {
      const pid = String(p._id);
      const authorId = postIdToAuthor.get(pid);

      if (!authorId) continue;
      if (String(authorId) === String(userId)) continue; // skip own posts

      const authorPriority = userPriority.get(authorId) || basePriority;

      const likes = p.likes || 0;
      const normalizedLikes = likes / maxLikes;

      // Final ranking score
      const score =
        (LIKE_WEIGHT * normalizedLikes) +
        (PRIORITY_WEIGHT * authorPriority);

      results.push({
        post: p,
        author: users.find(u => String(u._id) === authorId),
        score
      });
    }

    //now sort acorfin to max score...
    results.sort((a, b) => b.score - a.score);
    const top = results.slice(0, topK);

    return res.status(200).json({
      message: "recommendations",
      recommendations: top
    });

  } catch (err) {
    console.error("Error in /postrec:", err);
    return res.status(500).json({
      message: "Server error while computing recommendations",
      error: err.message
    });
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