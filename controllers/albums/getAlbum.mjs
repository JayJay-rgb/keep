import Group from "../../models/Group.mjs";
import Album from "../../models/Album.mjs";
import Media from "../../models/Media.mjs";

export const getAlbums=async (req,res)=>{
    try{
    const { groupId}=req.params;
    const userId=req.user.id;

    const foundGroup=await Group.findById(groupId);
    if(!foundGroup)return res.status(404).json({"message":"No groups found"})

    const isMember= foundGroup.members.some(member=>member.toString()===userId)
    if(!isMember){
        return res.status(403).json({"message":"You are not a member of the group"})
    }

    const foundAlbums=await Album.find({group:groupId});
    res.status(200).json({foundAlbums})

    
    
    }catch(err){
        console.log(err)
        res.status(500).json({"message":"Something went wrong"})
    }

}

export const getAlbum = async (req, res) => {
    try {
        const { albumId } = req.params;
        const userId = req.user.id;

        const foundAlbum = await Album.findById(albumId);
        if (!foundAlbum) {
            return res.status(404).json({ message: "Album not found" });
        }

        const foundGroup = await Group.findById(foundAlbum.group);
        if (!foundGroup) {
            return res.status(404).json({ message: "Associated group not found" });
        }

        const isMember = foundGroup.members.some(member => member.toString() === userId);
        if (!isMember) {
            return res.status(403).json({ message: "You are not a member of this group" });
        }

        const media = await Media.find({ album: albumId });

        return res.status(200).json({ album: foundAlbum, media });
    } catch (err) {
        console.log(err);
        return res.status(500).json({ message: "Something went wrong" });
    }
};