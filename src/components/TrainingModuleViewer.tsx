"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";
import { Button } from "@/src/components/ui/button";
import { ChevronLeft, ChevronRight, BookOpen } from "lucide-react";
import Image from "next/image";
import { QuizViewer } from "./QuizViewer";
import { TestResultModal } from "./TestResultModal";
import { submitQuiz, startModule } from "@/src/actions/quiz";

interface Slide {
  _id?: string;
  heading: string;
  content: string;
  mediaUrl?: string;
  layout: string;
  order: number;
}

interface Quiz {
  _id?: string;
  question: string;
  options: string[];
  correctIndex: number;
  points: number;
}

interface TrainingModuleViewerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  module: {
    _id: string;
    title: string;
    description: string;
    slides: Slide[];
    quiz?: Quiz[];
    totalPoints?: number;
    passingPoints?: number;
    display?: {
      headingFontSize: number;
      contentFontSize: number;
    };
  } | null;
  onStartTest?: () => void;
}

export function TrainingModuleViewer({
  open,
  onOpenChange,
  module,
  onStartTest,
}: TrainingModuleViewerProps) {
  const router = useRouter();
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [quizMode, setQuizMode] = useState(false);
  const [submittingQuiz, setSubmittingQuiz] = useState(false);
  const [showResultModal, setShowResultModal] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);

  if (!module) return null;

  const slides = module.slides || [];
  const currentSlide = slides[currentSlideIndex];
  const isLastSlide = currentSlideIndex === slides.length - 1;
  const isFirstSlide = currentSlideIndex === 0;

  // Use saved font sizes or defaults, then increase by 4 units
  const headingFontSize = (module.display?.headingFontSize || 32) + 4;
  const contentFontSize = (module.display?.contentFontSize || 16) + 4;

  const handleNext = () => {
    if (currentSlideIndex < slides.length - 1) {
      setCurrentSlideIndex(currentSlideIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentSlideIndex > 0) {
      setCurrentSlideIndex(currentSlideIndex - 1);
    }
  };

  const handleStartTest = async () => {
    // Mark module as started if not already
    await startModule(module._id);
    // Switch to quiz mode
    setQuizMode(true);
  };

  const handleQuizSubmit = async (answers: Map<number, number>) => {
    setSubmittingQuiz(true);
    
    // Convert Map to plain object for server action
    const answersObj: Record<number, number> = {};
    answers.forEach((value, key) => {
      answersObj[key] = value;
    });

    const result = await submitQuiz(module._id, answersObj);
    
    if (result.success && result.data) {
      // Store result and show modal
      setTestResult(result.data);
      setShowResultModal(true);
      setSubmittingQuiz(false);
    } else {
      alert(result.message || "Failed to submit test");
      setSubmittingQuiz(false);
    }
  };

  const handleResultModalClose = () => {
    setShowResultModal(false);
    setTestResult(null);
    handleClose();
    router.refresh();
  };

  const handleEndWithoutSaving = () => {
    handleClose();
  };

  const handleClose = () => {
    onOpenChange(false);
    setCurrentSlideIndex(0);
    setQuizMode(false);
    setSubmittingQuiz(false);
    setShowResultModal(false);
    setTestResult(null);
  };

  // If in quiz mode, show quiz viewer
  if (quizMode && module.quiz && module.quiz.length > 0) {
    return (
      <>
        <Dialog open={open} onOpenChange={handleClose}>
          <DialogContent className="max-w-7xl max-h-[95vh] p-0 gap-0">
            <QuizViewer
              questions={module.quiz}
              moduleTitle={module.title}
              totalPoints={module.totalPoints || 0}
              passingPoints={module.passingPoints || 0}
              onSaveAndEnd={handleQuizSubmit}
              onEndWithoutSaving={handleEndWithoutSaving}
              headingFontSize={headingFontSize}
              contentFontSize={contentFontSize}
            />
          </DialogContent>
        </Dialog>

        {/* Result Modal */}
        {testResult && (
          <TestResultModal
            open={showResultModal}
            onClose={handleResultModalClose}
            result={testResult}
          />
        )}
      </>
    );
  }

  // Otherwise show slides
  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-7xl max-h-[95vh] p-0 gap-0">
        <div className="flex h-[95vh]">
          {/* Left Sidebar - Orange */}
          <div className="w-80 bg-gradient-to-b from-orange-500 to-orange-600 text-white p-6 flex flex-col">
            <DialogHeader className="mb-6">
              <div className="flex items-center gap-2 mb-2">
                <BookOpen className="h-6 w-6" />
                <DialogTitle className="text-white text-xl">
                  Training Module
                </DialogTitle>
              </div>
              <DialogDescription className="text-orange-100">
                {module.title}
              </DialogDescription>
            </DialogHeader>

            {/* Slide Progress */}
            <div className="flex-1 overflow-y-auto pr-2" style={{ maxHeight: 'calc(95vh - 300px)' }}>
              <div className="space-y-2">
                <p className="text-sm font-medium text-orange-100">Progress</p>
                <div className="space-y-1">
                  {slides.map((_, index) => (
                    <div
                      key={index}
                      className={`flex items-center gap-2 p-2 rounded ${
                        index === currentSlideIndex
                          ? "bg-white/20"
                          : index < currentSlideIndex
                          ? "bg-white/10"
                          : ""
                      }`}
                    >
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                          index === currentSlideIndex
                            ? "bg-white text-orange-600"
                            : index < currentSlideIndex
                            ? "bg-green-500 text-white"
                            : "bg-white/30 text-white"
                        }`}
                      >
                        {index < currentSlideIndex ? "✓" : index + 1}
                      </div>
                      <span className="text-sm truncate">
                        Slide {index + 1}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Navigation Controls */}
            <div className="space-y-3 mt-4">
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handlePrevious}
                  disabled={isFirstSlide}
                  className="flex-1"
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Previous
                </Button>
                {!isLastSlide ? (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={handleNext}
                    className="flex-1"
                  >
                    Next
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                ) : (
                  <Button
                    variant="default"
                    size="sm"
                    onClick={handleStartTest}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                  >
                    Start Test
                  </Button>
                )}
              </div>
              <div className="text-center text-xs text-orange-100">
                Slide {currentSlideIndex + 1} of {slides.length}
              </div>
            </div>
          </div>

          {/* Right Content Area */}
          <div className="flex-1 overflow-y-auto bg-gradient-to-br from-gray-50 to-gray-100">
            {currentSlide ? (
              <div className="px-12 py-24">
                {/* Heading */}
                <h1
                  className="font-bold text-gray-900 mb-24"
                  style={{ fontSize: `${headingFontSize}px` }}
                >
                  {currentSlide.heading}
                </h1>

                {/* Content and Image Layout */}
                <div className="flex gap-8">
                  {/* Content - Left Side */}
                  <div className="flex-1">
                    <div
                      className="text-gray-700 leading-relaxed whitespace-pre-wrap"
                      style={{ fontSize: `${contentFontSize}px` }}
                    >
                      {currentSlide.content}
                    </div>
                  </div>

                  {/* Image/Visual - Right Side */}
                  <div className="flex-1">
                    {currentSlide.mediaUrl ? (
                      <div className="relative w-full h-96 rounded-lg overflow-hidden shadow-lg">
                        <Image
                          src={currentSlide.mediaUrl}
                          alt={currentSlide.heading}
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      </div>
                    ) : (
                      <div className="w-full h-96 rounded-lg bg-gradient-to-br from-orange-100 via-orange-50 to-yellow-50 flex items-center justify-center shadow-inner">
                        <div className="text-center text-orange-300">
                          <BookOpen className="h-24 w-24 mx-auto mb-4 opacity-40" />
                          <p className="text-lg font-medium">No Image</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-muted-foreground">No slides available</p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

