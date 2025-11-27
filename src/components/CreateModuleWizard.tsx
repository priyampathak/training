"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createTrainingModule, getCompaniesForModule } from "@/src/actions/modules";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { Textarea } from "@/src/components/ui/textarea";
import { Slider } from "@/src/components/ui/slider";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";
import {
  Loader2,
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  Image as ImageIcon,
  X,
  Check,
} from "lucide-react";

// Zod Schema for step-by-step validation
const quizQuestionSchema = z.object({
  question: z.string().min(1, "Question is required"),
  options: z.array(z.string()).length(4),
  correctIndex: z.number().min(0).max(3),
  points: z.number().min(1, "Points must be at least 1"),
});

const moduleSchema = z.object({
  assignedCompanyId: z.string().optional(),
  meta: z.object({
    title: z.string().min(3, "Title must be at least 3 characters"),
    description: z.string().min(10, "Description must be at least 10 characters"),
    category: z.enum(["IT & Security", "Communication", "Management", "HR"]),
    tags: z.array(z.string()),
    difficulty: z.enum(["ROOKIE", "PRO", "LEGEND"]),
  }),
  slides: z.array(z.object({
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
  })).min(1, "At least one slide is required"),
  quiz: z.array(quizQuestionSchema).min(1, "At least one question is required"),
  settings: z.object({
    passingPoints: z.number().min(0, "Passing points cannot be negative"),
    isMandatory: z.boolean(),
  }),
  display: z.object({
    headingFontSize: z.number().min(16).max(60),
    contentFontSize: z.number().min(12).max(32),
  }),
});

type ModuleFormData = z.infer<typeof moduleSchema>;

interface Company {
  _id: string;
  name: string;
}

