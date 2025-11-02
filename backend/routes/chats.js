const express = require("express");
const Chat = require("../models/Chat");
const router = express.Router();

router.post("/send",async(req,res)=>{
    try{
        const {sender,reciever,message}=req.body;
        if (!sender||!reciever||!message){
            return res.status(401).json({ error: "Missing imp stuff" });
        }
        const newmessage = new Chat({sender,reciever,message});
        await newmessage.save();
        res.status(202).json(newmessage);
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

module.exports = router;