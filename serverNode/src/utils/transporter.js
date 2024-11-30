import { createTransport } from "nodemailer";

export const transporter = createTransport({
   host: "email-smtp.ap-south-1.amazonaws.com",
   port: 465,
   secure: true,
   auth: {
      user: process.env.AWS_SES_USER,
      pass: process.env.AWS_SES_PASS,
   },
});
