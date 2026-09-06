import jwt from "jsonwebtoken";
import User from "../../models/User.mjs";
import Group from "../../models/Group.mjs";

export const joinGroup = async (req,res) => {
    try{
        const { inviteCode } = req.params;
        const userId = req.user.id; 
        const foundGroup= await Group.findOne({ inviteCode });
        if(!foundGroup){
            return res.status(404).json({ message: "Group not found" });
        }
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not available" });
        }
        if (foundGroup.members.some(memberId => memberId.toString() === userId)) {
            return res.status(400).json({ message: "User is already a member of the group" });
        }
        foundGroup.members.push(userId);
        await foundGroup.save();
        return res.status(200).json({ message: "User joined the group successfully" });
    }
    catch(err){
        console.log(err);
        return res.status(500).json({ message: "Couldn't join group" });
    }
}

export const getMyGroups = async (req, res) => {
    try {
        const userId = req.user.id;

        const groups = await Group.find({ members: userId });

        return res.status(200).json({ groups });
    } catch (err) {
        console.log(err);
        return res.status(500).json({ message: "Something went wrong" });
    }
};

export const getGroup = async (req, res) => {
    try {
        const { groupId } = req.params;
        const userId = req.user.id;

        const foundGroup = await Group.findById(groupId)
            .populate("members", "username profilePicture")
            .populate("admin", "username profilePicture");

        if (!foundGroup) {
            return res.status(404).json({ message: "Group not found" });
        }

        const isMember = foundGroup.members.some(member => member._id.toString() === userId);
        if (!isMember) {
            return res.status(403).json({ message: "You are not a member of this group" });
        }

        return res.status(200).json({ group: foundGroup });
    } catch (err) {
        console.log(err);
        return res.status(500).json({ message: "Something went wrong" });
    }
};