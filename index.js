require('dotenv').config();
const mongoose = require('mongoose');
const nodemailer = require('nodemailer');

// 1. Mongoose Schema
const companySchema = new mongoose.Schema({
    companyName: String,
    location: String,
    website: String,
    email: String,
    specialization: String,
    emailStatus: { type: String, default: 'Pending' },
    lastEmailSentAt: Date
});
// Using 'companies' as the collection name where you import your CSV
const Company = mongoose.model('Company', companySchema, 'companies');

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
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB Atlas!');

        console.log('\n🔍 Starting Daily Email Batch...');

        // Find companies with 'Pending' status AND ensure they have a valid email
        const pendingCompanies = await Company.find({
            emailStatus: 'Pending',
            email: { $exists: true, $ne: '' }
        }).limit(200);

        console.log(`📌 Found ${pendingCompanies.length} pending emails.`);

        if (pendingCompanies.length === 0) {
            console.log('🎉 No pending emails left. Database is exhausted!');
            process.exit(0);
        }

        for (let i = 0; i < pendingCompanies.length; i++) {
            const company = pendingCompanies[i];

            try {
                const mailOptions = {
                    from: process.env.EMAIL_USER,
                    to: company.email,
                    subject: `Application for Software Engineer – Jitendra Sharma`,
                    html: `
                        <p>Dear Hiring Team,</p>
                        <p>I am writing to express my interest in software engineering opportunities at your company.</p>
                        <p>As a developer with a strong focus on clean architecture and system optimization, I specialize in building scalable, production-ready systems. During my recent industry experience, I have architected and implemented advanced backend solutions utilizing real-time communication (Socket.io/WebRTC), high-performance caching (Redis), and secure RESTful APIs.</p>
                        <p>On the frontend, I build complex, responsive user interfaces using React.js, Redux Toolkit, and Tailwind CSS. I am highly focused on Data Structures & Algorithms and writing maintainable code that handles real-world demands—skills I've recently applied to build real-time collaborative platforms and point-of-sale integrations.</p>
                        <p>I have attached my resume for your review and included links to my work below. I am confident my technical background aligns well with your team's needs and would welcome the opportunity to discuss this further.</p>
                        <p>Best regards,<br>
                        Jitendra Sharma<br>
                        <b>Portfolio:</b> <a href="https://portfolio-jitendrasharma.onrender.com/">View Portfolio</a><br>
                        <b>GitHub:</b> <a href="https://github.com/coderjeet63">coderjeet63</a><br>
                        <b>LinkedIn:</b> <a href="https://www.linkedin.com/in/jitendra-sharma-553136284/">View LinkedIn Profile</a><br>
                        <b>Phone:</b> +91-6395905793</p>
                    `,
                    attachments: [
                        {
                            filename: 'Jitendra_Sharma_Resume.pdf',
                            path: './Jitendra_Sharma_Resume.pdf'
                        }
                    ]
                };

                await transporter.sendMail(mailOptions);
                console.log(`✅ Success: ${company.email}`);

                company.emailStatus = 'Sent';
                company.lastEmailSentAt = new Date();
                await company.save();

            } catch (sendError) {
                console.error(`❌ Failed: ${company.email} | Reason: ${sendError.message}`);
                company.emailStatus = 'Failed';
                await company.save();
            }

            if (i < pendingCompanies.length - 1) {
                const waitTime = getRandomDelay(120000, 180000);
                console.log(`😴 Sleeping for ${(waitTime / 60000).toFixed(1)} mins...`);
                await delay(waitTime);
            }
        }
        console.log('\n🎉 Today\'s batch complete!');
        process.exit(0);

    } catch (error) {
        console.error('❌ System Error:', error);
        process.exit(1);
    }
}

startAgent();