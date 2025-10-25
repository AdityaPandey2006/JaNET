const express=require('express');
const router=express.Router();
const User=require('./models/User'); //jo user ke actual collection ko export karwa rahe the User.js se, yeh basically allow karte hai mongodb pe jitne bhi users hain unko access karne ko

//adding a new node(new user)
//mongodb functions here .save() and .find() both will return promises
//router.post('addUser') is same as app.post('/api/users/addUser')
router.post('/addUser', async (req,res)=>{
    try{
        const userData=req.body;//the request consists the data of the new user that has to be added to User collection
        const {name,username,email,department,year,intro}=userData;//a new user wont have friends so the req will not contain the list of friends
        //we create a new user of the type User by putting in the details and then, mongoose knows that newUser is of type User so the mongoose command .save() saves the newUser in the User collection
        const newUser=new User({name,username,email,department,year,intro});
        await newUser.save();
        res.status(201).json({message:'new user added',user:newUser});//201 matlab naya resource successfully ban gaya
    }
    catch(err){
        let errMessage="could not create new user "+err.message;
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

module.exports=router;//after this plugged in this router to the server.js






/*This users.js file creates the respective routes a person has to visit in order to: 
1)get the full list of users(nodes) and 
2)add new accounts to User collection*/

//saare routes ko app.get('/api/user/') karke likh sakte the 
//but modularity ke liye ek alag router bana rahe
//(basically aise samjho ki yeh ek sub-app jaisa hai jo saare /api/user wale route ko hi use karta hai)
//baad mein yeh router ko main app mein plug-in kar denge
