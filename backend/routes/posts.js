const express=require('express');
const router=express.Router();
const User=require('../models/User');
const Post=require('../models/Post');

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
            likes: 0
        });

        const savedPost = await newPost.save();

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
router.get('/:id/postrec', async(req, res) =>{
    try{
        const userId = req.params.id;
        const userObj = User.findById(userid);
        const friends = findFriends(userId);

        
    }
    catch(err){
        res.status(500).json({message: err.message});
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

module.exports=router;