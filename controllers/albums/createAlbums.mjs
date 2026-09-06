import Group from "../../models/Group.mjs";
import Album from "../../models/Album.mjs";
import { notifyGroupMembers } from "../../utils/notify.mjs";

export const deleteAlbum = async (req, res) => {
  try {
    const { albumId } = req.params;
    const userId = req.user.id;

    const foundAlbum = await Album.findById(albumId);
    if (!foundAlbum) {
      return res.status(404).json({ message: "Album not found" });
    }

    const foundGroup = await Group.findById(foundAlbum.group);
    if (!foundGroup) {
      return res.status(404).json({ message: "Group not found" });
    }

    if (foundGroup.admin.toString() !== userId) {
      return res
        .status(403)
        .json({ message: "Only the admin can delete albums" });
    }

    await Album.findByIdAndDelete(albumId);

    return res.status(200).json({ message: "Album deleted successfully" });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

export const createAlbum = async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = req.user.id;
    const { title, eventDate } = req.body;

    const foundGroup = await Group.findById(groupId);
    if (!foundGroup) {
      return res.status(404).json({ message: "The group wasn't found" });
    }

    if (foundGroup.admin.toString() !== userId) {
      return res.status(403).json({ message: "Only admins can create albums" });
    }

    const createdAlbum = await Album.create({
      group: groupId,
      title,
      eventDate,
      createdBy: userId,
    });

    await notifyGroupMembers({
      group: foundGroup,
      excludeUserId: userId,
      type: "album_created",
      message: `A new album "${createdAlbum.title}" was created`,
      fromUser: userId,
      album: createdAlbum._id,
    });

    res.status(201).json({ album: createdAlbum });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Couldn't create the album" });
  }
};