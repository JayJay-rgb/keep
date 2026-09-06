import Group from "../../models/Group.mjs";
import User from "../../models/User.mjs";

export const kickMember = async (req, res) => {
  try {
    const requesterId = req.user.id;
    const { groupId, targetUserId } = req.params;

    const foundGroup = await Group.findById(groupId);
    if (!foundGroup) {
      return res.status(404).json({ message: "Group not found" });
    }

    if (foundGroup.admin.toString() !== requesterId) {
      return res
        .status(403)
        .json({ message: "Only the admin can remove members" });
    }

    if (targetUserId === requesterId) {
      return res
        .status(400)
        .json({ message: "Use leave group instead of removing yourself" });
    }

    const isMember = foundGroup.members.some(
      (member) => member.toString() === targetUserId,
    );
    if (!isMember) {
      return res
        .status(400)
        .json({ message: "User is not a member of this group" });
    }

    foundGroup.members = foundGroup.members.filter(
      (member) => member.toString() !== targetUserId,
    );
    await foundGroup.save();

    await Notification.create({
      recipient: targetUserId,
      type: "kicked",
      message: `You were removed from ${foundGroup.name}`,
      group: foundGroup._id,
    });
    getIO().to(targetUserId).emit("new-notification", { type: "kicked" });

    return res.status(200).json({ message: "Member removed successfully" });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ message: "Couldn't remove member" });
  }
};
