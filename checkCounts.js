require('dotenv').config();
const mongoose = require('mongoose');

const companySchema = new mongoose.Schema({
    companyName: String,
    email: String,
    emailStatus: { type: String, default: 'Pending' },
    lastEmailSentAt: Date
});
const Company = mongoose.model('Company', companySchema, 'companies'); 

async function check() {
    await mongoose.connect(process.env.MONGO_URI);
    const pendingCount = await Company.countDocuments({ emailStatus: 'Pending' });
    const failedCount = await Company.countDocuments({ emailStatus: 'Failed' });
    const sentCount = await Company.countDocuments({ emailStatus: 'Sent' });
    
    console.log(`Pending: ${pendingCount}`);
    console.log(`Failed: ${failedCount}`);
    console.log(`Sent: ${sentCount}`);

    process.exit(0);
}
check();
