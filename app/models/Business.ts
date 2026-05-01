import mongoose from 'mongoose';

const BusinessSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true },
  name: { type: String, required: true },
  image: { type: String }, // To store Google Profile Pic
  walletAddress: { type: String, lowercase: true, index: true }, // Linked Web3 Wallet
  companyLogo: { type: String },
}, { timestamps: true });

export default mongoose.models.Business || mongoose.model('Business', BusinessSchema);