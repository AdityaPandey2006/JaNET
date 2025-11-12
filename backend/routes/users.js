const mongoose = require('mongoose');
const express=require('express');
const router=express.Router();
const User=require('../models/User'); //jo user ke actual collection ko export karwa rahe the User.js se, yeh basically allow karte hai mongodb pe jitne bhi users hain unko access karne ko
const { MaxPriorityQueue } = require('@datastructures-js/priority-queue');
const { Queue } = require('@datastructures-js/queue');

//adding a new node(new user)
//mongodb functions here .save() and .find() both will return promises
//router.post('addUser') is same as app.post('/api/users/addUser')
router.post('/addUser', async (req,res)=>{
    try{
        const userData=req.body;//the request consists the data of the new user that has to be added to User collection

        const {name,username,email,password,department,year,intro}=userData;//a new user wont have friends so the req will not contain the list of friends

        //we create a new user of the type User by putting in the details and then, mongoose knows that newUser is of type User so the mongoose command .save() saves the newUser in the User collection
        const newUser=new User({name,username,email,password,department,year,intro});

        await newUser.save(); //let the data get saved
        res.status(201).json({message:'new user added',user:newUser});//201 matlab naya resource successfully ban gaya
    }
    catch(err){
        let errMessage="could not create new user "+err.message;
        res.status(500).json({message:errMessage});
    }
});

router.post('/addmass', async (req, res) => {
	try {
		const usersData = req.body;
		if (!Array.isArray(usersData) || usersData.length === 0) {
			return res.status(400).json({ message: "Request body must be a non-empty array of users." });
		}

		const seenUsernames = new Set();
		for (const u of usersData) {
			if (!u.name || !u.username || !u.email) {
				return res.status(400).json({ message: "Each user must have name, username, and email." });
			}
			if (seenUsernames.has(u.username)) {
				return res.status(400).json({ message: `Duplicate username in payload: ${u.username}` });
			}
			seenUsernames.add(u.username);
		}

		const usersToInsert = usersData.map(u => ({
			name: u.name,
			username: u.username,
			email: u.email,
			password: u.password || 'pass',
			department: u.department || '',
			year: u.year || null,
			intro: u.intro || '',
			friends: []
		}));

		const inserted = await User.insertMany(usersToInsert, { ordered: false });

		const usernameToId = new Map();
		for (const doc of inserted) {
			usernameToId.set(doc.username, doc._id.toString());
		}

		const bulkOps = [];
		for (const original of usersData) {
			const myUsername = original.username;
			const myId = usernameToId.get(myUsername);
			if (!myId) continue;

			const friendUsernames = Array.isArray(original.friends) ? original.friends : [];
			const friendObjects = friendUsernames
				.map(fn => usernameToId.get(fn))
				.filter(Boolean)
				.map(fid => ({
					userId: mongoose.Types.ObjectId(fid),
					weight: 1
				}));

			bulkOps.push({
				updateOne: {
					filter: { _id: mongoose.Types.ObjectId(myId) },
					update: { $set: { friends: friendObjects } }
				}
			});
		}

		if (bulkOps.length > 0) {
			await User.bulkWrite(bulkOps);
		}

		const insertedIds = inserted.map(u => u._id);
		const refreshed = await User.find({ _id: { $in: insertedIds } });

		res.status(201).json({
			message: `${refreshed.length} users added successfully with friends`,
			users: refreshed
		});
	} catch (err) {
		console.error(err);
		res.status(500).json({ message: "could not add mass users: " + err.message });
	}
});


//loading the entire list of users
router.get('/',async(req,res)=>{
    try{
        const allUsers=await User.find();
        res.json(allUsers);
    }
    catch(err){
        let errMessage="could not load user list "+err.message;
        res.status(500).json({message:errMessage});
    }
});


//loading the user using the id given by MongoDB
router.get('/:id',async(req,res)=>{
    try{
        let id1=req.params.id;
        const thisUser=await User.findById(id1);
        res.json(thisUser);
    }
    catch(err){
        let errMessage="could not load user data "+err.message;
        res.status(500).json({message:errMessage});
    }
})


router.get('/search/:username',async(req,res)=>{
    try{
        let username=req.params.username;
        const thisName=await User.findOne({username});
        if(!thisName){
            res.status(404).json({message:"This user doesn't exist"});
        }
        res.json(thisName);
    }
    catch(err){
        res.status(500).json({message:"Encountered "+err.message});
    }

})



//email exists and password matches
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Check if user exists
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: "User not found" });
        }

        // Simple password match (plain text for now)
        if (user.password !== password) {
            return res.status(400).json({ message: "Invalid password" });
        }

        // Return user info
        res.status(200).json({
            message: "Login successful",
            user
        });
    } catch (err) {
        res.status(500).json({ message: "Login error: " + err.message });
    }
});




module.exports=router;//after this plugged in this router to the server.js





// module.exports=router;//after this plugged in this router to the server.js
// module.exports=router;//after this plugged in this router to the server.js

/*This users.js file creates the respective routes a person has to visit in order to: 
1)get the full list of users(nodes) and 
2)add new accounts to User collection*/

//saare routes ko app.get('/api/user/') karke likh sakte the 
//but modularity ke liye ek alag router bana rahe
//(basically aise samjho ki yeh ek sub-app jaisa hai jo saare /api/user wale route ko hi use karta hai)
//baad mein yeh router ko main app mein plug-in kar denge

//==>>furthur addition after friends.js made, to get list of mongodb ids of all friends

