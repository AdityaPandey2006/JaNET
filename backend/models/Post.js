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
    }
});

module.exports=mongoose.model("Post",PostSchema);