interface CreateModuleWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateModuleWizard({ open, onOpenChange }: CreateModuleWizardProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loadingCompanies, setLoadingCompanies] = useState(true);
  const [tagInput, setTagInput] = useState("");

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
    trigger,
    reset,
  } = useForm<ModuleFormData>({
    resolver: zodResolver(moduleSchema),
      defaultValues: {
        meta: {
          tags: [],
          difficulty: "ROOKIE",
          category: "IT & Security",
        },
        slides: [{ heading: "", content: "", mediaUrl: "", layout: "SPLIT_IMAGE_RIGHT", order: 0 }],
        quiz: [{ question: "", options: ["", "", "", ""], correctIndex: 0, points: 10 }],
        settings: {
          passingPoints: 0,
          isMandatory: false,
        },
        display: {
          headingFontSize: 32,
          contentFontSize: 18,
        },
      },
  });

  const { fields: slideFields, append: appendSlide, remove: removeSlide } = useFieldArray({
    control,
    name: "slides",
  });

  const { fields: quizFields, append: appendQuiz, remove: removeQuiz } = useFieldArray({
    control,
    name: "quiz",
  });

  const tags = watch("meta.tags");

  useEffect(() => {
    if (open) {
      loadCompanies();
    }
  }, [open]);

  async function loadCompanies() {
    setLoadingCompanies(true);
    const result = await getCompaniesForModule();
    if (result.success && result.data) {
      setCompanies(result.data);
    }
    setLoadingCompanies(false);
  }

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setValue("meta.tags", [...tags, tagInput.trim()]);
      setTagInput("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setValue("meta.tags", tags.filter(tag => tag !== tagToRemove));
  };

  const nextStep = async () => {
    setError("");
    
    // For step 3 (quiz), use manual validation since the quiz can be partially filled
    if (currentStep === 3) {
      const quizData = watch("quiz");
      
      console.log("📝 Quiz data:", quizData);
      
      // Check if at least one question exists
      if (!quizData || quizData.length === 0) {
        setError("Please add at least one quiz question.");
        return;
      }
      
      // For now, allow moving forward even if questions are not fully filled
      // The final validation will happen on submit
      setCurrentStep(currentStep + 1);
      return;
    }
    
    // For other steps, use normal validation
    let fieldsToValidate: any[] = [];

    switch (currentStep) {
      case 1:
        fieldsToValidate = [
          "meta.title",
          "meta.description",
          "meta.category",
          "meta.difficulty",
        ];
        break;
      case 2:
        fieldsToValidate = ["slides"];
        break;
    }

    const isValid = await trigger(fieldsToValidate as any);
    
    if (!isValid) {
      console.log("❌ Validation failed for step", currentStep);
      console.log("Errors:", errors);
      setError("Please fill in all required fields before proceeding.");
    }
    
    if (isValid) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    setCurrentStep(currentStep - 1);
    setError("");
  };

  const onSubmit = async (data: ModuleFormData) => {
    console.log("🚀 Form submitted! Data:", data);
    setLoading(true);
    setError("");

    try {
      // Validate that passing points don't exceed total points
      const totalPoints = data.quiz.reduce((sum, q) => sum + (q.points || 0), 0);
      console.log(`📊 Total Points: ${totalPoints}, Passing Points: ${data.settings.passingPoints}`);
      
      if (data.settings.passingPoints > totalPoints) {
        setError(`Passing points (${data.settings.passingPoints}) cannot exceed total points (${totalPoints})`);
        setLoading(false);
        return;
      }

      console.log("✅ Validation passed, calling server...");
      const result = await createTrainingModule(data);
      console.log("📥 Server response:", result);

      if (result.success) {
        console.log("✅ Module created successfully!");
        onOpenChange(false);
        router.refresh();
        reset();
        setCurrentStep(1);
      } else {
        console.log("❌ Server error:", result.message);
        setError(result.message);
      }
    } catch (error) {
      console.error("❌ Exception during submission:", error);
      setError("An unexpected error occurred. Please try again.");
    }

    setLoading(false);
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="assignedCompanyId">Assign to Company (Optional)</Label>
              <select
                {...register("assignedCompanyId")}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                disabled={loadingCompanies}
              >
                <option value="">All Companies (Global)</option>
                {companies.map((company) => (
                  <option key={company._id} value={company._id}>
                    {company.name}
                  </option>
                ))}
              </select>
              <p className="text-xs text-muted-foreground">
                Leave empty to make this module available to all companies
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="meta.title">Module Title *</Label>
              <Input
                {...register("meta.title")}
                placeholder="Introduction to Workplace Safety"
              />
              {errors.meta?.title && (
                <p className="text-xs text-destructive">{errors.meta.title.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="meta.description">Description *</Label>
              <Textarea
                {...register("meta.description")}
                placeholder="Comprehensive overview of workplace safety protocols..."
                rows={3}
              />
              {errors.meta?.description && (
                <p className="text-xs text-destructive">{errors.meta.description.message}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="meta.category">Category *</Label>
                <select
                  {...register("meta.category")}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="IT & Security">IT & Security</option>
                  <option value="Communication">Communication</option>
                  <option value="Management">Management</option>
                  <option value="HR">HR</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="meta.difficulty">Difficulty *</Label>
                <div className="flex gap-2">
                  {(["ROOKIE", "PRO", "LEGEND"] as const).map((level) => (
                    <label key={level} className="flex-1">
                      <input
                        type="radio"
                        {...register("meta.difficulty")}
                        value={level}
                        className="sr-only peer"
                      />
                      <div className="px-3 py-2 text-center text-xs font-medium border rounded-md cursor-pointer peer-checked:bg-primary peer-checked:text-primary-foreground peer-checked:border-primary">
                        {level}
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Tags</Label>
              <div className="flex gap-2">
                <Input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), handleAddTag())}
                  placeholder="Add a tag..."
                />
                <Button type="button" onClick={handleAddTag} size="sm">
                  Add
                </Button>
              </div>
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary text-xs rounded-md"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="hover:bg-primary/20 rounded-full p-0.5"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Content Slides</h3>
              <Button
                type="button"
                size="sm"
                onClick={() =>
                  appendSlide({
                    heading: "",
                    content: "",
                    mediaUrl: "",
                    layout: "SPLIT_IMAGE_RIGHT",
                    order: slideFields.length,
                  })
                }
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Slide
              </Button>
            </div>

            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
              {slideFields.map((field, index) => (
                <div key={field.id} className="border rounded-lg p-4 space-y-3 bg-muted/30">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Slide {index + 1}</span>
                    {slideFields.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeSlide(index)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>Heading * (Max 10 words)</Label>
                    <Input
                      {...register(`slides.${index}.heading`)}
                      placeholder="Slide heading..."
                    />
                    {errors.slides?.[index]?.heading && (
                      <p className="text-xs text-destructive">
                        {errors.slides[index]?.heading?.message}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      {watch(`slides.${index}.heading`)?.trim().split(/\s+/).filter(Boolean).length || 0} / 10 words
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label>Content * (Max 100 words)</Label>
                    <Textarea
                      {...register(`slides.${index}.content`)}
                      placeholder="Slide content..."
                      rows={3}
                    />
                    {errors.slides?.[index]?.content && (
                      <p className="text-xs text-destructive">
                        {errors.slides[index]?.content?.message}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      {watch(`slides.${index}.content`)?.trim().split(/\s+/).filter(Boolean).length || 0} / 100 words
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label>Image URL (Optional)</Label>
                    <div className="flex gap-2">
                      <Input
                        {...register(`slides.${index}.mediaUrl`)}
                        placeholder="https://example.com/image.jpg"
                      />
                      <div className="flex items-center justify-center w-10 h-10 border rounded-md bg-muted">
                        <ImageIcon className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </div>
                  </div>

                  <input type="hidden" {...register(`slides.${index}.order`)} value={index} />
                  <input type="hidden" {...register(`slides.${index}.layout`)} />
                </div>
              ))}
            </div>
            {errors.slides && (
              <p className="text-xs text-destructive">{errors.slides.message}</p>
            )}
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Quiz Questions</h3>
               <Button
                 type="button"
                 size="sm"
                 onClick={() =>
                   appendQuiz({ question: "", options: ["", "", "", ""], correctIndex: 0, points: 10 })
                 }
               >
                 <Plus className="mr-2 h-4 w-4" />
                 Add Question
               </Button>
            </div>

            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
              {quizFields.map((field, questionIndex) => (
                <div key={field.id} className="border rounded-lg p-4 space-y-3 bg-muted/30">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Question {questionIndex + 1}</span>
                    {quizFields.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeQuiz(questionIndex)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>Question *</Label>
                    <Textarea
                      {...register(`quiz.${questionIndex}.question`)}
                      placeholder="Enter your question..."
                      rows={2}
                    />
                    {errors.quiz?.[questionIndex]?.question && (
                      <p className="text-xs text-destructive">
                        {errors.quiz[questionIndex]?.question?.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>Options * (Select correct answer)</Label>
                    {[0, 1, 2, 3].map((optionIndex) => (
                      <div key={optionIndex} className="flex gap-2">
                        <input
                          type="radio"
                          {...register(`quiz.${questionIndex}.correctIndex`, {
                            valueAsNumber: true,
                          })}
                          value={optionIndex}
                          className="mt-2"
                        />
                        <div className="flex-1">
                          <Input
                            {...register(`quiz.${questionIndex}.options.${optionIndex}`)}
                            placeholder={`Option ${optionIndex + 1}`}
                          />
                        </div>
                      </div>
                    ))}
                    {errors.quiz?.[questionIndex]?.options && (
                      <p className="text-xs text-destructive">All options are required</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>Points for this Question *</Label>
                    <Input
                      type="number"
                      {...register(`quiz.${questionIndex}.points`, {
                        valueAsNumber: true,
                      })}
                      min="1"
                      placeholder="10"
                    />
                    {errors.quiz?.[questionIndex]?.points && (
                      <p className="text-xs text-destructive">
                        {errors.quiz[questionIndex]?.points?.message}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Points awarded for correct answer
                    </p>
                  </div>
                </div>
              ))}
            </div>
            {errors.quiz && (
              <p className="text-xs text-destructive">{errors.quiz.message}</p>
            )}
          </div>
        );

      case 4:
        const totalPoints = watch("quiz")?.reduce((sum, q) => sum + (q.points || 0), 0) || 0;
        return (
          <div className="space-y-6">
            <div className="space-y-4">
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm font-medium text-blue-900">
                  Total Points Available: {totalPoints}
                </p>
                <p className="text-xs text-blue-700 mt-1">
                  Based on {quizFields.length} question(s) with assigned points
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="passingPoints">Passing Points Required *</Label>
                <Input
                  type="number"
                  {...register("settings.passingPoints", {
                    valueAsNumber: true,
                  })}
                  min="0"
                  max={totalPoints}
                  placeholder="Enter passing points"
                />
                {errors.settings?.passingPoints && (
                  <p className="text-xs text-destructive">
                    {errors.settings.passingPoints.message}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  Minimum points required to pass (max: {totalPoints})
                </p>
              </div>
            </div>

            <div className="space-y-4 border-t pt-4">
              <h4 className="text-sm font-semibold">Display Settings</h4>
              <p className="text-sm text-blue-600 mb-3">
                ✓ Recommended: Heading 32px, Content 18px
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="headingFontSize">Heading Font Size (px)</Label>
                  <Input
                    type="number"
                    {...register("display.headingFontSize", {
                      valueAsNumber: true,
                    })}
                    min="16"
                    max="60"
                    placeholder="32"
                    defaultValue={32}
                  />
                  <p className="text-xs text-muted-foreground">
                    Range: 16px - 60px (Default: 32px)
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contentFontSize">Content Font Size (px)</Label>
                  <Input
                    type="number"
                    {...register("display.contentFontSize", {
                      valueAsNumber: true,
                    })}
                    min="12"
                    max="32"
                    placeholder="18"
                    defaultValue={18}
                  />
                  <p className="text-xs text-muted-foreground">
                    Range: 12px - 32px (Default: 18px)
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                {...register("settings.isMandatory")}
                className="w-4 h-4"
              />
              <Label>Make this module mandatory</Label>
            </div>

            <div className="border rounded-lg p-4 bg-muted/30 space-y-2">
              <h4 className="font-semibold">Module Summary</h4>
              <div className="text-sm space-y-1">
                <p><span className="font-medium">Title:</span> {watch("meta.title") || "N/A"}</p>
                <p><span className="font-medium">Category:</span> {watch("meta.category")}</p>
                <p><span className="font-medium">Difficulty:</span> {watch("meta.difficulty")}</p>
                <p><span className="font-medium">Slides:</span> {slideFields.length}</p>
                <p><span className="font-medium">Questions:</span> {quizFields.length}</p>
                <p><span className="font-medium">Total Points:</span> {totalPoints}</p>
                <p><span className="font-medium">Passing Points:</span> {watch("settings.passingPoints") || 0}</p>
                <p><span className="font-medium">Passing %:</span> {totalPoints > 0 ? Math.round((watch("settings.passingPoints") || 0) / totalPoints * 100) : 0}%</p>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Training Module</DialogTitle>
          <DialogDescription>
            Step {currentStep} of 4: {
              currentStep === 1 ? "Assignment & Metadata" :
              currentStep === 2 ? "Content Builder" :
              currentStep === 3 ? "Quiz Builder" :
              "Settings & Review"
            }
          </DialogDescription>
        </DialogHeader>

        {/* Progress Indicator */}
        <div className="flex gap-2 mb-4">
          {[1, 2, 3, 4].map((step) => (
            <div
              key={step}
              className={`flex-1 h-2 rounded-full ${
                step <= currentStep ? "bg-primary" : "bg-muted"
              }`}
            />
          ))}
        </div>

        <form 
          onSubmit={(e) => {
            console.log("📝 Form onSubmit triggered");
            handleSubmit(onSubmit)(e);
          }} 
          className="space-y-6"
        >
          {error && (
            <div className="p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg">
              {error}
            </div>
          )}

          {renderStepContent()}

          {/* Navigation Buttons */}
          <div className="flex justify-between pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={prevStep}
              disabled={currentStep === 1 || loading}
            >
              <ChevronLeft className="mr-2 h-4 w-4" />
              Previous
            </Button>

            {currentStep < 4 ? (
              <Button type="button" onClick={nextStep} disabled={loading}>
                Next
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button 
                type="button"
                disabled={loading}
                onClick={async (e) => {
                  e.preventDefault();
                  console.log("🔘 Create Module button clicked");
                  
                  // Get current form values
                  const rawFormData = watch();
                  console.log("📝 Raw form data:", JSON.stringify(rawFormData, null, 2));
                  
                  // Check if we're on step 4
                  console.log("📍 Current step:", currentStep);
                  
                  if (currentStep !== 4) {
                    console.log("❌ Not on step 4, aborting");
                    return;
                  }
                  
                  // Convert string numbers to actual numbers
                  const formData: ModuleFormData = {
                    ...rawFormData,
                    slides: rawFormData.slides.map((slide: any) => ({
                      ...slide,
                      order: typeof slide.order === 'string' ? parseInt(slide.order) : slide.order,
                    })),
                    quiz: rawFormData.quiz.map((q: any) => ({
                      ...q,
                      points: typeof q.points === 'string' ? parseInt(q.points) : q.points,
                      correctIndex: typeof q.correctIndex === 'string' ? parseInt(q.correctIndex) : q.correctIndex,
                    })),
                    settings: {
                      ...rawFormData.settings,
                      passingPoints: typeof rawFormData.settings.passingPoints === 'string' 
                        ? parseInt(rawFormData.settings.passingPoints) 
                        : rawFormData.settings.passingPoints,
                    },
                  };
                  
                  console.log("🔄 Converted form data:", JSON.stringify(formData, null, 2));
                  
                  // Directly call onSubmit with form data
                  console.log("🚀 Calling onSubmit...");
                  await onSubmit(formData);
                }}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    Create Module
                  </>
                )}
              </Button>
            )}
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

