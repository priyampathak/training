import mongoose, { Schema, Model, Document } from "mongoose";

export interface ICompany extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  slug: string; // Unique URL identifier (e.g., trainform.com/acme-corp)
  logoUrl?: string;
  branding: {
    primaryColor: string; // For dynamic UI theming
  };
  contactEmail: string;

  // Subscription & Limits
  subscription: {
    planId?: mongoose.Types.ObjectId; // Reference to Plan
    planName: string; // Store actual plan name from database
    status: "ACTIVE" | "PAST_DUE" | "CANCELLED";
    validTill?: Date;
  };
  limits: {
    maxStaff: number; // The constraint
    maxStorageMB: number;
  };

  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const CompanySchema = new Schema<ICompany>(
  {
    name: {
      type: String,
      required: [true, "Company name is required"],
      trim: true,
    },
    slug: {
      type: String,
      required: [true, "Company slug is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },
    logoUrl: {
      type: String,
    },
    branding: {
      primaryColor: {
        type: String,
        default: "#0F172A", // Default Slate-900
      },
    },
    contactEmail: {
      type: String,
      required: [true, "Contact email is required"],
    },
    subscription: {
      planId: {
        type: Schema.Types.ObjectId,
        ref: "Plan",
      },
      planName: {
        type: String,
        required: [true, "Plan name is required"],
      },
      status: {
        type: String,
        enum: ["ACTIVE", "PAST_DUE", "CANCELLED"],
        default: "ACTIVE",
      },
      validTill: {
        type: Date,
      },
    },
    // HERE IS THE LIMIT LOGIC
    limits: {
      maxStaff: {
        type: Number,
        default: 5,
      },
      maxStorageMB: {
        type: Number,
        default: 500,
      },
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// INDEXES (Performance Optimization)
// Note: slug already has unique: true in schema (line 40), which creates an index automatically
// Fast lookup by status for filtering
CompanySchema.index({ "subscription.status": 1 });

const Company: Model<ICompany> =
  mongoose.models.Company || mongoose.model<ICompany>("Company", CompanySchema);

export default Company;

