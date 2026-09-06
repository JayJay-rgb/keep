import  jwt from "jsonwebtoken";
import "dotenv/config";

const verifyJwt = (req, res, next) => {
    try{
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ message: "Unauthorized", detail: "No valid auth header" });
    }
    const token = authHeader.substring(7);
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        if (err) {
            return res.status(401).json({ message: "Invalid token", detail: "The provided token is invalid" });
        }
        req.user = decoded;
        next();
    });
    }catch(err){
        console.error("Error in verifyJwt middleware:", err);
        return res.status(500).json({ message: "Something went wrong", detail: "An error occurred while verifying the token" });
    }
};

export default verifyJwt;