import { redirect } from "next/navigation";
import { getSession } from "@/src/actions/auth";
import { getCompanyDashboardAnalytics } from "@/src/actions/company-dashboard";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";
import {
  Users,
  BookOpen,
  CheckCircle2,
  TrendingUp,
  Award,
  Target,
  BarChart3,
  Clock,
  AlertCircle,
  Building2,
  Globe,
  Trophy,
  UserX,
} from "lucide-react";
import { Badge } from "@/src/components/ui/badge";
import { Progress } from "@/src/components/ui/progress";
import Link from "next/link";
import { Button } from "@/src/components/ui/button";

export default async function CompanyAdminDashboard() {
  const session = await getSession();

  if (!session || session.role !== "COMPANY_ADMIN") {
    redirect("/login");
  }

  const result = await getCompanyDashboardAnalytics();

  if (!result.success || !result.data) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Company Dashboard</h1>
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

  const { company, overview, stats, recentActivity, topPerformers, topModules, inactiveUsers } =
    result.data;

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Welcome to {company.name} Dashboard
        </h1>
        <p className="text-muted-foreground mt-2">
          Real-time analytics and insights for your training program
        </p>
      </div>

      {/* Company Info Card */}
      <Card className="border-l-4 border-l-primary">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <div className="rounded-full bg-primary/10 p-3">
              <Building2 className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-lg">{company.name}</h3>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="outline">{company.planName}</Badge>
                <Badge
                  variant={
                    company.subscription?.status === "ACTIVE"
                      ? "default"
                      : "secondary"
                  }
                  className={
                    company.subscription?.status === "ACTIVE"
                      ? "bg-green-600"
                      : ""
                  }
                >
                  {company.subscription?.status || "ACTIVE"}
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Team Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview.totalTeamMembers}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {overview.staffCount} Staff · {overview.adminCount} Admins
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Training Modules</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview.totalModules}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {overview.totalCompanyModules} Company · {overview.totalGlobalModules}{" "}
              Global
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {overview.completionRate}%
            </div>
            <Progress value={overview.completionRate} className="mt-2 h-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Score</CardTitle>
            <Award className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {overview.averageScore}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Pass Rate: {overview.passRate}%
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Additional Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Attempts</CardTitle>
            <Target className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {stats.totalAttempts}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Across all modules
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Engagement Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {overview.engagementRate}%
            </div>
            <Progress value={overview.engagementRate} className="mt-2 h-2" />
            <p className="text-xs text-muted-foreground mt-1">
              {stats.uniqueUsersStarted} of {overview.staffCount} staff active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Performance Summary
            </CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Completed:</span>
                <span className="font-medium text-green-600">
                  {stats.completedModules}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Passed:</span>
                <span className="font-medium">{stats.passedCount}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">In Progress:</span>
                <span className="font-medium text-blue-600">
                  {stats.inProgressModules}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Two Column Layout */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Top Performers */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-yellow-600" />
                  Top Performers
                </CardTitle>
                <CardDescription>
                  Staff members with highest average scores
                </CardDescription>
              </div>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/dashboard/company/team">View All</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {topPerformers.length > 0 ? (
              <div className="space-y-3">
                {topPerformers.map((performer: any, index: number) => (
                  <div
                    key={performer.userId}
                    className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg"
                  >
                    <div
                      className={`flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm ${
                        index === 0
                          ? "bg-yellow-100 text-yellow-700"
                          : index === 1
                          ? "bg-gray-100 text-gray-700"
                          : index === 2
                          ? "bg-orange-100 text-orange-700"
                          : "bg-blue-100 text-blue-700"
                      }`}
                    >
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">
                        {performer.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {performer.completedModules} modules completed
                      </p>
                    </div>
                    <Badge variant="outline" className="bg-green-50">
                      {performer.averageScore}%
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                No completed modules yet
              </p>
            )}
          </CardContent>
        </Card>

        {/* Top Modules */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-blue-600" />
                  Module Completion Rates
                </CardTitle>
                <CardDescription>Most completed training modules</CardDescription>
              </div>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/dashboard/company/modules">View All</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {topModules.length > 0 ? (
              <div className="space-y-4">
                {topModules.map((module: any) => (
                  <div key={module.moduleId} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium truncate flex-1">
                        {module.title}
                      </p>
                      <Badge variant="outline">{module.completionRate}%</Badge>
                    </div>
                    <Progress value={module.completionRate} className="h-2" />
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3 text-green-600" />
                        {module.completed} completed
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3 text-blue-600" />
                        {module.inProgress} in progress
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                No module data available
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity & Inactive Users */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-blue-600" />
              Recent Activity
            </CardTitle>
            <CardDescription>Latest module completions</CardDescription>
          </CardHeader>
          <CardContent>
            {recentActivity.length > 0 ? (
              <div className="space-y-3">
                {recentActivity.map((activity: any, index: number) => (
                  <div
                    key={index}
                    className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg"
                  >
                    <div
                      className={`mt-1 p-1.5 rounded-full ${
                        activity.isPassed ? "bg-green-100" : "bg-orange-100"
                      }`}
                    >
                      {activity.isPassed ? (
                        <CheckCircle2 className="h-3 w-3 text-green-600" />
                      ) : (
                        <AlertCircle className="h-3 w-3 text-orange-600" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0 space-y-1">
                      <p className="text-sm font-medium truncate">
                        {activity.userName}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {activity.moduleName}
                      </p>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {activity.percentage}%
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {formatDate(activity.completedAt)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                No recent activity
              </p>
            )}
          </CardContent>
        </Card>

        {/* Inactive Users */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <UserX className="h-5 w-5 text-orange-600" />
                  Inactive Users
                </CardTitle>
                <CardDescription>
                  Staff who haven't started any training
                </CardDescription>
              </div>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/dashboard/company/team">View All</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {inactiveUsers.length > 0 ? (
              <div className="space-y-3">
                {inactiveUsers.map((user: any, index: number) => (
                  <div
                    key={index}
                    className="flex items-center gap-3 p-3 bg-orange-50/50 rounded-lg border border-orange-100"
                  >
                    <div className="p-2 rounded-full bg-orange-100">
                      <UserX className="h-4 w-4 text-orange-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{user.name}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {user.email}
                      </p>
                    </div>
                    <Badge variant="outline" className="bg-white text-xs">
                      0 modules
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4">
                <CheckCircle2 className="h-12 w-12 text-green-600 mx-auto mb-2" />
                <p className="text-sm font-medium text-green-600">
                  All staff are active!
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Everyone has started at least one training module
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Manage your company's training program
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <Button asChild className="w-full">
              <Link href="/dashboard/company/training">
                <BookOpen className="mr-2 h-4 w-4" />
                Create Training
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link href="/dashboard/company/team">
                <Users className="mr-2 h-4 w-4" />
                Manage Team
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link href="/dashboard/company/modules">
                <BarChart3 className="mr-2 h-4 w-4" />
                View Modules
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link href="/dashboard/company/analytics">
                <TrendingUp className="mr-2 h-4 w-4" />
                Analytics
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
