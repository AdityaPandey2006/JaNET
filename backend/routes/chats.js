const express = require("express");
const Chat = require("../models/Chat");
const User = require("../models/User")
const router = express.Router();

async function UpdateWeight(userId,friendId) {
    const user=await User.findById(userId);
    if (!user) throw new Error("User Not Found");
    const friend = user.friends.find((f) => f.userId.toString() === friendId);
    if(!friend) throw new Error("Users are not friends");

    friend.weight=Math.min(friend.weight+0.5,10);
    friend.lastMessage=new Date();
    await user.save();
}

router.post("/send",async(req,res)=>{
    try{
        const {sender,reciever,message}=req.body;
        if (!sender||!reciever||!message){
            return res.status(400).json({ error: "Missing imp stuff" });
        }
        //check user
        const senderUser = await User.findById(sender);
        const recieverUser = await User.findById(reciever);
        if (!senderUser || !recieverUser) {
            return res.status(404).json({ error: "User not found" });
        }
        //check friend
        const senderFriend = senderUser.friends.find((f) => f.userId.toString() === reciever);
        const recieverFriend = recieverUser.friends.find((f) => f.userId.toString() === sender);
        //if friends do the normal thiing
        if(senderFriend&&recieverFriend){
            await Promise.all([
                UpdateWeight(sender,reciever),
                UpdateWeight(reciever,sender)
            ]);
            const newmessage = new Chat({sender,reciever,message});
            await newmessage.save();
            return res.status(201).json({
                success: true,
                message: "Message sent successfully.",
                chat: newmessage,
            });
        }
        //if not friends send request
        const alreadyRequested = senderUser.sentRequests.some((req) => req.sentTo.toString() === reciever);
        if (!alreadyRequested) {
            senderUser.sentRequests.push({ sentTo: reciever });
            recieverUser.friendRequests.push({ requestsFrom: sender });
            await senderUser.save();
            await recieverUser.save();

            return res.status(200).json({
                success: false,
                message: "Not friends yet. Friend request sent!",
            });
        }
        //already requested
        return res.status(409).json({
            success: false,
            message: "Friend request already sent!",
        });
    }
    catch (err) {
        console.error("Error sending message:", err);
        res.status(500).json({ error: "Server error" });
    }
});
router.get("/:userid1/:userid2",async(req,res)=>{
    try{
        const{userid1,userid2}=req.params;
        const messages=await Chat.find({
            $or: [
        { sender: userid1, reciever: userid2 },
        { sender: userid2, reciever: userid1 },
        ],
        }).sort({ timestamp: 1 });
        res.status(200).json(messages);
    }
    catch(err){
        console.error("Error fetching chat:", err);
        res.status(500).json({ error: "Server error" });
    }
})

setInterval(async() => {
    try{
        const users=await User.find();
        for(const user of users){
            let changed=false;
            for (const friend of user.friends){
                if (!friend.lastMessage) continue;
                const minutesIdle=(Date.now()-friend.lastMessage)/60000;
                if (minutesIdle>2&& friend.weight>2){
                    friend.weight=Math.max(friend.weight-0.2,2);
                    changed=true;
                }
            }
            if (changed) await user.save();
        }
         console.log("✅ Friendship weights decayed");
    }
    catch(err){
        console.log("error updating weights");
    }    
}, 120000);

module.exports = router;
module.exports=router;
