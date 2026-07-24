import mongoose, { Schema, Document } from "mongoose";

export interface IAffiliate extends Document {
  name: string;
  email: string;
  password?: string;
  provider?: string;
  isVerified?: boolean;
  phone?: string;
  country: string;
  timeZone: string;
  primaryPlatform: string;
  websiteOrSocial?: string;
  socialProfiles: string;
  audienceSize: string;
  targetAudience: string[];
  promotionMethods: string[];
  promotedSaaSBefore: string;
  promotedCryptoBefore: string;
  currentPrograms?: string;
  estimatedMonthlyReferrals: string;
  preferredPayout: "USDC" | "Bank";
  walletAddress?: string;
  walletNetwork?: string;
  bankName?: string;
  accountName?: string;
  accountNumber?: string;
  swiftCode?: string;
  status: "pending" | "approved" | "rejected" | "suspended";
  affiliateCode?: string;
  referralCode?: string;
  createdAt: Date;
  updatedAt: Date;
}

const AffiliateSchema: Schema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { 
      type: String, 
      required: true, 
      unique: true, 
      trim: true, 
      lowercase: true 
    },
    password: { 
      type: String, 
      select: false // Prevents returning the hashed password in standard queries
    },
    provider: { type: String, default: "credentials" },
    isVerified: { type: Boolean, default: false },
    phone: { type: String, trim: true },
    country: { type: String, required: true },
    timeZone: { type: String, required: true },
    primaryPlatform: { type: String, required: true },
    websiteOrSocial: { type: String, trim: true, default: "" },
    socialProfiles: { type: String, required: true },
    audienceSize: { type: String, required: true },
    targetAudience: { type: [String], default: [] },
    promotionMethods: { type: [String], default: [] },
    promotedSaaSBefore: { type: String, required: true },
    promotedCryptoBefore: { type: String, required: true },
    currentPrograms: { type: String, trim: true },
    estimatedMonthlyReferrals: { type: String, required: true },
    
    preferredPayout: { 
      type: String, 
      enum: ["USDC", "Bank"], 
      required: true 
    },
    
    walletAddress: { 
      type: String, 
      unique: true, 
      sparse: true, 
      trim: true, 
      lowercase: true 
    },
    walletNetwork: { type: String },
    bankName: { type: String, trim: true },
    accountName: { type: String, trim: true },
    accountNumber: { type: String, trim: true },
    swiftCode: { type: String, trim: true },
    
    status: { 
      type: String, 
      enum: ["pending", "approved", "rejected", "suspended"],
      default: "pending" 
    },
    affiliateCode: { type: String, unique: true, sparse: true },
    referralCode: { type: String, unique: true, sparse: true, default: null },
  },
  { timestamps: true }
);

export default mongoose.models.Affiliate || mongoose.model<IAffiliate>("Affiliate", AffiliateSchema);