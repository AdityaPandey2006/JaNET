const mongoose= require ('mongoose');
const { schema } = require('./User');

const ChatSchema=mongoose.Schema({
    sender:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    reciever:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    message:{
        type: String,
        required: true
    },
    timestamp:{
        type: Date,
        default: Date.now
    }
});
module.exports=mongoose.model("Chat",ChatSchema);