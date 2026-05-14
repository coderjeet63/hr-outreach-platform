require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');
const csv = require('csv-parser');
const path = require('path');

// 1. Mongoose Schema (Exact match to index.js)
const companySchema = new mongoose.Schema({
    companyName: String,
    location: String,
    website: String,
    email: String,
    specialization: String,
    emailStatus: { type: String, default: 'Pending' },
    lastEmailSentAt: Date
});
const Company = mongoose.model('Company', companySchema, 'companies'); 

async function importCSV() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB Atlas!');

        const csvFilePath = path.join(__dirname, '../List_of_Major_Software_Companies_in_India.csv');
        const companies = [];

        fs.createReadStream(csvFilePath)
            .pipe(csv())
            .on('data', (data) => {
                companies.push({
                    companyName: data.companyName,
                    location: data.location,
                    website: data.website,
                    email: data.email,
                    specialization: data.specialization,
                    emailStatus: 'Pending'
                });
            })
            .on('end', async () => {
                console.log(`📄 Read ${companies.length} records from CSV.`);
                
                if (companies.length > 0) {
                    await Company.insertMany(companies);
                    console.log(`🎉 Successfully inserted ${companies.length} companies into MongoDB!`);
                } else {
                    console.log('⚠️ No data found in CSV or headers did not match.');
                }
                process.exit(0);
            })
            .on('error', (err) => {
                console.error('❌ Error reading CSV file:', err);
                process.exit(1);
            });

    } catch (error) {
        console.error('❌ System Error:', error);
        process.exit(1);
    }
}

importCSV();
