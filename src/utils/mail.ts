import nodemailer from "nodemailer";
import path from "path";

export const sendMail = async (email: string, otp: string) => {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      secure: true,
      port: 465,
      auth: {
        user: process.env.USER_MAIL!,
        pass: process.env.USER_MAIL_PASSWORD!,
      },
    });

    const logoPath = path.join(__dirname, "../../public/logo.png");

    const mailOptions = {
      from: `"Dream Chat" <${process.env.USER_MAIL}>`,
      to: email,
      subject: "Reset Password - Your OTP Code",
      attachments: [
        {
          filename: "logo.png",
          path: logoPath,
          cid: "logo",
        },
      ],
      html: `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f9f9f9; padding: 30px;">
          <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 8px rgba(0,0,0,0.1);">
            <tr>
              <td style="text-align: center; padding: 20px; background-color: #0d6efd;">
                <img src="cid:logo" alt="Dream Chat Logo" width="120" style="margin-bottom: 10px;">
                <h2 style="color: #fff; margin: 0;">Dream Chat</h2>
              </td>
            </tr>

            <tr>
              <td style="padding: 30px;">
                <h3 style="color: #333;">Password Reset Request</h3>
                <p style="color: #555; font-size: 15px; line-height: 1.6;">
                  Hello 👋,<br />
                  We received a request to reset your password for your <b>Dream Chat</b> account.
                  Please use the following One-Time Password (OTP) to reset your password:
                </p>

                <div style="text-align: center; margin: 25px 0;">
                  <div style="display: inline-block; padding: 15px 30px; background-color: #0d6efd; color: white; font-size: 22px; letter-spacing: 3px; border-radius: 6px; font-weight: bold;">
                    ${otp}
                  </div>
                </div>

                <p style="color: #555; font-size: 15px; line-height: 1.6;">
                  This OTP is valid for <b>10 minutes</b>. If you didn’t request a password reset, you can safely ignore this email.
                </p>

                <p style="color: #999; font-size: 13px; margin-top: 30px; border-top: 1px solid #eee; padding-top: 15px;">
                  © ${new Date().getFullYear()} Dream Chat. All rights reserved.<br />
                  <a href="https://yourwebsite.com" style="color: #0d6efd; text-decoration: none;">Visit our website</a>
                </p>
              </td>
            </tr>
          </table>
        </div>
      `,
    };

    const mailResponse = await transporter.sendMail(mailOptions);
    return mailResponse;
  } catch (error) {
    console.error("❌ Server error while sending email:", error);
    throw new Error("Email sending failed");
  }
};
