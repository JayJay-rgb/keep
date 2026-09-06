import express from "express"
import passport from "../config/google.mjs"
import "dotenv/config"
import jwt from "jsonwebtoken"

const googleRouter = express.Router();

googleRouter.get("/auth/google", passport.authenticate("google",{scope:["profile","email"],session:false,prompt:"select_account"}))


googleRouter.get("/auth/google/callback",passport.authenticate("google",{ session:false,failureRedirect:`${process.env.CLIENT_URL}/auth`}),async (req,res)=>{
    try{
        const foundUser = req.user;

        const accessToken=jwt.sign({id:foundUser._id},process.env.ACCESS_TOKEN_SECRET,{expiresIn:"15m"})
        const refreshToken=jwt.sign({id:foundUser._id},process.env.REFRESH_TOKEN_SECRET,{expiresIn:"30d"})

        foundUser.refreshTokens.push(refreshToken);
        await foundUser.save();

        res.redirect(`${process.env.CLIENT_URL}/oauth-success?accessToken=${accessToken}&refreshToken=${refreshToken}`);

    }catch(err){
        console.log(err)
        res.status(500).json({"message":"Couldnt sign in"})
    }
})

export default googleRouter;



