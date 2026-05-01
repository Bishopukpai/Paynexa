import mongoose from 'mongoose';

const PlanSchema = new mongoose.Schema({
  businessAddress: { 
    type: String, 
    required: true, 
    lowercase: true,
    index: true // Added index for faster dashboard lookups
  },
  title: { 
    type: String, 
    required: true,
    trim: true 
  },
  price: { 
    type: Number, 
    required: true 
  },
  // Added currency field specifically for USDT transition
  currency: { 
    type: String, 
    required: true,
    default: 'USDT',
    enum: ['USDT', 'ETH'] // Allows for future flexibility while defaulting to USDT
  },
  interval: { 
    type: String, 
    enum: ['hourly', 'daily', 'monthly', 'yearly'], 
    default: 'monthly',
    lowercase: true
  },
  active: { 
    type: Boolean, 
    default: true 
  },
  webhookUrl: { 
    type: String, 
    required: [true, "A webhook URL is required for merchant notifications"],
    trim: true 
  },
}, { 
  timestamps: true // Automatically manages createdAt and updatedAt
});

// This prevents Mongoose from creating the model multiple times during Next.js Hot Reloads
export default mongoose.models.Plan || mongoose.model('Plan', PlanSchema);