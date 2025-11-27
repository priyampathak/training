"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { updateTrainingModule, getCompaniesForModule } from "@/src/actions/modules";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { Textarea } from "@/src/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";
import {
  Loader2,
  Plus,
  Trash2,
  X,
  Save,
} from "lucide-react";

// Same schemas as CreateModuleWizard but for updates
const quizQuestionSchema = z.object({
  question: z.string().min(1, "Question is required"),
  options: z.array(z.string()).length(4),
  correctIndex: z.number().min(0).max(3),
  points: z.number().min(1, "Points must be at least 1"),
});

const slideSchema = z.object({
  heading: z.string()
    .min(1, "Heading is required")
    .refine((val) => val.trim().split(/\s+/).length <= 10, {
      message: "Heading must not exceed 10 words",
    }),
  content: z.string()
    .min(1, "Content is required")
    .refine((val) => val.trim().split(/\s+/).length <= 100, {
      message: "Content must not exceed 100 words",
    }),
  mediaUrl: z.string().optional(),
  layout: z.enum(["SPLIT_IMAGE_RIGHT", "SPLIT_IMAGE_LEFT", "FULL_WIDTH", "IMAGE_TOP"]),
  order: z.number(),
});

const updateModuleSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  category: z.enum(["IT & Security", "Communication", "Management", "HR"]),
  tags: z.array(z.string()),
  difficulty: z.enum(["ROOKIE", "PRO", "LEGEND"]),
  slides: z.array(slideSchema).min(1, "At least one slide is required"),
  quiz: z.array(quizQuestionSchema).min(1, "At least one quiz question is required"),
  passingPoints: z.number().min(0, "Passing points cannot be negative"),
  isMandatory: z.boolean(),
  headingFontSize: z.number().min(16).max(60),
  contentFontSize: z.number().min(12).max(32),
});

type UpdateModuleFormData = z.infer<typeof updateModuleSchema>;

interface EditModuleWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  module: any; // The module to edit
}

