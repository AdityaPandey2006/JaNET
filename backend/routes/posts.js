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

module.exports=router;