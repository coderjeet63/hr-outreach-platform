require('dotenv').config();
const express = require('express');
const cron = require('node-cron');
const mongoose = require('mongoose');
const nodemailer = require('nodemailer');

const app = express();
const PORT = process.env.PORT || 3000;

// Render Web Service ko zinda rakhne ke liye ek simple route
app.get('/', (req, res) => {
    res.send('🚀 Job Agent is running 24/7 on Cloud!');
});

// 1. Mongoose Schema
const hrSchema = new mongoose.Schema({
    hrName: String,
    companyName: String,
    email: String,
    status: { type: String, default: 'Pending' }
});
// Dhyan do: Yahan apna exact collection name likhna jo Compass mein hai (jaise 'HR_List')
const HR = mongoose.model('HR_List', hrSchema, 'HR_List'); 

// 2. Nodemailer Setup
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));
const getRandomDelay = (min, max) => Math.floor(Math.random() * (max - min + 1) + min);

async function startAgent() {
    try {
        console.log('\n🔍 Starting Daily Email Batch...');
        
        const pendingHRs = await HR.find({ status: 'Pending' }).limit(200);
        console.log(`📌 Found ${pendingHRs.length} pending emails.`);

        if (pendingHRs.length === 0) {
            console.log('🎉 No pending emails left. Database is exhausted!');
            return; // Yahan server band nahi hoga, bas function ruk jayega
        }

        for (let i = 0; i < pendingHRs.length; i++) {
            const hr = pendingHRs[i];
            const firstName = hr.hrName ? hr.hrName.split(' ')[0] : 'Hiring Team';

            try {
                const mailOptions = {
                    from: process.env.EMAIL_USER,
                    to: hr.email,
                    subject: `Application for Full Stack Developer - Jitendra Sharma`,
                    html: `
                        <p>Hi ${firstName},</p>
                        <p>I’m reaching out to explore potential engineering opportunities at <b>${hr.companyName}</b>.</p>
                        <p>I’m a Full Stack Developer with hands-on experience across backend, frontend, and system optimization. I’ve built scalable REST APIs, implemented secure authentication systems with role-based access control and robust validation, developed responsive React interfaces, and worked on real-time systems .</p>
                        <p>Beyond development, I focus on clean architecture, debugging, performance optimization, and writing maintainable production-ready code.</p>
                        <p>You can review my work here:<br>
                         <b>Portfolio:</b> <a href="https://portfolio-jitendrasharma.onrender.com/">View Portfolio</a><br>
                         <b>GitHub:</b> <a href="https://github.com/coderjeet63">coderjeet63</a><br>
                         <b>LinkedIn:</b> <a href="https://www.linkedin.com/in/jitendra-sharma-553136284/">View LinkedIn Profile</a></p>
                        <p>I’ve attached my resume for your consideration and would welcome the opportunity to contribute to your team.</p>
                        <p>Best regards,<br><b>Jitendra Sharma</b></p>
                    `,
                    attachments: [
                        {
                            filename: 'Jitendra_Sharma_Resume.pdf',
                            path: './Jitendra_Sharma_Resume.pdf'
                        }
                    ]
                };

                await transporter.sendMail(mailOptions);
                console.log(`✅ Success: ${hr.email}`);

                hr.status = 'Sent';
                await hr.save();

            } catch (sendError) {
                console.error(`❌ Failed: ${hr.email} | Reason: ${sendError.message}`);
                hr.status = 'Failed';
                await hr.save();
            }

            if (i < pendingHRs.length - 1) {
                const waitTime = getRandomDelay(120000, 180000); 
                console.log(`😴 Sleeping for ${(waitTime / 60000).toFixed(1)} mins...`);
                await delay(waitTime); 
            }
        }
        console.log('\n🎉 Today\'s batch complete! Waiting for tomorrow.');

    } catch (error) {
        console.error('❌ System Error:', error);
    }
}

// 3. Database Connect aur Server Start
mongoose.connect(process.env.MONGO_URI)
    .then(() => {
        console.log('✅ Connected to MongoDB Atlas!');
        
        // Express server chalu karo
        app.listen(PORT, () => {
            console.log(`🌐 Web server listening on port ${PORT}`);
            
            // CRON JOB SETUP: Roz subah 10:00 AM IST (Indian Time) chalega
            // Server UTC time pe chalta hai, isliye 4:30 AM UTC = 10:00 AM IST
            cron.schedule('30 4 * * *', () => {
                console.log('⏰ Cron timer triggered! Waking up agent...');
                startAgent();
            });

            console.log('⏳ Cron job scheduled for 10:00 AM IST everyday.');
        });
    })
    .catch(err => console.error('Database connection failed:', err));