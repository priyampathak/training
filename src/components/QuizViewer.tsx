"use client";

import { useState } from "react";
import { Button } from "@/src/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card";
import { ChevronLeft, ChevronRight, Save, XCircle } from "lucide-react";
import { Badge } from "@/src/components/ui/badge";

interface QuizQuestion {
  _id?: string;
  question: string;
  options: string[];
  correctIndex: number;
  points: number;
}

interface QuizViewerProps {
  questions: QuizQuestion[];
  moduleTitle: string;
  totalPoints: number;
  passingPoints: number;
  onSaveAndEnd: (answers: Map<number, number>) => void;
  onEndWithoutSaving: () => void;
  headingFontSize: number;
  contentFontSize: number;
}

export function QuizViewer({
  questions,
  moduleTitle,
  totalPoints,
  passingPoints,
  onSaveAndEnd,
  onEndWithoutSaving,
  headingFontSize,
  contentFontSize,
}: QuizViewerProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Map<number, number>>(new Map());
  const [submitting, setSubmitting] = useState(false);

  const currentQuestion = questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === questions.length - 1;
  const isFirstQuestion = currentQuestionIndex === 0;

  const handleAnswerSelect = (optionIndex: number) => {
    const newAnswers = new Map(answers);
    newAnswers.set(currentQuestionIndex, optionIndex);
    setAnswers(newAnswers);
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleSaveAndEnd = async () => {
    if (answers.size === 0) {
      alert("Please answer at least one question before submitting.");
      return;
    }

    if (
      answers.size < questions.length &&
      !confirm(
        `You have only answered ${answers.size} out of ${questions.length} questions. Do you want to submit anyway?`
      )
    ) {
      return;
    }

    setSubmitting(true);
    await onSaveAndEnd(answers);
    setSubmitting(false);
  };

  const handleEndWithoutSaving = () => {
    if (
      confirm(
        "Are you sure you want to end the test without saving? All your answers will be lost."
      )
    ) {
      onEndWithoutSaving();
    }
  };

  const selectedAnswer = answers.get(currentQuestionIndex);
  const answeredCount = answers.size;

  return (
    <div className="flex h-[95vh]">
      {/* Left Sidebar - Orange */}
      <div className="w-80 bg-gradient-to-b from-orange-500 to-orange-600 text-white p-6 flex flex-col">
        <div className="mb-6">
          <h2 className="text-xl font-bold mb-2">Assessment</h2>
          <p className="text-sm text-orange-100">{moduleTitle}</p>
        </div>

        {/* Test Info */}
        <div className="space-y-3 mb-6">
          <div className="bg-white/10 p-3 rounded-lg">
            <p className="text-xs text-orange-100">Total Questions</p>
            <p className="text-2xl font-bold">{questions.length}</p>
          </div>
          <div className="bg-white/10 p-3 rounded-lg">
            <p className="text-xs text-orange-100">Total Points</p>
            <p className="text-2xl font-bold">{totalPoints}</p>
          </div>
          <div className="bg-white/10 p-3 rounded-lg">
            <p className="text-xs text-orange-100">Passing Points</p>
            <p className="text-2xl font-bold">{passingPoints}+</p>
          </div>
          <div className="bg-white/10 p-3 rounded-lg">
            <p className="text-xs text-orange-100">Answered</p>
            <p className="text-2xl font-bold">
              {answeredCount}/{questions.length}
            </p>
          </div>
        </div>

        {/* Question Progress */}
        <div
          className="flex-1 overflow-y-auto pr-2 mb-4"
          style={{ maxHeight: "calc(95vh - 550px)" }}
        >
          <p className="text-sm font-medium text-orange-100 mb-2">Progress</p>
          <div className="space-y-1">
            {questions.map((q, index) => (
              <button
                key={index}
                onClick={() => setCurrentQuestionIndex(index)}
                className={`w-full flex items-center gap-2 p-2 rounded transition-colors ${
                  index === currentQuestionIndex
                    ? "bg-white/20"
                    : answers.has(index)
                    ? "bg-white/10"
                    : ""
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    index === currentQuestionIndex
                      ? "bg-white text-orange-600"
                      : answers.has(index)
                      ? "bg-green-500 text-white"
                      : "bg-white/30 text-white"
                  }`}
                >
                  {answers.has(index) ? "✓" : index + 1}
                </div>
                <span className="text-sm truncate">Q{index + 1}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Navigation Controls */}
        <div className="space-y-2">
          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={handlePrevious}
              disabled={isFirstQuestion}
              className="flex-1"
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleNext}
              disabled={isLastQuestion}
              className="flex-1"
            >
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>

          <Button
            onClick={handleSaveAndEnd}
            disabled={submitting}
            className="w-full bg-green-600 hover:bg-green-700"
          >
            {submitting ? (
              "Submitting..."
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save and End Test
              </>
            )}
          </Button>

          <Button
            onClick={handleEndWithoutSaving}
            disabled={submitting}
            variant="destructive"
            className="w-full"
          >
            <XCircle className="h-4 w-4 mr-2" />
            End Test Without Saving
          </Button>

          <div className="text-center text-xs text-orange-100 mt-2">
            Question {currentQuestionIndex + 1} of {questions.length}
          </div>
        </div>
      </div>

      {/* Right Content Area - Quiz */}
      <div className="flex-1 overflow-y-auto bg-gradient-to-br from-gray-50 to-gray-100">
        {currentQuestion ? (
          <div className="px-12 py-24">
            {/* Question Header */}
            <div className="flex items-start justify-between mb-12">
              <Badge variant="outline" className="text-lg px-4 py-2">
                Question {currentQuestionIndex + 1}
              </Badge>
              <Badge variant="secondary" className="text-lg px-4 py-2">
                {currentQuestion.points} {currentQuestion.points === 1 ? "Point" : "Points"}
              </Badge>
            </div>

            {/* Question Text */}
            <h1
              className="font-bold text-gray-900 mb-12"
              style={{ fontSize: `${headingFontSize}px` }}
            >
              {currentQuestion.question}
            </h1>

            {/* Options */}
            <div className="space-y-4">
              {currentQuestion.options.map((option, index) => (
                <Card
                  key={index}
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    selectedAnswer === index
                      ? "border-2 border-primary bg-primary/5"
                      : "border hover:border-primary/50"
                  }`}
                  onClick={() => handleAnswerSelect(index)}
                >
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-4">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg ${
                          selectedAnswer === index
                            ? "bg-primary text-white"
                            : "bg-gray-200 text-gray-700"
                        }`}
                      >
                        {String.fromCharCode(65 + index)}
                      </div>
                      <span
                        className="text-gray-900"
                        style={{ fontSize: `${contentFontSize}px` }}
                      >
                        {option}
                      </span>
                    </CardTitle>
                  </CardHeader>
                </Card>
              ))}
            </div>

            {/* Hint */}
            <div className="mt-12 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                💡 <strong>Tip:</strong> You can navigate between questions using the
                Previous/Next buttons or by clicking on question numbers in the sidebar.
              </p>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-muted-foreground">No questions available</p>
          </div>
        )}
      </div>
    </div>
  );
}

