import mongoose from 'mongoose';

const BusinessSchema = new mongoose.Schema({
  email: { 
    type: String, 
    required: true, 
    unique: true, 
    lowercase: true,
    trim: true 
  },
  name: { 
    type: String, 
    required: true 
  },
  image: { 
    type: String 
  }, // Stores Google Profile Avatar Picture
  walletAddress: { 
    type: String, 
    lowercase: true, 
    index: true 
  }, // Linked Web3 Gateway Merchant Wallet
  companyLogo: { 
    type: String 
  },
  
  // 🔐 Custom Credentials Identity Access Management
  password: { 
    type: String, 
    required: false // Kept optional so Google OAuth users bypass password creation
  },
  provider: { 
    type: String, 
    required: false 
  },

  // ✉️ Cryptographic Email Verification Pipeline Properties
  isVerified: { 
    type: Boolean, 
    default: false 
  },
  verificationToken: { 
    type: String, 
    required: false 
  },
  verificationTokenExpires: { 
    type: Date, 
    required: false 
  }
}, { timestamps: true });

// 💡 THE HOT-RELOAD DEVELOPER FIX:
// Explicitly purge the model registry cache during Next.js local compilation cycles.
// This ensures updates like 'isVerified' are immediately recognized by Mongoose on file save.
if (mongoose.models && mongoose.models.Business) {
  delete mongoose.models.Business;
}

export default mongoose.model('Business', BusinessSchema);