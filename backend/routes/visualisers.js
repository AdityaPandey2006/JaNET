const express=require('express');
const router=express.Router();
const User=require('../models/User');
const { MinPriorityQueue } = require('@datastructures-js/priority-queue');
const { Queue } = require('@datastructures-js/queue');

// msfFind finds the minimal spanning forest from the adjacency list of the indexes of mongodb ids
function msfFind(adjList) {
    // adjList is the list of arrays that contains all the edges connected to a given edge
    // therefore, it will look like: [[[w1,n1],[w2,n2]],
    // [[w1,n1],[w2,n2],[w3,n3]],
    // ]
    let msf = [];
    const n = adjList.length;
    let visited = new Array(n).fill(0);
    // Priority queue stores [weight, node, parent]
    for(let start=0;start<n;start++){
        if(!visited[start]){
            // const pq = new MinPriorityQueue({
            //     priority: (x) => x[0]
            // });
            let pq = new MinPriorityQueue(x => x[0]);
            pq.enqueue([0, start, -1]);
            while (!pq.isEmpty()) {
                const front = pq.dequeue();  // [weight, node, parent]
                //front[0] will be weightBetweenFrontAndParent front[1] is node front[2] is its parent
                if (front[2] !== -1) {
                    if (!visited[front[1]]) {
                        const newEdge = [front[2], front[1],front[0]];
                        msf.push(newEdge);
                    }
                }
                //if node has already been visited then that must mean it was popped earlier with different weight and parent
                // and for sure all its children would have been pushed in. so, we cant push its children anymore
                if (!visited[front[1]]) {
                    for (let i = 0; i < adjList[front[1]].length; i++) {
                        const weight = adjList[front[1]][i][0];
                        const neighbour = adjList[front[1]][i][1];
                        if (!visited[neighbour]) {
                            pq.enqueue([weight, neighbour, front[1]]);
                        }
                    }
                }
                visited[front[1]] = 1;
            }
        }
    }
    
    return msf;
}



let msfFinder=async function(){
    //msfFinder will convert the mongodb ids of users to indexes. using this index we will make the adjacency list.
    //after the edgeList of the indices is returned by the msfFind, will convert these indexes back to ids.
    let indexIdMap=[];
    const userList=await User.find();//list of all user Objects
    let count=0;
    for(let user of userList){
        const userId=user._id.toString();
        indexIdMap.push(userId);
        // indexToId.push(userId);
        count++;
        //0    1
        //id1  id2 aise type ka mapping hoga idhar
    }
    let adjList = Array.from({length:count},()=>[]);
    for(let i=0;i<count;i++){
        const friendList=userList[i].friends;
        for(let friend of friendList){
            friendId=friend.userId.toString();
            friendWeight=friend.weight;
            const indexOfFriend=indexIdMap.indexOf(friendId.toString());
            adjList[i].push([friendWeight,indexOfFriend]);
        }
    }
    //once we have the adjList in the form of indices, we pass it to the msfFind function
    const msf=msfFind(adjList);
    const msfIdWise=msf.map((edge)=>{
        const node1Index=edge[0];
        const node2Index=edge[1];
        const weightEdge=edge[2];
        const node1Id=indexIdMap[node1Index];
        const node2Id=indexIdMap[node2Index];
        const IdEdge=[node1Id,node2Id,weightEdge];
        return IdEdge;
    });
    return {edges:msfIdWise,userList};
}


router.get('/msf', async (req,res)=>{
    try{
        const {edges,userList}=await msfFinder();
        const allNodes = userList.map(user => ({
                id: user._id.toString(),
                label: user.username
            }));
        res.status(200).json({message:"msf generated: ",msfNodes:allNodes,msfEdges:edges});
    }
    catch(err){
        errMessage="error generating msf"+err.message;
        res.status(500).json({message: errMessage});
    }
});

router.get('/:id/shortestpath',async(req,res)=>{
    try{
        const userId = req.params.id;
        const targetId = req.query.target;

        if(targetId === userId){
            return res.status(200).json({ path: [userId] });
        }

        const userObj = await User.findById(userId);
        const targetObj = await User.findById(targetId);

        if (!userObj || !targetObj) {
            return res.status(404).json({ message: "Start or target user not found" });
        }

        const queueF = new Queue();
        const queueB = new Queue();

        const parentF = new Map();
        const parentB = new Map();

        queueF.enqueue(userId);
        parentF.set(userId,null);

        queueB.enqueue(targetId);
        parentB.set(targetId,null);

        async function getFriendIds(userId) {
            const u = await User.findById(userId, { friends: 1 }); // project only friends
            if (!u || !u.friends) return [];
            return u.friends.map(f => f.userId.toString());
        }

        function makePath(meet){
            const pathLeft = [];
            let curr = meet;
            while(curr !== null){
                pathLeft.push(curr);
                curr = parentF.get(curr);
            }
            pathLeft.reverse();

            const pathRight = [];
            curr = parentB.get(meet);
            while(curr != null){
                pathRight.push(curr);
                curr = parentB.get(curr);
            }
            return pathLeft.concat(pathRight);
        }

        async function expandFrontier(q, mineParents, otherParents){
            const layerSize =  q.size ? q.size() : undefined;
            const steps = (typeof layerSize == 'number' && layerSize > 0) ? layerSize : 1;
            for(let i = 0;i<steps;i++){
                if(q.isEmpty()) break;
                const node = q.dequeue();
                const friends = await getFriendIds(node);
                for(const fr of friends){
                    if(!mineParents.has(fr)){
                        mineParents.set(fr,node);
                        q.enqueue(fr);
                        if(otherParents.has(fr)){
                            return fr;
                        }
                    }
                }
            }
            return null;
        }

        let meetingNode = null;

        while(!queueF.isEmpty() && !queueB.isEmpty()){
            let meet = null;
            const sizeF = queueF.size ? queueF.size() : Infinity;
            const sizeB = queueB.size ? queueB.size() : Infinity;

            if(sizeF <= sizeB){
                meet = await expandFrontier(queueF, parentF, parentB);
                if(meet){
                    meetingNode = meet;
                    break;
                }
                meet = await expandFrontier(queueB, parentB, parentF);
                if(meet){
                    meetingNode = meet;
                    break;
                }
            } else {
                meet = await expandFrontier(queueB, parentB, parentF);
                if(meet){
                    meetingNode = meet;
                    break;
                }
                meet = await expandFrontier(queueF, parentF, parentB);
                if(meet){
                    meetingNode = meet;
                    break;
                }
            }
        }

        if(!meetingNode){
            return res.status(404).json({message: "No such path exists between these given users"});
        }

        const path = makePath(meetingNode);
        return res.status(200).json({ path });
    }
    catch(err){
        res.status(400).json({message: 'Encountered error: ' + err.message});
    }
});

module.exports=router;