const jwt=require("jsonwebtoken");
const auth=(req,res,next)=>{
    // Get the Authorization header from the request
    // Example header:
    // Authorization: Bearer eyJhbGciOiJIUzI1Ni... [Bearer TOKEN] format
    const authHeader=req.header("Authorization");
    if(!authHeader || !authHeader.startsWith("Bearer ")){
        return res.status(401).json({message:"No token,Auth is denied"});
    }

    //now extract the token from [Bearer TOKEN]
    const token=authHeader.split(" ")[1]//split leabing out all " " and then from there the second after "Bearer is that token required for authentication"
    //a toke consists of header.payload.signature
    //header me jo algorithm use hio rah hai for security (encryption of password)o is there 
    //payload contains actual data pieces
    //and the signature contains the copmbination of payload+the secret key that is toitally then encrytped through the algo defined in header
    //its not that im to seure the algo what is neede oit to secure thr secret key without that hacker cant do jackshit
    try{
        const decoded=jwt.verify(token,process.env.JWT_SECRET); //verify the recieved token with the secret key by recreating thre signaturee if the suignatue matched it thn allow
        req.user=decoded;
        next();
    }
    catch(err){
        return res.status(401).json({message:"INvalid token"});
    }

}

module.exports=auth;