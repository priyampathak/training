import mongoose, { Schema, Document, Model } from "mongoose";

export type DifficultyLevel = "ROOKIE" | "PRO" | "LEGEND";
export type SlideLayout = "SPLIT_IMAGE_RIGHT" | "SPLIT_IMAGE_LEFT" | "FULL_WIDTH" | "IMAGE_TOP";

export interface ITrainingModule extends Document {
  // Assignment
  assignedCompanyId?: mongoose.Types.ObjectId; // null = global module available to all
  isGlobal: boolean;
  
  // Metadata
  meta: {
    title: string;
    description: string;
    category: string;
    tags: string[];
    difficulty: DifficultyLevel;
  };
  
  // Content Slides
  slides: Array<{
    heading: string;
    content: string;
    mediaUrl?: string;
    layout: SlideLayout;
    order: number;
  }>;
  
  // Display Settings
  display: {
    headingFontSize: number; // in pixels
    contentFontSize: number; // in pixels
  };
  
  // Quiz Assessment
  quiz: Array<{
    question: string;
    options: string[]; // 4 options
    correctIndex: number; // Index of correct answer (0-3)
    points: number; // Points for this question
  }>;
  
  // Assessment Settings
  assessment: {
    totalPoints: number; // Total points available (calculated)
    passingPoints: number; // Points required to pass
    passingPercentage?: number; // Optional: for display purposes
  };
  
  // Module Settings
  settings: {
    isMandatory: boolean;
    timeLimit?: number; // Optional: time limit in minutes
    attemptsAllowed?: number; // Optional: number of attempts allowed (-1 for unlimited)
    certificateEnabled?: boolean; // Optional: issue certificate on completion
  };
  
  // System Fields
  isActive: boolean;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const TrainingModuleSchema: Schema = new Schema(
  {
    assignedCompanyId: {
      type: Schema.Types.ObjectId,
      ref: "Company",
      default: null,
    },
    isGlobal: {
      type: Boolean,
      default: true,
    },
    meta: {
      title: {
        type: String,
        required: [true, "Module title is required"],
        trim: true,
      },
      description: {
        type: String,
        required: [true, "Module description is required"],
      },
      category: {
        type: String,
        required: [true, "Category is required"],
        enum: ["IT & Security", "Communication", "Management", "HR"],
      },
      tags: [{ type: String }],
      difficulty: {
        type: String,
        enum: ["ROOKIE", "PRO", "LEGEND"],
        default: "ROOKIE",
      },
    },
    slides: [
      {
        heading: { type: String, required: true },
        content: { type: String, required: true },
        mediaUrl: { type: String },
        layout: {
          type: String,
          enum: ["SPLIT_IMAGE_RIGHT", "SPLIT_IMAGE_LEFT", "FULL_WIDTH", "IMAGE_TOP"],
          default: "SPLIT_IMAGE_RIGHT",
        },
        order: { type: Number, required: true },
      },
    ],
    display: {
      headingFontSize: {
        type: Number,
        default: 32,
        min: 16,
        max: 60,
      },
      contentFontSize: {
        type: Number,
        default: 16,
        min: 12,
        max: 32,
      },
    },
    quiz: [
      {
        question: { type: String, required: true },
        options: {
          type: [String],
          required: true,
          validate: {
            validator: function(v: string[]) {
              return v.length === 4;
            },
            message: "Quiz must have exactly 4 options",
          },
        },
        correctIndex: {
          type: Number,
          required: true,
          min: 0,
          max: 3,
        },
        points: {
          type: Number,
          required: true,
          min: 1,
          default: 10,
        },
      },
    ],
    assessment: {
      totalPoints: {
        type: Number,
        required: true,
        min: 0,
      },
      passingPoints: {
        type: Number,
        required: true,
        min: 0,
      },
      passingPercentage: {
        type: Number,
        min: 0,
        max: 100,
      },
    },
    settings: {
      isMandatory: {
        type: Boolean,
        default: false,
      },
      timeLimit: {
        type: Number,
        min: 1,
      },
      attemptsAllowed: {
        type: Number,
        default: -1, // -1 means unlimited
      },
      certificateEnabled: {
        type: Boolean,
        default: false,
      },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

// Indexes
TrainingModuleSchema.index({ "meta.title": 1 });
TrainingModuleSchema.index({ "meta.category": 1 });
TrainingModuleSchema.index({ isGlobal: 1, assignedCompanyId: 1 });
TrainingModuleSchema.index({ createdBy: 1 });

const TrainingModule: Model<ITrainingModule> =
  mongoose.models.TrainingModule ||
  mongoose.model<ITrainingModule>("TrainingModule", TrainingModuleSchema);

export default TrainingModule;

