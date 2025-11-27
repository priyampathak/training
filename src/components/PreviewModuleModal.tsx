"use client";

import { useState, useEffect } from "react";
import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/src/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";
import {
  ChevronLeft,
  ChevronRight,
  X,
  ZoomIn,
  ZoomOut,
  Image as ImageIcon,
  Save,
  Loader2,
} from "lucide-react";
import { updateModuleDisplaySettings } from "@/src/actions/modules";

interface Slide {
  heading: string;
  content: string;
  mediaUrl?: string;
  layout: string;
  order: number;
}

interface QuizQuestion {
  question: string;
  options: string[];
  correctIndex: number;
  points: number;
}

interface ModuleData {
  _id: string;
  meta: {
    title: string;
    description: string;
    category: string;
    difficulty: string;
  };
  slides: Slide[];
  quiz: QuizQuestion[];
  assessment: {
    totalPoints: number;
    passingPoints: number;
    passingPercentage?: number;
  };
  display?: {
    headingFontSize: number;
    contentFontSize: number;
  };
}

interface PreviewModuleModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  module: ModuleData | null;
}

export function PreviewModuleModal({
  open,
  onOpenChange,
  module,
}: PreviewModuleModalProps) {
  const router = useRouter();
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [imageError, setImageError] = useState<{ [key: number]: boolean }>({});
  const [viewMode, setViewMode] = useState<'slides' | 'quiz'>('slides');
  const [savingFontSizes, setSavingFontSizes] = useState(false);
  
  // Use saved font sizes from DB or defaults
  const [headingFontSize, setHeadingFontSize] = useState(32);
  const [contentFontSize, setContentFontSize] = useState(18);
  
  // Load font sizes from module when it changes
  useEffect(() => {
    if (module?.display) {
      setHeadingFontSize(module.display.headingFontSize || 32);
      setContentFontSize(module.display.contentFontSize || 18);
    }
  }, [module]);

  // Update font sizes when module changes
  useEffect(() => {
    if (module?.display) {
      console.log('📐 Loading font sizes from DB:', module.display);
      setHeadingFontSize(module.display.headingFontSize);
      setContentFontSize(module.display.contentFontSize);
    } else {
      console.log('⚠️ No display settings found, using defaults');
      setHeadingFontSize(32);
      setContentFontSize(16);
    }
  }, [module]);

  // Reset image errors and view mode when module changes
  useEffect(() => {
    setImageError({});
    setCurrentSlideIndex(0);
    setViewMode('slides');
  }, [module, open]);

  if (!module || !module.slides || module.slides.length === 0) {
    return null;
  }

  const totalSlides = module.slides.length;
  const totalQuestions = module.quiz?.length || 0;
  const currentSlide = viewMode === 'slides' ? module.slides[currentSlideIndex] : null;

  const nextSlide = () => {
    if (viewMode === 'slides' && currentSlideIndex < totalSlides - 1) {
      setCurrentSlideIndex(currentSlideIndex + 1);
    } else if (viewMode === 'slides' && currentSlideIndex === totalSlides - 1 && totalQuestions > 0) {
      // Switch to quiz after last slide
      setViewMode('quiz');
      setCurrentSlideIndex(0);
    } else if (viewMode === 'quiz' && currentSlideIndex < totalQuestions - 1) {
      setCurrentSlideIndex(currentSlideIndex + 1);
    }
  };

  const prevSlide = () => {
    if (viewMode === 'quiz' && currentSlideIndex > 0) {
      setCurrentSlideIndex(currentSlideIndex - 1);
    } else if (viewMode === 'quiz' && currentSlideIndex === 0) {
      // Go back to last slide
      setViewMode('slides');
      setCurrentSlideIndex(totalSlides - 1);
    } else if (viewMode === 'slides' && currentSlideIndex > 0) {
      setCurrentSlideIndex(currentSlideIndex - 1);
    }
  };

  const handleImageError = (slideIndex: number) => {
    console.error('❌ Image failed to load for slide', slideIndex);
    setImageError(prev => ({ ...prev, [slideIndex]: true }));
  };

  const handleSaveFontSizes = async () => {
    if (!module) return;

    setSavingFontSizes(true);
    try {
      const result = await updateModuleDisplaySettings(
        module._id,
        headingFontSize,
        contentFontSize
      );

      if (result.success) {
        alert('✅ Font sizes saved successfully!');
        router.refresh();
      } else {
        alert(`❌ ${result.message}`);
      }
    } catch (error) {
      console.error('Error saving font sizes:', error);
      alert('❌ Failed to save font sizes');
    } finally {
      setSavingFontSizes(false);
    }
  };

  const increaseHeadingSize = () => {
    setHeadingFontSize((prev) => Math.min(prev + 2, 60));
  };

  const decreaseHeadingSize = () => {
    setHeadingFontSize((prev) => Math.max(prev - 2, 16));
  };

  const increaseContentSize = () => {
    setContentFontSize((prev) => Math.min(prev + 2, 32));
  };

  const decreaseContentSize = () => {
    setContentFontSize((prev) => Math.max(prev - 2, 12));
  };

  const resetSizes = () => {
    setHeadingFontSize(32);
    setContentFontSize(16);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] max-h-[95vh] p-0 overflow-hidden">
        {/* Header */}
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <DialogTitle className="text-xl font-bold">
                {module.meta.title}
              </DialogTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {module.meta.description}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        {/* Font Size Controls */}
        <div className="px-6 py-3 bg-muted/30 border-b">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-muted-foreground">
                Heading Size:
              </span>
              <Button
                size="sm"
                variant="outline"
                onClick={decreaseHeadingSize}
                disabled={headingFontSize <= 16}
              >
                <ZoomOut className="h-3 w-3" />
              </Button>
              <span className="text-xs font-mono w-8 text-center">
                {headingFontSize}px
              </span>
              <Button
                size="sm"
                variant="outline"
                onClick={increaseHeadingSize}
                disabled={headingFontSize >= 60}
              >
                <ZoomIn className="h-3 w-3" />
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-muted-foreground">
                Content Size:
              </span>
              <Button
                size="sm"
                variant="outline"
                onClick={decreaseContentSize}
                disabled={contentFontSize <= 12}
              >
                <ZoomOut className="h-3 w-3" />
              </Button>
              <span className="text-xs font-mono w-8 text-center">
                {contentFontSize}px
              </span>
              <Button
                size="sm"
                variant="outline"
                onClick={increaseContentSize}
                disabled={contentFontSize >= 32}
              >
                <ZoomIn className="h-3 w-3" />
              </Button>
            </div>

            <Button size="sm" variant="ghost" onClick={resetSizes}>
              Reset
            </Button>

            <Button 
              size="sm" 
              onClick={handleSaveFontSizes}
              disabled={savingFontSizes}
              className="ml-2"
            >
              {savingFontSizes ? (
                <>
                  <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-3 w-3" />
                  Save Font Sizes
                </>
              )}
            </Button>

            <div className="ml-auto text-xs text-muted-foreground">
              {viewMode === 'slides' ? (
                `Slide ${currentSlideIndex + 1} of ${totalSlides}`
              ) : (
                `Question ${currentSlideIndex + 1} of ${totalQuestions}`
              )}
            </div>
          </div>
        </div>

        {/* Slide Content */}
        <div className="flex-1 overflow-hidden" style={{ height: "60vh" }}>
          <div className="h-full flex">
            {/* Left Sidebar - Orange accent */}
            <div className="w-20 bg-gradient-to-b from-orange-400 to-orange-500 flex-shrink-0" />

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col p-8 bg-gradient-to-br from-gray-50 to-gray-100">
              {viewMode === 'slides' && currentSlide ? (
                <>
                  {/* Heading */}
                  <h1
                    className="font-bold text-gray-900 mb-6"
                    style={{ fontSize: `${headingFontSize}px`, lineHeight: "1.2" }}
                  >
                    {currentSlide.heading}
                  </h1>

                  {/* Content and Image Layout */}
                  <div className="flex-1 flex gap-8 overflow-hidden">
                    {/* Content Section */}
                    <div className="flex-1 overflow-y-auto">
                      <p
                        className="text-gray-700 whitespace-pre-wrap"
                        style={{
                          fontSize: `${contentFontSize}px`,
                          lineHeight: "1.6",
                        }}
                      >
                        {currentSlide.content}
                      </p>
                    </div>

                    {/* Image/Visual Section */}
                    <div className="w-[45%] flex items-center justify-center">
                      {currentSlide.mediaUrl && 
                       currentSlide.mediaUrl.trim() !== '' && 
                       !imageError[currentSlideIndex] ? (
                        <div className="relative w-full h-full rounded-lg overflow-hidden shadow-lg bg-white">
                          <img
                            src={currentSlide.mediaUrl}
                            alt={currentSlide.heading}
                            className="w-full h-full object-contain"
                            onError={() => handleImageError(currentSlideIndex)}
                          />
                        </div>
                      ) : (
                        <div className="relative w-full h-full rounded-lg overflow-hidden shadow-lg bg-gradient-to-br from-blue-100 via-blue-50 to-green-50">
                          {/* Show message if image failed to load */}
                          {imageError[currentSlideIndex] && currentSlide.mediaUrl && (
                            <div className="absolute top-4 left-4 right-4 bg-yellow-50 border border-yellow-200 rounded p-2 text-xs text-yellow-800 z-10">
                              ⚠️ Image URL is invalid or blocked. Please use a direct image link.
                            </div>
                          )}
                          
                          {/* Decorative clouds and landscape */}
                          <div className="absolute top-10 right-20 w-32 h-16 bg-white rounded-full opacity-80" />
                          <div className="absolute top-16 right-32 w-24 h-12 bg-white rounded-full opacity-60" />
                          <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-green-400 via-green-300 to-transparent">
                            <svg
                              className="w-full h-full"
                              viewBox="0 0 1200 400"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path
                                d="M0,200 Q300,150 600,200 T1200,200 L1200,400 L0,400 Z"
                                fill="rgba(132, 204, 22, 0.6)"
                              />
                              <path
                                d="M0,250 Q400,200 800,250 T1600,250 L1600,400 L0,400 Z"
                                fill="rgba(101, 163, 13, 0.8)"
                              />
                            </svg>
                          </div>
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="text-center">
                              <ImageIcon className="h-16 w-16 text-gray-300 mx-auto mb-2" />
                              {!currentSlide.mediaUrl && (
                                <p className="text-xs text-gray-400">No image provided</p>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              ) : (
                /* Quiz View - Fixed font sizes, not affected by controls */
                viewMode === 'quiz' && module.quiz && module.quiz[currentSlideIndex] && (
                  <div className="flex-1 flex flex-col overflow-hidden">
                    {/* Quiz Header - Fixed size */}
                    <div className="mb-6 pb-4 border-b">
                      <h1 className="text-2xl font-bold text-gray-900 mb-2">
                        MCQs
                      </h1>
                      <p className="text-sm text-gray-600">
                        Question {currentSlideIndex + 1} of {totalQuestions}
                      </p>
                    </div>

                    <div className="flex-1 overflow-y-auto space-y-6">
                      {/* Question Card */}
                      <div className="p-6 bg-white rounded-lg shadow-md border-l-4 border-blue-500">
                        <p className="text-sm font-medium text-gray-900 mb-3">
                          {module.quiz[currentSlideIndex].question}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-gray-600">
                          <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded font-medium">
                            {module.quiz[currentSlideIndex].points} Points
                          </span>
                        </div>
                      </div>

                      {/* Options */}
                      <div className="space-y-3">
                        {module.quiz[currentSlideIndex].options.map((option, idx) => {
                          const isCorrect = idx === module.quiz[currentSlideIndex].correctIndex;
                          return (
                            <div
                              key={idx}
                              className={`p-4 rounded-lg border-2 transition-all ${
                                isCorrect
                                  ? 'border-green-500 bg-green-50'
                                  : 'border-gray-200 bg-white hover:border-gray-300'
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <div
                                  className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                                    isCorrect
                                      ? 'bg-green-500 text-white'
                                      : 'bg-gray-200 text-gray-700'
                                  }`}
                                >
                                  {String.fromCharCode(65 + idx)}
                                </div>
                                <p className="flex-1 text-sm">
                                  {option}
                                </p>
                                {isCorrect && (
                                  <span className="text-green-600 font-semibold text-xs flex items-center gap-1">
                                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                    Correct Answer
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )
              )}
            </div>
          </div>
        </div>

        {/* Navigation Footer */}
        <div className="px-6 py-4 border-t bg-white">
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              onClick={prevSlide}
              disabled={viewMode === 'slides' && currentSlideIndex === 0}
            >
              <ChevronLeft className="mr-2 h-4 w-4" />
              Previous
            </Button>

            <div className="flex items-center gap-4">
              <div className="flex gap-2">
                {viewMode === 'slides' ? (
                  Array.from({ length: totalSlides }, (_, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        setViewMode('slides');
                        setCurrentSlideIndex(i);
                      }}
                      className={`w-2 h-2 rounded-full transition-colors ${
                        i === currentSlideIndex
                          ? "bg-primary w-8"
                          : "bg-gray-300 hover:bg-gray-400"
                      }`}
                      aria-label={`Go to slide ${i + 1}`}
                    />
                  ))
                ) : (
                  Array.from({ length: totalQuestions }, (_, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentSlideIndex(i)}
                      className={`w-2 h-2 rounded-full transition-colors ${
                        i === currentSlideIndex
                          ? "bg-primary w-8"
                          : "bg-gray-300 hover:bg-gray-400"
                      }`}
                      aria-label={`Go to question ${i + 1}`}
                    />
                  ))
                )}
              </div>
              
              {totalQuestions > 0 && (
                <div className="flex gap-2 ml-4 border-l pl-4">
                  <Button
                    size="sm"
                    variant={viewMode === 'slides' ? 'default' : 'outline'}
                    onClick={() => {
                      setViewMode('slides');
                      setCurrentSlideIndex(0);
                    }}
                  >
                    Slides
                  </Button>
                  <Button
                    size="sm"
                    variant={viewMode === 'quiz' ? 'default' : 'outline'}
                    onClick={() => {
                      setViewMode('quiz');
                      setCurrentSlideIndex(0);
                    }}
                  >
                    MCQs ({totalQuestions})
                  </Button>
                </div>
              )}
            </div>

            <Button
              variant="outline"
              onClick={nextSlide}
              disabled={
                (viewMode === 'slides' && currentSlideIndex === totalSlides - 1 && totalQuestions === 0) ||
                (viewMode === 'quiz' && currentSlideIndex === totalQuestions - 1)
              }
            >
              Next
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

