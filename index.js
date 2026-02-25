require('dotenv').config();
const mongoose = require('mongoose');
const nodemailer = require('nodemailer');

// 1. Mongoose Schema
const hrSchema = new mongoose.Schema({
    hrName: String,
    companyName: String,
    email: String,
    status: { type: String, default: 'Pending' }
});
const HR = mongoose.model('HR_List', hrSchema, 'HR_List');

// 2. Nodemailer Setup
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// 3. Anti-Ban Functions (Random Delay generator)
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));
const getRandomDelay = (min, max) => Math.floor(Math.random() * (max - min + 1) + min);

async function startAgent() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Database Connected Successfully!');

        // 4. Batch Limit set to 200
        const pendingHRs = await HR.find({ status: 'Pending' }).limit(200);
        console.log(`📌 Found ${pendingHRs.length} pending emails for today's batch.`);

        if (pendingHRs.length === 0) {
            console.log('🎉 No pending emails left. Database is exhausted!');
            process.exit(0);
        }

        for (let i = 0; i < pendingHRs.length; i++) {
            const hr = pendingHRs[i];
            console.log(`\n⏳ [${i + 1}/${pendingHRs.length}] Preparing to send email to: ${hr.hrName} at ${hr.companyName}...`);

            // Extract First Name for a natural greeting (e.g., "Akanksha Puri" -> "Akanksha")
            const firstName = hr.hrName ? hr.hrName.split(' ')[0] : 'Hiring Team';

            // 5. INDIVIDUAL CRASH PROTECTION (Inner Try-Catch)
            try {
                const mailOptions = {
  from: process.env.EMAIL_USER,
  to: hr.email,
  subject: `Application for  Full Stack Developer - Jitendra Sharma`,
  html: `
    <p>Hi ${firstName},</p>

    <p>I’m reaching out to explore potential engineering opportunities at <b>${hr.companyName}</b>.</p>

    <p>I’m a Full Stack Developer with hands-on experience across backend, frontend, and system optimization. I’ve built scalable REST APIs, implemented secure JWT-based authentication with role-based access control, developed responsive React interfaces, and worked on real-time systems using Socket.IO.</p>

    <p>Beyond development, I focus on clean architecture, debugging, performance optimization, and writing maintainable production-ready code.</p>

    <p>You can review my work here:<br>
    👉 <b>Portfolio:</b> <a href="https://portfolio-jitendrasharma.onrender.com/">View Portfolio</a><br>
    👉 <b>GitHub:</b> <a href="https://github.com/coderjeet63">coderjeet63</a></p>
    👉 <b>LinkedIn:</b> <a href="https://www.linkedin.com/in/jitendra-sharma-553136284/">View LinkedIn Profile</a>

    <p>I’ve attached my resume for your consideration and would welcome the opportunity to contribute to your team.</p>

    <p>Best regards,<br>
    <b>Jitendra Sharma</b></p>
  `,
  attachments: [
    {
      filename: 'Jitendra_Sharma_Resume.pdf',
      path: './Jitendra_Sharma_Resume.pdf'
    }
  ]
};

                // Mail Bhejo
                await transporter.sendMail(mailOptions);
                console.log(`✅ Success! Email delivered to ${hr.email}`);

                // Success update
                hr.status = 'Sent';
                await hr.save();

            } catch (sendError) {
                // Agar ye specific email fail hoti hai, toh code crash nahi hoga.
                console.error(`❌ Failed to send to ${hr.email}. Reason: ${sendError.message}`);
                hr.status = 'Failed'; // Status Failed taaki baad me check kar sako
                await hr.save();
            }

            // Spam Ban se bachne ke liye RANDOM wait (2 se 3.5 minute)
            if (i < pendingHRs.length - 1) {
                const waitTime = getRandomDelay(120000, 210000); 
                console.log(`😴 Sleeping for ${(waitTime / 1000 / 60).toFixed(1)} minutes to mimic human behavior...`);
                await delay(waitTime); 
            }
        }

        console.log('\n🎉 Today\'s batch is complete! Agent shutting down.');
        process.exit(0);

    } catch (error) {
        console.error('❌ Critical System Error:', error);
        process.exit(1);
    }
}

startAgent();