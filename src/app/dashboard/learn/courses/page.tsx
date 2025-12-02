"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getAvailableCourses } from "@/src/actions/courses";
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
  Clock,
  Target,
  Award,
  PlayCircle,
  CheckCircle2,
  Building2,
  Globe,
  AlertCircle,
  Brain,
  Loader2,
} from "lucide-react";
import { Badge } from "@/src/components/ui/badge";
import { Button } from "@/src/components/ui/button";
import { TrainingModuleViewer } from "@/src/components/TrainingModuleViewer";

export default function CoursesPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [companyModules, setCompanyModules] = useState<any[]>([]);
  const [globalModules, setGlobalModules] = useState<any[]>([]);
  const [companyName, setCompanyName] = useState("");
  const [error, setError] = useState("");

  // Modal state
  const [viewerOpen, setViewerOpen] = useState(false);
  const [selectedModule, setSelectedModule] = useState<any>(null);

  // Combine all modules for table display and sort by creation date (newest first)
  const allModules = [
    ...companyModules.map((m) => ({ ...m, type: "company" })),
    ...globalModules.map((m) => ({ ...m, type: "global" })),
  ].sort((a, b) => {
    // Sort by createdAt date, newest first
    const dateA = new Date(a.createdAt || 0).getTime();
    const dateB = new Date(b.createdAt || 0).getTime();
    return dateB - dateA; // Descending order (newest first)
  });

  useEffect(() => {
    loadCourses();
  }, []);

  const loadCourses = async () => {
    setLoading(true);
    try {
      const result = await getAvailableCourses();
      if (result.success && result.data) {
        setCompanyModules(result.data.companyModules);
        setGlobalModules(result.data.globalModules);
        setCompanyName(result.data.companyName || "");
      } else {
        setError(result.message || "Failed to load courses");
      }
    } catch (err) {
      console.error("Error loading courses:", err);
      setError("An error occurred while loading courses");
    } finally {
      setLoading(false);
    }
  };

  const handleStartTraining = (module: any) => {
    setSelectedModule(module);
    setViewerOpen(true);
  };

  const handleStartTest = () => {
    if (selectedModule) {
      router.push(`/dashboard/learn/module/${selectedModule._id}/test`);
    }
  };


  const getStatusBadge = (progress: any) => {
    if (!progress) {
      return (
        <Badge variant="outline" className="bg-slate-50">
          Not Started
        </Badge>
      );
    }

    switch (progress.status) {
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
      case "FAILED":
        return <Badge variant="destructive">Failed</Badge>;
      default:
        return (
          <Badge variant="outline" className="bg-slate-50">
            Not Started
          </Badge>
        );
    }
  };

  const getButtonText = (progress: any) => {
    if (!progress) return "Start Training";

    switch (progress.status) {
      case "COMPLETED":
        return "Review";
      case "IN_PROGRESS":
        return "Continue";
      default:
        return "Start";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Available Courses</h1>
          <p className="text-muted-foreground mt-2">
            Failed to load courses. Please try again.
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

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Training Courses</h1>
        <p className="text-muted-foreground mt-2">
          Browse and start your training modules
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {companyName ? "Company Modules" : "Available Modules"}
            </CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{companyModules.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {companyName
                ? `Exclusive for ${companyName}`
                : "No company assigned"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Global Modules</CardTitle>
            <Globe className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{globalModules.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Available to all companies
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Courses</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {companyModules.length + globalModules.length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Ready to learn</p>
          </CardContent>
        </Card>
      </div>

      {/* All Training Modules Table */}
      {allModules.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>All Training Modules</CardTitle>
            <CardDescription>
              Complete list of company-specific and global training modules
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Module Title</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-center">Slides</TableHead>
                  <TableHead className="text-center">Questions</TableHead>
                  <TableHead className="text-center">Total Points</TableHead>
                  <TableHead className="text-center">Passing Points</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-center">Your Score</TableHead>
                  <TableHead className="text-center">Percentage</TableHead>
                  <TableHead className="text-center">Attempts</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allModules.map((module) => (
                  <TableRow key={module._id} className="hover:bg-muted/50">
                    {/* Type */}
                    <TableCell>
                      {module.type === "company" ? (
                        <Badge variant="outline" className="gap-1 bg-primary/5">
                          <Building2 className="h-3 w-3" />
                          Company
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="gap-1 bg-blue-50">
                          <Globe className="h-3 w-3" />
                          Global
                        </Badge>
                      )}
                    </TableCell>

                    {/* Module Title */}
                    <TableCell className="font-medium max-w-xs">
                      <div className="flex flex-col gap-1">
                        <span className="line-clamp-1">{module.title}</span>
                        {module.isMandatory && (
                          <Badge
                            variant="destructive"
                            className="w-fit text-xs"
                          >
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

                    {/* Slides */}
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1 text-sm text-muted-foreground">
                        <BookOpen className="h-3 w-3" />
                        {module.slidesCount}
                      </div>
                    </TableCell>

                    {/* Questions */}
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1 text-sm text-muted-foreground">
                        <Brain className="h-3 w-3" />
                        {module.questionsCount}
                      </div>
                    </TableCell>

                    {/* Total Points */}
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1 text-sm font-medium">
                        <Award className="h-3 w-3" />
                        {module.totalPoints}
                      </div>
                    </TableCell>

                    {/* Passing Points */}
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1 text-sm font-medium text-green-600">
                        <Target className="h-3 w-3" />
                        {module.passingPoints}+
                      </div>
                    </TableCell>

                    {/* Status */}
                    <TableCell>{getStatusBadge(module.progress)}</TableCell>

                    {/* Your Score */}
                    <TableCell className="text-center">
                      {module.progress &&
                      module.progress.status === "COMPLETED" ? (
                        <span className="font-medium">
                          {module.progress.score}/{module.totalPoints}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>

                    {/* Percentage */}
                    <TableCell className="text-center">
                      {module.progress &&
                      module.progress.status === "COMPLETED" ? (
                        <Badge
                          variant="outline"
                          className={
                            module.progress.isPassed
                              ? "bg-green-50 text-green-700"
                              : "bg-red-50 text-red-700"
                          }
                        >
                          {module.progress.percentage}%
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>

                    {/* Attempts */}
                    <TableCell className="text-center">
                      {module.progress ? (
                        <span className="text-sm">
                          {module.progress.attemptCount}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">0</span>
                      )}
                    </TableCell>

                    {/* Action */}
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        onClick={() => handleStartTraining(module)}
                        className="gap-1"
                      >
                        <PlayCircle className="h-3 w-3" />
                        {getButtonText(module.progress)}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>No Training Modules Available</CardTitle>
            <CardDescription>
              There are currently no training modules assigned to you or available
              globally.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-sm text-muted-foreground max-w-md">
                Please contact your administrator if you believe you should have
                access to training modules, or check back later when new courses
                are added.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Training Module Viewer Modal */}
      <TrainingModuleViewer
        open={viewerOpen}
        onOpenChange={setViewerOpen}
        module={selectedModule}
        onStartTest={handleStartTest}
      />
    </div>
  );
}
