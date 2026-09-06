import User from "../models/User.mjs";

export const getUserProfile = async (req, res) => {
    try {
        const userId = req.user.id;

        const foundUser = await User.findById(userId).select("-password -verificationToken");
        if (!foundUser) {
            return res.status(404).json({ message: "User not found" });
        }

        return res.status(200).json({ user: foundUser });
    } catch (err) {
        console.log(err);
        return res.status(500).json({ message: "Something went wrong" });
    }
};

export const updateProfile = async (req, res) => {
    try {
        const userId = req.user.id;
        const { username, faceRecognitionOptIn } = req.body;

        const updates = {};
        if (username !== undefined) updates.username = username;
        if (faceRecognitionOptIn !== undefined) updates.faceRecognitionOptIn = faceRecognitionOptIn;

        const updatedUser = await User.findByIdAndUpdate(userId, updates, {
            new: true,
            runValidators: true,
        }).select("-password -verificationToken");

        if (!updatedUser) {
            return res.status(404).json({ message: "User not found" });
        }

        return res.status(200).json({ user: updatedUser });
    } catch (err) {
        if (err.code === 11000) {
            return res.status(409).json({ message: "That username is already taken" });
        }
        console.log(err);
        return res.status(500).json({ message: "Something went wrong" });
    }
};


export const updateProfilePicture = async (req, res) => {
    try {
        const userId = req.user.id;

        if (!req.file) {
            return res.status(400).json({ message: "No file uploaded" });
        }

        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { profilePicture: req.file.path },
            { new: true }
        ).select("-password -verificationToken");

        if (!updatedUser) {
            return res.status(404).json({ message: "User not found" });
        }

        return res.status(200).json({ user: updatedUser });
    } catch (err) {
        console.log(err);
        return res.status(500).json({ message: "Something went wrong" });
    }
};