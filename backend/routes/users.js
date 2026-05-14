const mongoose = require('mongoose');
const express=require('express');
const router=express.Router();
const User=require('../models/User'); //jo user ke actual collection ko export karwa rahe the User.js se, yeh basically allow karte hai mongodb pe jitne bhi users hain unko access karne ko
const { MaxPriorityQueue } = require('@datastructures-js/priority-queue');

//for encryption and password security\
const bcrypt=require("bcryptjs");
const jwt=require("jsonwebtoken");
const auth=require("../middleware/auth");



//adding a new node(new user)
//mongodb functions here .save() and .find() both will return promises
//router.post('addUser') is same as app.post('/api/users/addUser')
router.post('/addUser', async (req,res)=>{
    try{
        const userData=req.body;//the request consists the data of the new user that has to be added to User collection
        const { name, username, email, password, department, year, intro }=userData;
        const existUser=await User.findOne({email}); //find on the basis of one field if the user exist or not
        if(existUser){
            return res.status(400).json({message:"email already registered"});
        }
        const hashedPassword=await bcrypt.hash(password,10);//10 here is the salt round factoe its actualy in the power of 10->1024 its how mamy tyoime an hashing is run and encryotiption is done ver them so it make it very secure plus also tine taking (whiuch is good)
        //create new user info in json format for the db
        const newUser=new User({
            name,
            username,
            email,
            password: hashedPassword,
            department,
            year,
            intro,
        });
        //saev user info to th db wait till it does tht
        await newUser.save();
        res.status(201).json({
            message:"New user has been added",
            user:{
                _id:newUser._id,
                name:newUser.name,
                username:newUser.username,
                email:newUser.email,
            }
        });

    }
    catch(err){
        let errMessage="could not create new user "+err.message;
        res.status(500).json({message:errMessage});
    }
});

router.post('/addmass',async (req,res)=>{
    try{
        const usersData = req.body;

        if (!Array.isArray(usersData) || usersData.length === 0) {
            return res.status(400).json({ message: "Request body must be a non-empty array of users." });
        }
        const preparedUsers=[];
        for (const user of usersData) {
            const { name, username, email ,password,department,year,intro} = user;
            if (!name || !username || !email || !password) {
                return res.status(400).json({ message: "Each user must have name, username, and email,and a password." });
            }

            const existingUser = await User.findOne({ email });
            if (existingUser) {
                return res.status(400).json({
                message: `Email already registered: ${email}`
                });
            }

            const hashedPassword=await bcrypt.hash(password,10);

            preparedUsers.push({
                name,
                username,
                email,
                password:hashedPassword,
                department,
                year,
                intro,
            });
        }

        const newUsers = await User.insertMany(preparedUsers, {ordered:false});

        res.status(201).json({
            message: `${newUsers.length} users added successfully`,
            users: newUsers.map((user)=>({
                _id:user._id,
                name:user.name,
                username:user.username,
                email:user.email
            }))
        });
    }
    catch(err){
        let errMessage="could not add mass users"+err.message;
        res.status(500).json({message:errMessage});
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

router.get('/search/:username',async(req,res)=>{
    try{
        let username=req.params.username;
        const thisName=await User.findOne({username});
        if(!thisName){
            return res.status(404).json({message:"This user doesn't exist"});
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
        const user = await User.findOne({ email }).select("+password"); //as passord is not returned now by default so need to add this
        if (!user) {
            return res.status(400).json({message:"User not found" });
        }
        // now match password}
        const match=await bcrypt.compare(password,user.password);
        if(!match){
            return res.status(400).json({message:"Invalid credentials,try agin" });
        }
        const token=jwt.sign(
            {userId:user._id,email:user.email},//payload
            process.env.JWT_SECRET,//the key using whuhc the signatuere will be made 
            {expiresIn:process.env.JWT_EXPIRES_IN || "15m"}//this is the the expiratuon date of the token after this againuser logins
        );
        // Return user info
        res.status(200).json({
            message: "Login successful",
            token,
            user:{
                _id:user._id,
                name:user.name,
                username:user.username,
                email:user.email
            }
        });
    } catch (err) {
        res.status(500).json({ message: "Login error: " + err.message });
    }
});

//this route is test user info  checking if anyproblem runs suggested 
router.get('/me', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.userId);
        res.status(200).json(user);
    } catch (err) {
        res.status(500).json({ message: "Could not fetch user: " + err.message });
    }
});


//loading the user using the id given by MongoDB
router.get('/:id',async(req,res)=>{
    try{
        let id1=req.params.id;
        const thisUser=await User.findById(id1);
        res.json(thisUser); //basically returns the user object as json
    }
    catch(err){
        let errMessage="could not load user data "+err.message;
        res.status(500).json({message:errMessage});
    }
})

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


async function findFriends(userid){
    const userObj =await User.findById(userid);
    if(!userObj){
        return null;
    }
    return userObj.friends.map((friend) => friend.userId);
}

//get friend recommendations page using BFS
router.get('/:id/friendrecommendations', async(req,res) => {
    try{
        const userid = req.params.id;

        const friends = await findFriends(userid);
        if (!friends) {
            return res.status(404).json({ message: "User does not exist" });
        }
        const fof = await Promise.all(
            friends.map((friendId) => findFriends(friendId))
        );

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
            pq.enqueue({sim:jaccSim,id:recc,mutual:count,username: reccObj.username,});

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

//  Temporary cleanup route — delete all users
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
