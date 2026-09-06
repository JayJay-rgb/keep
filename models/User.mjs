import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: function (){
        return !this.googleId; 
      },
    },
    googleId:{
      type: String,
      default:null
    },
    profilePicture: {
      type: String,
      default: function () {
        return `https://api.dicebear.com/7.x/initials/svg?seed=${this.username}`;
      },
    },
    faceRecognitionOptIn: {
      type: Boolean,
      default: false,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    verificationToken: {
      type: String,
    },
      refreshTokens: [{
    type: String,
}],
  },

  { timestamps: true },
);

const User = mongoose.model("User", userSchema);
export default User;
