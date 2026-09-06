import Group from "../../models/Group.mjs";
import User from "../../models/User.mjs";

export const leaveGroup = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id: groupId } = req.params;

        const foundGroup = await Group.findById(groupId);
        if (!foundGroup) {
            return res.status(404).json({ message: "Group not found" });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(400).json({ message: "No user found" });
        }

        const isMember = foundGroup.members.some(member => member.toString() === userId);
        if (!isMember) {
            return res.status(400).json({ message: "Not a member" });
        }

        if (foundGroup.admin.toString() === userId) {
            const remaining = foundGroup.members.filter(member => member.toString() !== userId);

            if (remaining.length === 0) {
                await Group.findByIdAndDelete(groupId);
                return res.status(200).json({ message: "Group deleted successfully" });
            } else {
                foundGroup.admin = remaining[0];
                foundGroup.members = remaining;
            }
        } else {
            foundGroup.members = foundGroup.members.filter(member => member.toString() !== userId);
        }

        await foundGroup.save();
        return res.status(200).json({ message: "You left the group" });
    } catch (err) {
        console.log(err);
        return res.status(500).json({ message: "Couldn't leave group" });
    }
};