//loading the list of neighbouring nodes or friends of a user
router.get('/:id/getFriends',async(req,res)=>{
    try{
        // const userId=req.body; YEH USE MAHI KAR SAKTE KYUNKI GET REQUESTS KA BODY HOTA HI NAHI
        const userId=req.params.id;
        const userObj=await User.findById(userId);
        if(!userObj){
            let errMessage="user does not exist";
            res.status(400).json({message:errMessage});
            return;
        }
        // const friends=await Promise.all(userObj.friends.map(async (friend)=>{
        //     const friendData=await User.findById(friend.userId);
        //     return friendData.name;
        //     // friend.userId;
        // }));
        const friends=await userObj.friends.map((friend)=>{
            return friend.userId;
        })
    
        res.status(200).json({friends});
    }
    catch(err){
        let errMessage="could not get friend list due to error: "
        res.status(400).json({message:errMessage+err});
    }
});

function findFriends(userid){
    const userObj = User.findById(userid);

    if(!userObj){
        res.status(500).json({message: "User Does not exist"});
        return;
    }
    
    const friends = userObj.friends.map((friend)=>{
        return friend.userId;
    })

    return friends;
}

//get friend recommendations page using BFS
router.get('/:id/friendrecommendations', async(req,res) => {
    try{
        const userid = req.params.id;

        const friends = findFriends(userid);

        const fof = friends.map((element) => {
            return findFriends(element);
        })

        res.status(200).json({fof});
    }
    catch(err){
        res.status(500).json({message:"Could not recommend friends due to error: "+err});
    }
});


//gvinng friend recommendations to a user
//user A ko friend recommendation dene ke liye hum log basically friends of friends ka use karte hain
//jo fof tumhare khud ke friends nahi hain unka list nikalo. let's say A ka frnd B ka frnd C aur A ka frnd D ka frnd E
//toh C aur E mein ranking aise decide hoga ki A ka B se zyada achha hai jaccard similarity ya D ke saath

async function friendGetter(userObj1){
    if(!userObj1||!userObj1.friends){
        return [];
    }
    const friends=userObj1.friends.map((friend)=>{
        return friend.userId;
    })
    return friends;
}

let jaccardSim=function(friendsCountA,friendsCountB,mutualFriendsCount){
    return mutualFriendsCount/(friendsCountA+friendsCountB-mutualFriendsCount);//intersection/union
}

router.get('/:id/giveRecommendation',async (req,res)=>{
    try{
        const userId=req.params.id;
        const userObj=await User.findById(userId);
        if(!userObj){
            let errMessage="user does not exist";
            res.status(400).json({message:errMessage});
            return;
        }
        const friends=await friendGetter(userObj);//i get the ids of all friends of the user
        let possibleRecommendIds=new Set();//gives the list of ids that can be recommended. 
        // we use set so that only runique recommendations are put
        for(const frndId of friends){
            const frndObj=await User.findById(frndId);
            const fofs=await friendGetter(frndObj);// i find the friends of each frnd of the user and check to see if they are already friends of A or not
            for(const fofId of fofs){
                const fofObj=await User.findById(fofId);
                let flag=1;//if flag =1 means we will send it to the list of possible recommendations
                //we wont add in the set of possible recommendations if:a)it is the user itself b)fof is already a friend of user
                let alreadyFriend=userObj.friends.some((friend)=>{
                    if(friend.userId.toString()===fofId.toString()){
                        return true;
                    }
                    else{
                        return false;
                    }
                });
                if(fofId.toString()===userId.toString()||alreadyFriend){
                    flag=0;
                }
                if(flag==1){
                    possibleRecommendIds.add(fofId.toString());
                    //pichhle line ka toString important hai because object comparisons in javascript always lead to null values toh do same object jaae bhi toh set ke liye woh alag hi hoga
                }

            }
        }
        //i now have the set of possible recommendation ids. from here will suggest friends
        let maxRecc=10;//ek baar mein max to max 10 logon ko recommend karenge friend request ke liye


        // const pq = new MaxPriorityQueue({priority:(item)=>item.sim});
        const pq =new MaxPriorityQueue((item) => item.sim);//version ke chalte upar ka syntax bhi ho sakta hai

        for(const recc of possibleRecommendIds){
            const reccObj=await User.findById(recc);
            if(!reccObj){
                continue;
            }
            const reccFriends=await friendGetter(reccObj);
            let count=0;
            for(const frnd of friends){
                for(const reccFrnd of reccFriends){
                    if(frnd.toString()===reccFrnd.toString()) count++;
                }
            }
            let jaccSim=jaccardSim(friends.length,reccFriends.length,count);
            pq.enqueue({sim:jaccSim,id:recc,mutual:count});

        }
        let actualRecommendations=[];
        for(let i=0;i<maxRecc;i++){
            // let max=pq.dequeue;
            if(pq.isEmpty()) break;
            actualRecommendations.push(pq.front());
            pq.dequeue();
        }
        res.status(200).json({message:"friend recommendation",recommendations:actualRecommendations});
    }
    catch(err){
        let errMessage="could not fetch friend recommendations due to error: "+err.message;
        res.status(400).json({message:errMessage});

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

//route to delete all users(for dev purposes)
router.delete('/deleteAll', async (req, res) => {
    try {
    const result = await User.deleteMany({});
    res.status(200).json({
        message: `Deleted ${result.deletedCount} users successfully`
    });
    }
    catch (err) {
    res.status(500).json({ message: 'Error deleting users: ' + err.message });
    }
});

module.exports=router;//after this plugged in this router to the server.js