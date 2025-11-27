"use client";

import { useEffect, useState } from "react";
import { getStaffProgress } from "@/src/actions/progress";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/src/components/ui/table";
import {
  BookOpen,
  CheckCircle2,
  Clock,
  Target,
  Award,
  TrendingUp,
  Calendar,
  AlertCircle,
  Loader2,
  Trophy,
  BarChart3,
} from "lucide-react";
import { Badge } from "@/src/components/ui/badge";
import { Progress } from "@/src/components/ui/progress";

export default function ProgressPage() {
  const [loading, setLoading] = useState(true);
  const [progressData, setProgressData] = useState<any>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    loadProgress();
  }, []);

  const loadProgress = async () => {
    setLoading(true);
    try {
      const result = await getStaffProgress();
      if (result.success && result.data) {
        setProgressData(result.data);
      } else {
        setError(result.message || "Failed to load progress");
      }
    } catch (err) {
      console.error("Error loading progress:", err);
      setError("An error occurred while loading progress");
    } finally {
      setLoading(false);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "ROOKIE":
        return "bg-green-100 text-green-700 border-green-200";
      case "PRO":
        return "bg-blue-100 text-blue-700 border-blue-200";
      case "LEGEND":
        return "bg-purple-100 text-purple-700 border-purple-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return (
          <Badge variant="default" className="bg-green-600">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Completed
          </Badge>
        );
      case "IN_PROGRESS":
        return (
          <Badge variant="default" className="bg-blue-600">
            <Clock className="h-3 w-3 mr-1" />
            In Progress
          </Badge>
        );
      case "NOT_STARTED":
        return (
          <Badge variant="outline" className="bg-slate-50">
            Not Started
          </Badge>
        );
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const formatDate = (date: string | null) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !progressData) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Progress</h1>
          <p className="text-muted-foreground mt-2">
            Failed to load progress. Please try again.
          </p>
        </div>
        <Card>
          <CardContent className="pt-6">
            <p className="text-destructive">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { user, summary, progress } = progressData;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">My Training Progress</h1>
        <p className="text-muted-foreground mt-2">
          Track your learning journey and performance across all training modules
        </p>
      </div>

      {/* User Info Card */}
      <Card className="bg-gradient-to-r from-primary/5 to-blue-500/5 border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-primary" />
            {user.name}
          </CardTitle>
          <CardDescription>{user.email} · {user.company}</CardDescription>
        </CardHeader>
      </Card>

      {/* Summary Statistics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Modules</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalModules}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Available to you
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {summary.completedModules}
            </div>
            <Progress
              value={summary.completionRate}
              className="mt-2 h-2"
            />
            <p className="text-xs text-muted-foreground mt-1">
              {summary.completionRate}% completion rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Score</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {summary.averageScore}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Pass Rate: {summary.passRate}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Attempts</CardTitle>
            <BarChart3 className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {summary.totalAttempts}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Across all modules
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Additional Statistics */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Status Breakdown</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Not Started:</span>
              <span className="font-medium">{summary.notStartedModules}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">In Progress:</span>
              <span className="font-medium text-blue-600">
                {summary.inProgressModules}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Completed:</span>
              <span className="font-medium text-green-600">
                {summary.completedModules}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Performance Summary
            </CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Passed:</span>
              <span className="font-medium text-green-600">
                {summary.passedModules}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Failed:</span>
              <span className="font-medium text-red-600">
                {summary.failedModules}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Total Score:</span>
              <span className="font-medium">
                {summary.totalScore}/{summary.totalPossiblePoints}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Mandatory Modules
            </CardTitle>
            <AlertCircle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-2xl font-bold">
              {summary.completedMandatory}/{summary.mandatoryModules}
            </div>
            <Progress
              value={summary.mandatoryCompletionRate}
              className="h-2"
            />
            <p className="text-xs text-muted-foreground">
              {summary.mandatoryCompletionRate}% of required modules completed
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Progress Table */}
      <Card>
        <CardHeader>
          <CardTitle>Detailed Module Progress</CardTitle>
          <CardDescription>
            Complete breakdown of your progress on each training module
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Module Title</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Difficulty</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="text-center">Score</TableHead>
                <TableHead className="text-center">Percentage</TableHead>
                <TableHead className="text-center">Result</TableHead>
                <TableHead className="text-center">Attempts</TableHead>
                <TableHead>Started</TableHead>
                <TableHead>Completed</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {progress.map((module: any) => (
                <TableRow key={module.moduleId} className="hover:bg-muted/50">
                  {/* Module Title */}
                  <TableCell className="font-medium max-w-xs">
                    <div className="flex flex-col gap-1">
                      <span className="line-clamp-1">{module.moduleTitle}</span>
                      {module.isMandatory && (
                        <Badge variant="destructive" className="w-fit text-xs">
                          <AlertCircle className="h-2 w-2 mr-1" />
                          Required
                        </Badge>
                      )}
                    </div>
                  </TableCell>

                  {/* Category */}
                  <TableCell>
                    <Badge variant="outline" className="text-xs">
                      {module.category}
                    </Badge>
                  </TableCell>

                  {/* Difficulty */}
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={`text-xs ${getDifficultyColor(
                        module.difficulty
                      )}`}
                    >
                      {module.difficulty}
                    </Badge>
                  </TableCell>

                  {/* Type */}
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={`text-xs ${
                        module.isGlobal ? "bg-blue-50" : "bg-primary/5"
                      }`}
                    >
                      {module.isGlobal ? "Global" : "Company"}
                    </Badge>
                  </TableCell>

                  {/* Status */}
                  <TableCell className="text-center">
                    {getStatusBadge(module.status)}
                  </TableCell>

                  {/* Score */}
                  <TableCell className="text-center">
                    {module.status === "COMPLETED" ? (
                      <span className="font-medium">
                        {module.score}/{module.totalPoints}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>

                  {/* Percentage */}
                  <TableCell className="text-center">
                    {module.status === "COMPLETED" ? (
                      <Badge
                        variant="outline"
                        className={
                          module.isPassed
                            ? "bg-green-50 text-green-700"
                            : "bg-red-50 text-red-700"
                        }
                      >
                        {module.percentage}%
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>

                  {/* Result */}
                  <TableCell className="text-center">
                    {module.status === "COMPLETED" ? (
                      module.isPassed ? (
                        <CheckCircle2 className="h-5 w-5 text-green-600 mx-auto" />
                      ) : (
                        <AlertCircle className="h-5 w-5 text-red-600 mx-auto" />
                      )
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>

                  {/* Attempts */}
                  <TableCell className="text-center">
                    <span className="text-sm">{module.attemptCount}</span>
                  </TableCell>

                  {/* Started */}
                  <TableCell>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      {formatDate(module.startedAt)}
                    </div>
                  </TableCell>

                  {/* Completed */}
                  <TableCell>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      {formatDate(module.completedAt)}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

