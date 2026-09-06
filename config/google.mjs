import passport from "passport";
import { Strategy } from "passport-google-oauth20";
import User from "../models/User.mjs";
import "dotenv/config";

passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
    try {
        const user = await User.findById(id);
        if (!user) {
            throw new Error("User not found");
        }
        done(null, user);
    } catch (err) {
        done(err, null);
    }
});

passport.use(
    new Strategy(
        {
            clientID: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            callbackURL: process.env.GOOGLE_REDIRECT_URI,
        },
        async (accessToken, refreshToken, profile, done) => {
            try {
                const googleId = profile.id;
                const email = profile.emails[0].value;

                let foundUser = await User.findOne({ $or: [{ googleId }, { email }] });

                if (!foundUser) {
                    const newUser = await User.create({
                        username: profile.displayName,
                        email,
                        googleId,
                        isVerified: true,
                        profilePicture: profile.photos?.[0]?.value,
                    });
                    return done(null, newUser);
                }

                if (!foundUser.googleId) {
                    foundUser.googleId = googleId;
                    foundUser.isVerified = true;
                    if (!foundUser.profilePicture && profile.photos?.[0]?.value) {
                        foundUser.profilePicture = profile.photos[0].value;
                    }
                    await foundUser.save();
                    return done(null, foundUser);
                }

                return done(null, foundUser);
            } catch (err) {
                return done(err, null);
            }
        }
    )
);

export default passport;