import mongoose, { Schema, Model, Document } from "mongoose";

export type UserRole = "SUPER_ADMIN" | "COMPANY_ADMIN" | "STAFF";

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  email: string;
  password?: string; // Optional because Google Auth users might not have one
  role: UserRole;

  // Multi-Tenancy Link
  companyId?: mongoose.Types.ObjectId; // Null for Super Admin

  // Metadata
  designation?: string; // e.g. "HR Manager"
  lastLoginAt?: Date;
  isActive: boolean; // Can block a specific user without deleting
  isDeleted: boolean; // Soft delete

  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      select: false, // SECURITY: Never return password by default
    },
    role: {
      type: String,
      enum: ["SUPER_ADMIN", "COMPANY_ADMIN", "STAFF"],
      default: "STAFF",
      required: true,
    },
    // The Link to the Company Schema
    companyId: {
      type: Schema.Types.ObjectId,
      ref: "Company",
      default: null,
    },
    designation: {
      type: String,
    },
    lastLoginAt: {
      type: Date,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// INDEXES (Performance Optimization)
// Note: unique: true on schema field automatically creates unique index for email
// 2. Fetch all staff for a company (The most frequent query)
UserSchema.index({ companyId: 1 });

const User: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>("User", UserSchema);

export default User;

