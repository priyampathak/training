import { redirect } from "next/navigation";
import { getSession } from "@/src/actions/auth";
import { getSuperAdminDashboard } from "@/src/actions/super-admin-dashboard";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";
import {
  Building2,
  Users,
  BookOpen,
  BarChart3,
  DollarSign,
  TrendingUp,
  Award,
  CheckCircle2,
  Clock,
  UserCheck,
  Globe,
  Briefcase,
} from "lucide-react";
import { Badge } from "@/src/components/ui/badge";
import { Progress } from "@/src/components/ui/progress";
import { Button } from "@/src/components/ui/button";
import Link from "next/link";
import { format } from "date-fns";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function SuperAdminDashboard() {
  const session = await getSession();

  if (!session || session.role !== "SUPER_ADMIN") {
    redirect("/login");
  }

  const result = await getSuperAdminDashboard();

  if (!result.success || !result.data) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Super Admin Dashboard
          </h1>
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

  const { overview, topCompanies, recentActivity, topModules } = result.data;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Super Admin Dashboard
          </h1>
          <p className="text-muted-foreground mt-2">
            Platform-wide statistics and management
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/admin/analytics">
            <BarChart3 className="mr-2 h-4 w-4" />
            View Detailed Analytics
          </Link>
        </Button>
      </div>

      {/* Main Stats - Companies */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Companies
            </CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview.totalCompanies}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {overview.activeCompanies} active •{" "}
              {overview.inactiveCompanies} inactive
            </p>
            <Progress
              value={
                overview.totalCompanies > 0
                  ? (overview.activeCompanies / overview.totalCompanies) * 100
                  : 0
              }
              className="mt-2"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview.totalUsers}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {overview.staff} staff • {overview.companyAdmins} admins
            </p>
            <Progress
              value={
                overview.totalUsers > 0
                  ? (overview.activeUsers / overview.totalUsers) * 100
                  : 0
              }
              className="mt-2"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Training Modules
            </CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview.totalModules}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {overview.globalModules} global •{" "}
              {overview.companyModules} company
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Estimated Revenue
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${overview.estimatedRevenue.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              From {overview.activeCompanies} active subscriptions
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Performance Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Completion Rate
            </CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {overview.overallCompletionRate}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {overview.completedProgress} of {overview.totalProgress} attempts
            </p>
            <Progress
              value={overview.overallCompletionRate}
              className="mt-2"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pass Rate</CardTitle>
            <Award className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {overview.overallPassRate}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {overview.passedProgress} passed modules
            </p>
            <Progress value={overview.overallPassRate} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Average Score
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {overview.averageScore}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Across all completed modules
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              In Progress
            </CardTitle>
            <Clock className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {overview.inProgressProgress}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Active learning sessions
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Growth Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              New Companies (30 Days)
            </CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              +{overview.recentCompanies}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Added in the last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              New Users (30 Days)
            </CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              +{overview.recentUsers}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Registered in the last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Active Plans
            </CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview.totalPlans}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Subscription plans available
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Top Performing Companies */}
      {topCompanies.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Top Performing Companies</CardTitle>
                <CardDescription>
                  Ranked by module completions and average score
                </CardDescription>
              </div>
              <Award className="h-5 w-5 text-yellow-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topCompanies.map((company: any, index: number) => (
                <div
                  key={company.companyId}
                  className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10">
                      <span className="text-lg font-bold text-primary">
                        {index === 0 && "🥇"}
                        {index === 1 && "🥈"}
                        {index === 2 && "🥉"}
                        {index > 2 && `#${index + 1}`}
                      </span>
                    </div>
                    <div>
                      <p className="font-semibold">{company.companyName}</p>
                      <p className="text-sm text-muted-foreground">
                        {company.completedCount} modules completed
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-base">
                    {company.avgScore}% avg
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Top Modules */}
      {topModules.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Most Popular Modules</CardTitle>
                <CardDescription>
                  Top 5 modules by completion count
                </CardDescription>
              </div>
              <Globe className="h-5 w-5 text-blue-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topModules.map((module: any, index: number) => (
                <div
                  key={module.moduleId}
                  className="flex items-center justify-between p-3 rounded-lg border bg-card"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-muted-foreground">
                        #{index + 1}
                      </span>
                      <p className="font-semibold">{module.moduleTitle}</p>
                      <Badge
                        variant="outline"
                        className={
                          module.moduleType === "Global"
                            ? "bg-blue-500/10 text-blue-600"
                            : "bg-primary/10 text-primary"
                        }
                      >
                        {module.moduleType}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {module.completedCount} completions • {module.avgScore}%
                      avg • {module.passRate}% pass rate
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Activity */}
      {recentActivity.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>
                  Latest 10 module completions across all companies
                </CardDescription>
              </div>
              <Clock className="h-5 w-5 text-orange-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentActivity.map((activity: any) => (
                <div
                  key={activity._id}
                  className="flex items-center justify-between p-3 rounded-lg border bg-card"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold">{activity.userName}</p>
                      {activity.isPassed ? (
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                      ) : (
                        <Badge variant="secondary">Completed</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {activity.moduleTitle} • {activity.companyName}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold">
                      {activity.percentage}%
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {activity.completedAt
                        ? format(new Date(activity.completedAt), "MMM dd, HH:mm")
                        : "N/A"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Common administrative tasks
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Button variant="outline" className="h-auto py-4" asChild>
              <Link href="/dashboard/admin/companies">
                <div className="flex flex-col items-center gap-2">
                  <Building2 className="h-6 w-6" />
                  <span>Manage Companies</span>
                </div>
              </Link>
            </Button>
            <Button variant="outline" className="h-auto py-4" asChild>
              <Link href="/dashboard/admin/users">
                <div className="flex flex-col items-center gap-2">
                  <Users className="h-6 w-6" />
                  <span>Manage Users</span>
                </div>
              </Link>
            </Button>
            <Button variant="outline" className="h-auto py-4" asChild>
              <Link href="/dashboard/admin/modules">
                <div className="flex flex-col items-center gap-2">
                  <BookOpen className="h-6 w-6" />
                  <span>Global Modules</span>
                </div>
              </Link>
            </Button>
            <Button variant="outline" className="h-auto py-4" asChild>
              <Link href="/dashboard/admin/plans">
                <div className="flex flex-col items-center gap-2">
                  <Briefcase className="h-6 w-6" />
                  <span>Manage Plans</span>
                </div>
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