export function EditModuleWizard({ open, onOpenChange, module }: EditModuleWizardProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [tagInput, setTagInput] = useState("");

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
    reset,
  } = useForm<UpdateModuleFormData>({
    resolver: zodResolver(updateModuleSchema),
  });

  const { fields: slideFields, append: appendSlide, remove: removeSlide } = useFieldArray({
    control,
    name: "slides",
  });

  const { fields: quizFields, append: appendQuiz, remove: removeQuiz } = useFieldArray({
    control,
    name: "quiz",
  });

  const tags = watch("tags") || [];

  // Load existing module data when modal opens
  useEffect(() => {
    if (open && module) {
      console.log("📝 Loading module for editing:", module);
      
      // Ensure slides have the correct structure
      const formattedSlides = (module.slides || []).map((slide: any, index: number) => ({
        heading: slide.heading || "",
        content: slide.content || "",
        mediaUrl: slide.mediaUrl || "",
        layout: slide.layout || "SPLIT_IMAGE_RIGHT",
        order: slide.order !== undefined ? slide.order : index,
      }));

      // Ensure quiz has the correct structure
      const formattedQuiz = (module.quiz || []).map((question: any) => ({
        question: question.question || "",
        options: Array.isArray(question.options) ? question.options : ["", "", "", ""],
        correctIndex: question.correctIndex !== undefined ? question.correctIndex : 0,
        points: question.points || 10,
      }));

      reset({
        title: module.meta?.title || "",
        description: module.meta?.description || "",
        category: module.meta?.category || "IT & Security",
        tags: Array.isArray(module.meta?.tags) ? module.meta.tags : [],
        difficulty: module.meta?.difficulty || "ROOKIE",
        slides: formattedSlides.length > 0 ? formattedSlides : [{ heading: "", content: "", mediaUrl: "", layout: "SPLIT_IMAGE_RIGHT", order: 0 }],
        quiz: formattedQuiz.length > 0 ? formattedQuiz : [{ question: "", options: ["", "", "", ""], correctIndex: 0, points: 10 }],
        passingPoints: module.assessment?.passingPoints || 0,
        isMandatory: module.settings?.isMandatory || false,
        headingFontSize: module.display?.headingFontSize || 32,
        contentFontSize: module.display?.contentFontSize || 16,
      });
    }
  }, [open, module, reset]);

  const handleAddTag = () => {
    const currentTags = tags || [];
    if (tagInput.trim() && !currentTags.includes(tagInput.trim())) {
      setValue("tags", [...currentTags, tagInput.trim()]);
      setTagInput("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    const currentTags = tags || [];
    setValue("tags", currentTags.filter(tag => tag !== tagToRemove));
  };

  const onSubmit = async (data: UpdateModuleFormData) => {
    if (!module) return;

    console.log("📤 Submitting updated module:", data);
    setLoading(true);
    setError("");

    try {
      // Calculate total points
      const totalPoints = data.quiz.reduce((sum, q) => sum + (q.points || 0), 0);
      
      if (data.passingPoints > totalPoints) {
        setError(`Passing points (${data.passingPoints}) cannot exceed total points (${totalPoints})`);
        setLoading(false);
        return;
      }

      const result = await updateTrainingModule(module._id, data);
      console.log("📥 Update result:", result);

      if (result.success) {
        alert("✅ Module updated successfully!");
        onOpenChange(false);
        router.refresh();
      } else {
        setError(result.message);
      }
    } catch (submitError: any) {
      console.error("❌ Update error:", submitError);
      setError(submitError.message || "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Training Module</DialogTitle>
          <DialogDescription>
            Modify the module content, slides, quiz questions, and settings
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {error && (
            <div className="p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg">
              {error}
            </div>
          )}

          {/* Basic Info */}
          <div className="space-y-4 p-4 border rounded-lg">
            <h3 className="font-semibold text-lg">Basic Information</h3>
            
            <div className="space-y-2">
              <Label htmlFor="title">Module Title *</Label>
              <Input {...register("title")} placeholder="Module title" />
              {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea {...register("description")} rows={3} />
              {errors.description && <p className="text-xs text-destructive">{errors.description.message}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Category *</Label>
                <select
                  {...register("category")}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                >
                  <option value="IT & Security">IT & Security</option>
                  <option value="Communication">Communication</option>
                  <option value="Management">Management</option>
                  <option value="HR">HR</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label>Difficulty *</Label>
                <select
                  {...register("difficulty")}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                >
                  <option value="ROOKIE">ROOKIE</option>
                  <option value="PRO">PRO</option>
                  <option value="LEGEND">LEGEND</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Tags</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Add a tag"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddTag())}
                />
                <Button type="button" onClick={handleAddTag}><Plus className="h-4 w-4" /></Button>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {tags && tags.length > 0 ? (
                  tags.map((tag, index) => (
                    <span key={index} className="flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-sm">
                      {tag}
                      <X className="h-3 w-3 cursor-pointer" onClick={() => handleRemoveTag(tag)} />
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-muted-foreground">No tags added yet</span>
                )}
              </div>
            </div>
          </div>

          {/* Slides */}
          <div className="space-y-4 p-4 border rounded-lg">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-lg">Content Slides</h3>
              <Button
                type="button"
                size="sm"
                onClick={() => appendSlide({ heading: "", content: "", mediaUrl: "", layout: "SPLIT_IMAGE_RIGHT", order: slideFields.length })}
              >
                <Plus className="mr-2 h-4 w-4" /> Add Slide
              </Button>
            </div>

            <div className="space-y-4 max-h-96 overflow-y-auto">
              {slideFields.map((field, index) => (
                <div key={field.id} className="border rounded-lg p-4 space-y-3 bg-muted/30">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Slide {index + 1}</span>
                    {slideFields.length > 1 && (
                      <Button type="button" variant="ghost" size="sm" onClick={() => removeSlide(index)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>Heading * (Max 10 words)</Label>
                    <Input {...register(`slides.${index}.heading`)} />
                    <p className="text-xs text-muted-foreground">
                      {watch(`slides.${index}.heading`)?.trim().split(/\s+/).filter(Boolean).length || 0} / 10 words
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label>Content * (Max 100 words)</Label>
                    <Textarea {...register(`slides.${index}.content`)} rows={3} />
                    <p className="text-xs text-muted-foreground">
                      {watch(`slides.${index}.content`)?.trim().split(/\s+/).filter(Boolean).length || 0} / 100 words
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label>Image URL</Label>
                    <Input {...register(`slides.${index}.mediaUrl`)} placeholder="https://example.com/image.jpg" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quiz */}
          <div className="space-y-4 p-4 border rounded-lg">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-lg">Quiz Questions</h3>
              <Button
                type="button"
                size="sm"
                onClick={() => appendQuiz({ question: "", options: ["", "", "", ""], correctIndex: 0, points: 10 })}
              >
                <Plus className="mr-2 h-4 w-4" /> Add Question
              </Button>
            </div>

            <div className="space-y-4 max-h-96 overflow-y-auto">
              {quizFields.map((field, index) => (
                <div key={field.id} className="border rounded-lg p-4 space-y-3 bg-muted/30">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Question {index + 1}</span>
                    {quizFields.length > 1 && (
                      <Button type="button" variant="ghost" size="sm" onClick={() => removeQuiz(index)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>Question *</Label>
                    <Textarea {...register(`quiz.${index}.question`)} rows={2} />
                  </div>

                  <div className="space-y-2">
                    <Label>Options *</Label>
                    {[0, 1, 2, 3].map((optionIdx) => (
                      <div key={optionIdx} className="flex gap-2 items-center">
                        <input
                          type="radio"
                          {...register(`quiz.${index}.correctIndex`, { valueAsNumber: true })}
                          value={optionIdx}
                          className="w-4 h-4"
                        />
                        <Input {...register(`quiz.${index}.options.${optionIdx}`)} placeholder={`Option ${String.fromCharCode(65 + optionIdx)}`} />
                      </div>
                    ))}
                  </div>

                  <div className="space-y-2">
                    <Label>Points *</Label>
                    <Input type="number" {...register(`quiz.${index}.points`, { valueAsNumber: true })} min="1" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Settings */}
          <div className="space-y-4 p-4 border rounded-lg">
            <h3 className="font-semibold text-lg">Settings</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Passing Points *</Label>
                <Input type="number" {...register("passingPoints", { valueAsNumber: true })} min="0" />
              </div>

              <div className="space-y-2">
                <Label>Heading Font Size (px)</Label>
                <Input type="number" {...register("headingFontSize", { valueAsNumber: true })} min="16" max="60" />
              </div>

              <div className="space-y-2">
                <Label>Content Font Size (px)</Label>
                <Input type="number" {...register("contentFontSize", { valueAsNumber: true })} min="12" max="32" />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input type="checkbox" {...register("isMandatory")} className="w-4 h-4" />
              <Label>Make this module mandatory</Label>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Update Module
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

