const nodemailer = require("nodemailer");


async function sendEmail(to, otp) {
    try {
        if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
            console.error("❌ ERROR: Set SMTP_USER and SMTP_PASS in your .env file!");
            console.log(`[SIMULATED EMAIL TO: ${to}] -> OTP: ${otp}`);
            return true;
        }

        // Create explicit Transporter using Gmail Settings
        const transporter = nodemailer.createTransport({
            host: "smtp.gmail.com",
            port: 465,
            secure: true,
            family: 4, // true for port 465, false for port 587
            auth: {
                user: process.env.SMTP_USER, // Your Gmail address 
                pass: process.env.SMTP_PASS  // Your 16-digit Gmail App Password 
            }
        });

        // Verify SMTP connection immediately
        try {
            await transporter.verify();
            console.log("✅ SMTP SERVER READY to take messages!");
        } catch (verifyError) {
            console.error("❌ SMTP VERIFICATION ERROR:");
            console.error(verifyError);
            console.error("⚠️ Check if your App Password is correct and if 2FA is fully enabled.");
            return false;
        }

        const mailOptions = {
            from: `"User Management" <${process.env.SMTP_USER}>`,
            to,
            subject: "Your Account Verification OTP",
            html: `<div style="font-family: Arial, sans-serif; text-align: center; padding: 20px;">
                    <h2>Verify Your Email</h2>
                    <p>Your email verification OTP is:</p>
                    <h1 style="font-size: 32px; letter-spacing: 5px; color: #3B82F6;">${otp}</h1>
                    <p>This code will expire in 5 minutes.</p>
                   </div>`
        };

        // Detailed logging
        console.log(`⏳ Attempting to send OTP email to: ${to}...`);

        const info = await transporter.sendMail(mailOptions);

        // Success Log
        console.log("==========================================");
        console.log("✅ MAIL SENT: Successfully delivered to:", to);
        console.log("Message ID: %s", info.messageId);
        console.log("==========================================");

        return true;
    } catch (err) {
        // Error Log
        console.error("==========================================");
        console.error("❌ MAIL ERROR: Failed to send email via Nodemailer.");
        console.error("Details:", err);
        console.error("==========================================");
        return false;
    }
}

module.exports = sendEmail;
