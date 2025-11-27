"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";
import { Button } from "@/src/components/ui/button";
import { CheckCircle2, XCircle, TrendingUp, Award } from "lucide-react";

interface TestResultModalProps {
  open: boolean;
  onClose: () => void;
  result: {
    score: number;
    totalPoints: number;
    percentage: number;
    isPassed: boolean;
    correctAnswers: number;
    totalQuestions: number;
  };
}

export function TestResultModal({ open, onClose, result }: TestResultModalProps) {
  const { score, totalPoints, percentage, isPassed, correctAnswers, totalQuestions } = result;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl">
            {isPassed ? "🎉 Congratulations!" : "Test Completed"}
          </DialogTitle>
        </DialogHeader>

        <div className="py-6">
          {/* Pass/Fail Status */}
          <div className="flex justify-center mb-6">
            {isPassed ? (
              <div className="flex flex-col items-center">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-3">
                  <CheckCircle2 className="w-12 h-12 text-green-600" />
                </div>
                <p className="text-xl font-semibold text-green-600">You Passed!</p>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-3">
                  <XCircle className="w-12 h-12 text-red-600" />
                </div>
                <p className="text-xl font-semibold text-red-600">Not Passed</p>
              </div>
            )}
          </div>

          {/* Success Message */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-center text-blue-800 font-medium">
              ✅ Test Submitted Successfully
            </p>
          </div>

          {/* Results Grid */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            {/* Score Card */}
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Award className="w-5 h-5 text-purple-600" />
                <p className="text-sm font-medium text-purple-700">Score</p>
              </div>
              <p className="text-2xl font-bold text-purple-900">
                {score}/{totalPoints}
              </p>
              <p className="text-xs text-purple-600 mt-1">Points</p>
            </div>

            {/* Percentage Card */}
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-5 h-5 text-blue-600" />
                <p className="text-sm font-medium text-blue-700">Percentage</p>
              </div>
              <p className="text-2xl font-bold text-blue-900">{percentage}%</p>
              <p className="text-xs text-blue-600 mt-1">Score</p>
            </div>

            {/* Correct Answers Card */}
            <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
                <p className="text-sm font-medium text-green-700">Correct</p>
              </div>
              <p className="text-2xl font-bold text-green-900">
                {correctAnswers}/{totalQuestions}
              </p>
              <p className="text-xs text-green-600 mt-1">Questions</p>
            </div>

            {/* Accuracy Card */}
            <div className="bg-gradient-to-br from-orange-50 to-orange-100 border border-orange-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Award className="w-5 h-5 text-orange-600" />
                <p className="text-sm font-medium text-orange-700">Accuracy</p>
              </div>
              <p className="text-2xl font-bold text-orange-900">
                {Math.round((correctAnswers / totalQuestions) * 100)}%
              </p>
              <p className="text-xs text-orange-600 mt-1">Rate</p>
            </div>
          </div>

          {/* Message */}
          <div className={`rounded-lg p-4 ${isPassed ? "bg-green-50" : "bg-yellow-50"}`}>
            <p className={`text-sm text-center ${isPassed ? "text-green-800" : "text-yellow-800"}`}>
              {isPassed
                ? "Great job! You have successfully completed this training module."
                : "Keep learning! You can retake this test to improve your score."}
            </p>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex justify-center">
          <Button onClick={onClose} size="lg" className="px-8">
            {isPassed ? "Continue Learning" : "Review & Try Again"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

