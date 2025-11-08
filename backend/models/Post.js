const mongoose = require('mongoose');

const PostSchema = mongoose.Schema({
    title:{
        type: String,
        required: true
    },
    description:{
        type: String,
        required: true
    },
    likes:{
        type: Number,
    },
    likedBy:[{
        type: mongoose.Schema.Types.ObjectId,
        ref:'User'
    }],
    author:{
        type: mongoose.Schema.Types.ObjectId,
        ref:'User'
    },
});

module.exports=mongoose.model("Post",PostSchema);