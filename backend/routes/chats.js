const express = require("express");
const Chat = require("../models/Chat");
const User = require("../models/User")
const router = express.Router();

async function UpdateWeight(userId,friendId) {
    const user=await User.findById(userId);
    if (!user) throw new Error("User Not Found");
    const friend = user.friends.find((f) => f.userId.toString() === friendId);
    if(!friend) throw new Error("Users are not friends");

    friend.weight=Math.max(friend.weight-0.5,1);
    friend.lastMessage=new Date();
    await user.save();
}

async function sendMessage({sender, reciever, message}){
    if(!sender || !reciever || !message){
        return{
            status: 400,
            success: false,
            error: "Missing info about users or message"
        }
    }
    
    const senderUser = await User.findById(sender);
    const recUser = await User.findById(reciever);

    if(!senderUser || !recUser){
        return{
            status: 400,
            success: false,
            error: "User does not exist"
        }
    }

    const senderFriend = senderUser.friends.find(
        (f) => f.userId.toString() === reciever
    );
    
    const recieverFriend = recUser.friends.find(
        (f) => f.userId.toString() === sender
    );

    if(senderFriend && recieverFriend){
        await Promise.all([
            UpdateWeight(sender, reciever),
            UpdateWeight(reciever, sender)
        ]);

        const newMessage = new Chat({
            sender,
            reciever,
            message
        });

        await newMessage.save();

        return {
            status: 201,
            success: true,
            message: "Message sent successfully",
            chat: newMessage
        };
    }

    return {
        status: 403,
        success: false,
        error: "Users are not friends!"
    }
};

router.post("/send", async(req, res) => {
    try{
        const result = await sendMessage(req.body);
        res.status(result.status).json(result);
    } catch(err) {
        console.error("Error sending message:", err);
        res.status(500).json({error: "Server error"});
    }
});

router.get("/:userid1/:userid2", async(req, res) => {
    try{
        const {userid1, userid2} = req.params;
        const messages = await Chat.find({
            $or: [
                {sender: userid1, reciever: userid2},
                {sender: userid2, reciever: userid1}
            ]
        }).sort({timestamp: 1});

        res.status(200).json(messages);
    } catch(err){
        console.error("Error fetching messages:", err);
        res.status(500).json({error: "Server error"});
    }
})

module.exports={
    router,
    sendMessage
};