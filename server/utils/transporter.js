import { createTransport } from "nodemailer";

export const transporter = createTransport({
   host: "email-smtp.ap-south-1.amazonaws.com",
   port: 465,
   secure: true,
   auth: {
      user: process.env.EMAIL_ID,
      pass: process.env.EMAIL_PASS,
   },
});
