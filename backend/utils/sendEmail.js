const { Resend } = require("resend");

const resend = new Resend(process.env.RESEND_API_KEY);

async function sendEmail(to, otp) {
    try {
        const { data, error } = await resend.emails.send({
            from: "User Management <onboarding@resend.dev>",
            to: to,
            subject: "Your OTP Code",
            html: `
        <div style="font-family: Arial; text-align:center">
          <h2>Email Verification</h2>
          <p>Your OTP code is:</p>
          <h1 style="letter-spacing:5px">${otp}</h1>
          <p>This code expires in 5 minutes.</p>
        </div>
      `
        });

        if (error) {
            console.error("RESEND API ERROR:", error);
            if (error.statusCode === 403 || error.name === 'validation_error') {
                console.log(`\n⚠️ Resend Limit: You can only send emails to your verified Resend account email address.`);
                console.log(`[SIMULATED OTP TO ${to}]: ${otp}\n`);
                return true; // Return true so frontend testing isn't blocked by free tier limitations
            }
            return false;
        }

        console.log("EMAIL SENT:", data);
        return true;

    } catch (error) {
        console.error("NETWORK ERROR:", error);
        return false;
    }
}

module.exports = sendEmail;