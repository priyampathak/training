import mongoose, { Schema, Document, Model } from "mongoose";

export type AttemptStatus = "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED" | "FAILED";

export interface IModuleProgress extends Document {
  userId: mongoose.Types.ObjectId;
  moduleId: mongoose.Types.ObjectId;
  companyId: mongoose.Types.ObjectId;
  status: AttemptStatus;
  
  // Quiz Results
  score: number; // Points scored
  totalPoints: number; // Total points available
  percentage: number; // Percentage score
  isPassed: boolean;
  
  // Attempt Details
  attemptCount: number;
  answers: Record<number, number>; // questionIndex -> selectedOptionIndex (stored as plain object)
  
  // Timestamps
  startedAt: Date;
  completedAt?: Date;
  lastAttemptAt?: Date;
  
  createdAt: Date;
  updatedAt: Date;
}

const ModuleProgressSchema: Schema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    moduleId: {
      type: Schema.Types.ObjectId,
      ref: "TrainingModule",
      required: true,
    },
    companyId: {
      type: Schema.Types.ObjectId,
      ref: "Company",
      required: true,
    },
    status: {
      type: String,
      enum: ["NOT_STARTED", "IN_PROGRESS", "COMPLETED", "FAILED"],
      default: "NOT_STARTED",
    },
    score: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalPoints: {
      type: Number,
      default: 0,
      min: 0,
    },
    percentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    isPassed: {
      type: Boolean,
      default: false,
    },
    attemptCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    answers: {
      type: Schema.Types.Mixed, // Store as plain object
      default: {},
    },
    startedAt: {
      type: Date,
      default: Date.now,
    },
    completedAt: {
      type: Date,
    },
    lastAttemptAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

// Compound index to ensure one progress per user per module
ModuleProgressSchema.index({ userId: 1, moduleId: 1 }, { unique: true });

// Index for querying user progress
ModuleProgressSchema.index({ userId: 1, status: 1 });

// Index for querying company progress
ModuleProgressSchema.index({ companyId: 1, moduleId: 1 });

const ModuleProgress: Model<IModuleProgress> =
  mongoose.models.ModuleProgress ||
  mongoose.model<IModuleProgress>("ModuleProgress", ModuleProgressSchema);

export default ModuleProgress;

