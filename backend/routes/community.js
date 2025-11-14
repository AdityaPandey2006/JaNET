const express=require('express');
const User=require('../models/User');
const router=express.Router();

const threshold=8;
//using dfs to explore connected user and create communities
function dfs(userId,graph,visited,currentCommunity){
    visited.add(userId);
    userobj=User.findById(userId);
    currentCommunity.push(userobj.name);
    const neighbours=graph[userId]||[];

    for (const neighbour of neighbours){
        if (!visited.has(neighbour.friendId)&&neighbour.weight<=threshold){
            dfs(neighbour.friendId,graph,visited,currentCommunity);
        }
    }
}

router.get("/communities",async(req,res)=>{
    try{
        const users=await User.find({},"friends");
        const graph={};
        //build graph
        for (const user of users){
            graph[user._id.toString()]=user.friends.map((f)=>({
                friendId:f.userId.toString(),
                weight:f.weight
            }));
        }
        const visited=new Set();
        const communities=[];

        for (const userId in graph){
            if (!visited.has(userId)){
                const currentCommunity=[];
                dfs(userId,graph,visited,currentCommunity);
                //considering communities>1
                if (currentCommunity.length>1){
                    communities.push(currentCommunity);
                }
            }
        }
        res.status(200).json({
            totalCommunities:communities.length,
            communities
        });
    }
    catch (err){
        console.error("Error detecting communities:", err);
        res.status(500).json({ error: "Server error" });
    }
});
module.exports=router;