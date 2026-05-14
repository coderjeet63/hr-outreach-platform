require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

const companySchema = new mongoose.Schema({
    companyName: { type: String, default: 'Software Company' },
    email: String,
    emailStatus: { type: String, default: 'Pending' }
});
const Company = mongoose.model('Company', companySchema, 'companies'); 

async function fixDb() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB!');

        // Clear out the broken data we imported earlier
        await Company.deleteMany({});
        console.log('🗑️ Cleared old broken data.');

        const csvFilePath = path.join(__dirname, '../List_of_Major_Software_Companies_in_India.csv');
        const fileContent = fs.readFileSync(csvFilePath, 'utf8');

        // Regex to find any valid email in the raw messy text
        const emailRegex = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/gi;
        const matches = fileContent.match(emailRegex) || [];

        // Remove duplicates and clean up spaces
        const uniqueEmails = [...new Set(matches.map(e => e.toLowerCase().trim()))];

        if (uniqueEmails.length === 0) {
            console.log('⚠️ No emails found in CSV.');
            process.exit(0);
        }

        const companiesToInsert = uniqueEmails.map(email => ({
            companyName: 'Software Company',
            email: email,
            emailStatus: 'Pending'
        }));

        await Company.insertMany(companiesToInsert);
        console.log(`🎉 Found and inserted ${uniqueEmails.length} valid email addresses into MongoDB!`);
        process.exit(0);
    } catch (err) {
        console.error('❌ Error:', err);
        process.exit(1);
    }
}

fixDb();
