import { redirect } from "next/navigation";
import { getSession } from "@/src/actions/auth";
import { getStaffDashboard } from "@/src/actions/staff";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";
import {
  GraduationCap,
  BookOpen,
  TrendingUp,
  Building2,
  Award,
  Clock,
  CheckCircle2,
  PlayCircle,
  AlertCircle,
} from "lucide-react";
import { Badge } from "@/src/components/ui/badge";
import { Progress } from "@/src/components/ui/progress";
import Link from "next/link";
import { Button } from "@/src/components/ui/button";

export default async function StaffDashboard() {
  const session = await getSession();

  if (!session || session.role !== "STAFF") {
    redirect("/login");
  }

  const result = await getStaffDashboard();

  if (!result.success || !result.data) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Learning Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            Failed to load dashboard data. Please try again.
          </p>
        </div>
        <Card>
          <CardContent className="pt-6">
            <p className="text-destructive">{result.message}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { user, company, stats, availableModules, completedModules, inProgressModules } =
    result.data;

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

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Welcome back, {user.name}! 👋
        </h1>
        <p className="text-muted-foreground mt-2">
          Track your learning progress and continue your training journey
        </p>
      </div>

      {/* Company Info Card */}
      {company && (
        <Card className="border-l-4 border-l-primary">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="rounded-full bg-primary/10 p-3">
                <Building2 className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-lg">{company.name}</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {user.designation || "Staff Member"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Modules</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalModules}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Available for you
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
              {stats.completedModules}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.completionRate}% completion rate
            </p>
            <Progress value={stats.completionRate} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <Clock className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {stats.inProgressModules}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Continue learning
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Score</CardTitle>
            <Award className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {stats.averageScore}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Keep up the good work!
            </p>
          </CardContent>
        </Card>
      </div>

      {/* In Progress Modules */}
      {inProgressModules.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <PlayCircle className="h-5 w-5 text-blue-600" />
            <h2 className="text-2xl font-bold">Continue Learning</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {inProgressModules.map((module: any) => (
              <Card
                key={module._id}
                className="hover:shadow-md transition-shadow border-l-4 border-l-blue-500"
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1 flex-1">
                      <CardTitle className="text-lg">{module.title}</CardTitle>
                      <CardDescription className="line-clamp-2">
                        {module.description}
                      </CardDescription>
                    </div>
                    {module.isMandatory && (
                      <Badge variant="destructive" className="ml-2">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        Mandatory
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="outline">{module.category}</Badge>
                      <Badge
                        variant="outline"
                        className={getDifficultyColor(module.difficulty)}
                      >
                        {module.difficulty}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Attempt {module.progress?.attemptCount || 0} •{" "}
                      {module.passingPoints} pts to pass
                    </div>
                    <Button className="w-full" asChild>
                      <Link href="/dashboard/learn/courses">
                        Continue Module
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Completed Modules */}
      {completedModules.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            <h2 className="text-2xl font-bold">Completed Modules</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {completedModules.map((module: any) => (
              <Card
                key={module._id}
                className="hover:shadow-md transition-shadow border-t-4 border-t-green-500"
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1 flex-1">
                      <CardTitle className="text-base">{module.title}</CardTitle>
                      <CardDescription className="line-clamp-1">
                        {module.description}
                      </CardDescription>
                    </div>
                    <CheckCircle2 className="h-5 w-5 text-green-600 ml-2" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="outline">{module.category}</Badge>
                      <Badge
                        variant="outline"
                        className={getDifficultyColor(module.difficulty)}
                      >
                        {module.difficulty}
                      </Badge>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Score:</span>
                        <span className="font-semibold text-green-600">
                          {module.progress?.score}/{module.totalPoints} pts (
                          {module.progress?.percentage}%)
                        </span>
                      </div>
                      {module.progress?.isPassed ? (
                        <Badge variant="default" className="w-full justify-center">
                          ✓ Passed
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="w-full justify-center">
                          Completed
                        </Badge>
                      )}
                    </div>
                    <Button className="w-full" variant="ghost" size="sm" asChild>
                      <Link href="/dashboard/learn/courses">
                        Review Module
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {stats.totalModules === 0 && (
        <Card>
          <CardHeader>
            <CardTitle>No Training Modules Available</CardTitle>
            <CardDescription>
              There are currently no training modules assigned to you or your company.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Please contact your administrator if you believe you should have access
              to training modules.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
