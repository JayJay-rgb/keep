import { Resend } from "resend";
import "dotenv/config";

const resend = new Resend(process.env.RESEND_API_KEY);

const sendVerificationEmail = async (toEmail, token) => {
    const verifyLink = `${process.env.CLIENT_URL}/verify/${token}`;

    await resend.emails.send({
        from: "onboarding@resend.dev",
        to: toEmail,
        subject: "Verify your Keep account",
        html: `<p>Welcome to Keep! Click below to verify your email:</p>
               <a href="${verifyLink}">Verify Email</a>`,
    });
};

export default sendVerificationEmail;