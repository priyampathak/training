import mongoose, { Schema, Model, Document } from "mongoose";

export interface IPlan extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  features: string[];
  usersLimit: number;
  price: number; // In USD
  isActive: boolean;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const PlanSchema = new Schema<IPlan>(
  {
    name: {
      type: String,
      required: [true, "Plan name is required"],
      unique: true,
      trim: true,
    },
    features: {
      type: [String],
      required: [true, "At least one feature is required"],
      validate: {
        validator: (v: string[]) => Array.isArray(v) && v.length > 0,
        message: "Features array must contain at least one feature",
      },
    },
    usersLimit: {
      type: Number,
      required: [true, "Users limit is required"],
      min: [1, "Users limit must be at least 1"],
    },
    price: {
      type: Number,
      required: [true, "Price is required"],
      min: [0, "Price cannot be negative"],
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
// Note: unique: true on schema field automatically creates unique index
PlanSchema.index({ isActive: 1, isDeleted: 1 });

const Plan: Model<IPlan> =
  mongoose.models.Plan || mongoose.model<IPlan>("Plan", PlanSchema);

export default Plan;

