import Group from "../../models/Group.mjs";
import User from "../../models/User.mjs";
import crypto from "crypto";

export const createGroup = async (req, res) => {
    try {
        const { name } = req.body;
        const userId = req.user.id; // confirm this matches your middleware's req.user shape

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not available" });
        }

        const inviteCode = crypto.randomBytes(4).toString("hex");
        const group = await Group.create({
            name,
            admin: userId,
            members: [userId],
            inviteCode,
        });

        return res.status(201).json({ message: "Group created successfully", group });
    } catch (err) {
        console.log(err);
        return res.status(500).json({ message: "Couldn't create group" });
    }
};