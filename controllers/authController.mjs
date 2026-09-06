import User from "../models/User.mjs";
import { comparePassword } from "../utils/hashing.mjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import sendVerificationEmail from "../config/email.mjs";
import "dotenv/config";

export const verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;
    if (!token) {
      return res
        .status(400)
        .json({ message: "Verification token is required" });
    }
    const foundUser = await User.findOne({ verificationToken: token });
    if (!foundUser) {
      return res.status(400).json({ message: "Invalid verification token" });
    }

    foundUser.isVerified = true;
    foundUser.verificationToken = undefined;
    await foundUser.save();
    res.status(200).json({ message: "Email verified successfully" });
  } catch (err) {
    console.error("Error verifying email:", err);
    res.status(500).json({ message: "Something went wrong" });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required" });
    }
    const foundUser = await User.findOne({ email });
    if (!foundUser) {
      return res.status(401).json({ message: "Invalid credentials" });
    }
    if (!foundUser.isVerified) {
      return res
        .status(403)
        .json({ message: "Please verify your email before logging in" });
    }
    const isMatch = await comparePassword(password, foundUser.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const accessToken = jwt.sign(
      { id: foundUser._id },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: "15m" },
    );
    const refreshToken = jwt.sign(
      { id: foundUser._id },
      process.env.REFRESH_TOKEN_SECRET,
      { expiresIn: "30d" },
    );

    foundUser.refreshTokens.push(refreshToken);
    await foundUser.save();

    res.status(200).json({ accessToken, refreshToken });
  } catch (err) {
    console.error("Error in authController:", err);
    res.status(500).json({ message: "Something went wrong" });
  }
};
export const resendVerification = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ message: "Email is required" });
        }

        const foundUser = await User.findOne({ email });
        if (!foundUser) {
            return res.status(404).json({ message: "User not found" });
        }

        if (foundUser.isVerified) {
            return res.status(400).json({ message: "This account is already verified" });
        }

        const newToken = crypto.randomBytes(20).toString("hex");
        foundUser.verificationToken = newToken;
        await foundUser.save();

        await sendVerificationEmail(email, newToken);

        return res.status(200).json({ message: "Verification email resent" });
    } catch (err) {
        console.log(err);
        return res.status(500).json({ message: "Something went wrong" });
    }
};
export const refreshAccessToken = async (req, res) => {
    try {
        const { refreshToken } = req.body;
        if (!refreshToken) {
            return res.status(401).json({ message: "Refresh token required" });
        }

        const foundUser = await User.findOne({ refreshTokens: refreshToken });

        jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, async (err, decoded) => {
            if (err) {
                return res.status(403).json({ message: "Invalid or expired refresh token" });
            }

            if (!foundUser) {
                // Token not in DB but signature is valid — possible reuse of a rotated-out token.
                // Revoke all sessions for this user as a precaution.
                await User.findByIdAndUpdate(decoded.id, { refreshTokens: [] });
                return res.status(403).json({ message: "Refresh token reuse detected. Please log in again." });
            }

            // Rotation: remove the old token, issue a new pair
            foundUser.refreshTokens = foundUser.refreshTokens.filter(t => t !== refreshToken);

            const newAccessToken = jwt.sign({ id: foundUser._id }, process.env.JWT_SECRET, { expiresIn: "15m" });
            const newRefreshToken = jwt.sign({ id: foundUser._id }, process.env.REFRESH_TOKEN_SECRET, { expiresIn: "30d" });

            foundUser.refreshTokens.push(newRefreshToken);
            await foundUser.save();

            return res.status(200).json({ accessToken: newAccessToken, refreshToken: newRefreshToken });
        });
    } catch (err) {
        console.error("Error refreshing token:", err);
        return res.status(500).json({ message: "Something went wrong" });
    }
};



export const logout = async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
      return res.status(400).json({
        message: "Refresh token is required",
      });
    }

    await User.updateOne(
      { currentRefreshToken: refreshToken },
      { $unset: { currentRefreshToken: "" } }
    );

    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    });

    return res.status(200).json({
      message: "Logged out successfully",
    });
  } catch (err) {
    console.log(err);

    return res.status(500).json({
      message: "Something went wrong, try again",
    });
  }
};
