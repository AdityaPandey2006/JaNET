//for now, we will have all the weights of connections set to 1. So, essentially the graph is unweighted for now.
//will also account for the weights later
const express=require('express');
const router=express.Router();
const User=require('../models/User');

//send friend requests
router.post('/sendrequest', async (req,res)=>{
    try{
        const {userId1,targetId}=req.body;
        //no one can friend themself
        if(userId1===targetId){
            let errMessage="cant friend yourself";
            res.status(400).json({message:errMessage});
            return;//return kar de rahe hain idhar jisse ki aur age koi evaluation na ho function ka
        }
        //we move further if the user and the targetUser are different
        const userObj=await User.findById(userId1);
        const targetObj=await User.findById(targetId);

        //if both the user and the targetUser exist
        if(userObj && targetObj){
            //if the user is already a friend of the targetUser or has already sent a friend request to the targetUser then they are not allowed to send it
            let alreadyFriend=userObj.friends.some((friend)=>{
                //cant directly compare objects, so we compare ids
                if(friend.userId.toString()===targetId){
                    return true;
                }
                else{
                    return false;
                }
            });
            if(alreadyFriend){
                let errMessage="this user is already your friend";
                res.status(400).json({message:errMessage});
                return;//return kar de rahe hain idhar jisse ki aur age koi evaluation na ho function ka
            }
            let alreadyRequested=userObj.sentRequests.some((person)=>{
                if(person.sentTo.toString()===targetId){
                    return true;
                }
                else{
                    return false;
                }
            });
            if(alreadyRequested){
                let errMessage="you have already sent a request to this user";
                res.status(400).json({message:errMessage});
                return;
            }


            //if the code comes till here then this means the user is neither a friend of the target nor have they already sent a request.
            //so we will now update the friendrequests and the sentRequests arrays for the target and the user respectively.
            await User.updateOne(
                {_id:userId1},
                {$push:{sentRequests:{sentTo:targetId}}}
            );
            await User.updateOne(
                {_id:targetId},
                {$push:{friendRequests:{requestsFrom:userId1}}}
            );
            res.status(200).json({message:"Request sent"});
            return;
        }
        else{
            let errMessage="user does not exist";
            res.status(400).json({message:errMessage});
        }

    }
    catch(err){
        let errMessage="Process failed due to error: ";
        res.status(500).json(errMessage+err);
    }
});

//accept friend requests
router.post('/acceptrequest',async (req,res)=>{
    try{
        //senderId is the id of the person that send the request.
        const {userId1,senderId}=req.body;
        //a request would have arrived to the user only when all else would have been satisfied that the sender isnt already a friend. 
        //so, as long as the senderId isnt same as userId and both the user and sender exist, we are good to go
        if(userId1===senderId){
            let errMessage="you have no friend request from yourself";
            res.status(400).json({message:errMessage});
            return;
        }
        const userObj=await User.findById(userId1);
        const senderObj=await User.findById(senderId);
        if(userObj&&senderObj){
            await User.updateOne(
                {_id:userId1},
                {$push:{friends:{userId:senderId}},//can also use addToSet instaed of push to avoid multiple entries but i dont think that is going to happen
                $pull:{friendRequests:{requestsFrom:senderId}}}//pull used to remove something 
                
            );
            await User.updateOne(
                {_id:senderId},
                {$push:{friends:{userId:userId1}},
                $pull:{sentRequests:{sentTo:userId1}}}
            );
        //using userId1 for this user to avoid coflict between userId of frineds during $push
        res.status(200).json({message:"added this sender as your friend"});
        }
        else{
            let errMessage="user does not exist";
            res.status(400).json({message:errMessage});
        }

    }
    catch(err){
        let errMessage="error while trying to add friend: "
        res.status(500).json({message:errMessage+err});
    }
});

//reject friend requests
router.post('/rejectrequest',async (req,res)=>{
    try{
        //senderId is the id of the person that send the request.
        const {userId1,senderId}=req.body;
        //a request would have arrived to the user only when all else would have been satisfied that the sender isnt already a friend. 
        //so, as long as the senderId isnt same as userId and both the user and sender exist, we are good to go
        if(userId1===senderId){
            let errMessage="you have no friend request from yourself";
            res.status(400).json({message:errMessage});
            return;
        }
        const userObj=await User.findById(userId1);
        const senderObj=await User.findById(senderId);
        if(userObj&&senderObj){
            await User.updateOne(
                {_id:userId1},
                {$pull:{friendRequests:{requestsFrom:senderId}}}//pull used to remove something 
                
            );
            await User.updateOne(
                {_id:senderId},
                {$pull:{sentRequests:{sentTo:userId1}}}
            );
        //using userId1 for this user to avoid coflict between userId of frineds during $push
        res.status(200).json({message:"removed this sender from your friendRequest list"});
        }
        else{
            let errMessage="user does not exist";
            res.status(400).json({message:errMessage});
        }

    }
    catch(err){
        let errMessage="error while trying to reject request: "
        res.status(500).json({message:errMessage+err});
    }
});
module.exports=router;