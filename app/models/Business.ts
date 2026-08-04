import mongoose, { Schema, Document } from "mongoose";

export interface IBusiness extends Document {
  email?: string;
  name: string;
  image?: string;
  walletAddress?: string;
  companyLogo?: string;
  affiliateCode?: string;
  
  // 🔐 Privy Auth & Flexible Provider Tracking
  privyId?: string;
  provider?: "google" | "credentials" | "privy";

  // 🤝 Referral Tracking Properties
  referredBy?: string | null;
  referrerId?: mongoose.Types.ObjectId | null;
  referrerModel?: "Business" | "Affiliate" | null;
  
  // 🔒 Immutable Attribution Lock Attributes
  attributionLocked?: boolean;
  attributionDate?: Date | null;

  role: "user" | "admin";
  password?: string;
  isVerified: boolean;
  verificationToken?: string;
  verificationTokenExpires?: Date;
  status: "approved" | "suspended"; // Controls active vs suspended state
  createdAt: Date;
  updatedAt: Date;
}

const BusinessSchema = new Schema<IBusiness>(
  {
    // -----------------------------------------------------------------------
    // 1. IDENTITY & UNIQUE CONSTRAINTS (Prevents Hijacking & Duplicates)
    // -----------------------------------------------------------------------
    email: { 
      type: String, 
      required: false, // Made optional so pure Web3/Social signups don't throw validation errors
      sparse: true,   // Allows multiple null/undefined values without duplicate key errors
      lowercase: true,
      trim: true,
      immutable: true // Lock: Identity email cannot be altered once created
    },
    privyId: {
      type: String,
      unique: true,
      sparse: true,  // Essential: lets non-Privy credentials users exist without privyId collisions
      index: true,
    },
    provider: { 
      type: String, 
      enum: ["google", "credentials", "privy"],
      required: false,
      immutable: true // Lock: Auth Provider is immutable once set
    },
    name: { 
      type: String, 
      required: true 
    },
    image: { 
      type: String 
    },
    walletAddress: { 
      type: String, 
      lowercase: true, 
      index: true 
    },
    companyLogo: { 
      type: String 
    },
    
    // -----------------------------------------------------------------------
    // 2. REFERRAL & AFFILIATE ECOSYSTEM (Sparse Unique Code + Immutability)
    // -----------------------------------------------------------------------
    affiliateCode: {
      type: String,
      unique: true,
      sparse: true, // Prevents null/undefined index collisions across merchants
      trim: true,
    },
    referredBy: {
      type: String,
      default: null,
      immutable: true, // Lock: Once attributed, referring code cannot be changed
    },
    referrerId: {
      type: Schema.Types.ObjectId,
      refPath: "referrerModel", // Dynamic reference to either Business or Affiliate model
      default: null,
      immutable: true, // Lock: Referring document ID cannot be altered post-registration
    },
    referrerModel: {
      type: String,
      enum: ["Business", "Affiliate"],
      default: null,
      immutable: true, // Lock: Referrer target model cannot be altered
    },

    // -----------------------------------------------------------------------
    // 3. IMMUTABLE ATTRIBUTION LOCK ATTRIBUTES (Enforces 1 Merchant = 1 Referral)
    // -----------------------------------------------------------------------
    attributionLocked: {
      type: Boolean,
      default: false,
      immutable: true, // Lock: Freeze flag locked permanently upon document creation
    },
    attributionDate: {
      type: Date,
      default: null,
      immutable: true, // Lock: Timestamp of attribution lock is frozen
    },

    // -----------------------------------------------------------------------
    // 4. ACCESS CONTROL & ACCOUNT STATUS MANAGEMENT
    // -----------------------------------------------------------------------
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
    status: {
      type: String,
      enum: ["approved", "suspended"],
      default: "approved", 
    },

    // -----------------------------------------------------------------------
    // 5. SECURITY & VERIFICATION PIPELINE
    // -----------------------------------------------------------------------
    password: { 
      type: String, 
      required: false
    },
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
  }, 
  { timestamps: true }
);

// Prevent cached Mongoose model re-compilation issues during Next.js hot-reloads
if (mongoose.models && mongoose.models.Business) {
  delete mongoose.models.Business;
}

export default mongoose.models.Business || mongoose.model<IBusiness>("Business", BusinessSchema);