import mongoose, { Schema, Document, model, models } from 'mongoose';

export interface ISubscription extends Document {
  userAddress: string;
  userEmail: string;
  planId: mongoose.Types.ObjectId;
  transactionHash: string;
  expiryDate: Date;
  status: 'active' | 'expired' | 'cancelled';
  reminderSent: boolean; // 🚨 Added typing wrapper
  createdAt: Date;
}

const SubscriptionSchema = new Schema<ISubscription>({
  userAddress: { 
    type: String, 
    required: true, 
    lowercase: true, 
    index: true 
  },
  planId: { 
    type: Schema.Types.ObjectId, 
    ref: 'Plan', 
    required: true 
  },
  transactionHash: { 
    type: String, 
    required: true, 
    unique: true 
  },
  expiryDate: { 
    type: Date, 
    required: true 
  },
  status: { 
    type: String, 
    enum: ['active', 'expired', 'cancelled'], 
    default: 'active', 
    required: true 
  },
  userEmail: {
    type: String,
    required: true,
    lowercase: true
  },
  // 🚨 THE CRITICAL ADDITION: Prevents double-email billing spam
  reminderSent: {
    type: Boolean,
    default: false,
    required: true
  }
}, { timestamps: true });

const Subscription = models.Subscription || model<ISubscription>('Subscription', SubscriptionSchema);

export default Subscription;