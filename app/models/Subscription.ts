import mongoose, { Schema, Document, model, models } from 'mongoose';

export interface ISubscription extends Document {
  userAddress: string;
  userEmail: string;
  planId: mongoose.Types.ObjectId;
  transactionHash: string;
  expiryDate: Date;
  status: 'active' | 'expired' | 'cancelled'; // The new field
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
    default: 'active', // New payments start as active
    required: true 
  },
  userEmail: {
  type: String,
  required: true,
  lowercase: true
},
}, { timestamps: true });

const Subscription = models.Subscription || model<ISubscription>('Subscription', SubscriptionSchema);

export default Subscription;