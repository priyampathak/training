import { redirect } from "next/navigation";
import { getSession } from "@/src/actions/auth";
import { getSuperAdminAnalytics } from "@/src/actions/super-admin-dashboard";
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
  Building2,
  Users,
  BookOpen,
  Briefcase,
  TrendingUp,
  Award,
  CheckCircle2,
  XCircle,
  Clock,
  Target,
  Globe,
  DollarSign,
} from "lucide-react";
import { Badge } from "@/src/components/ui/badge";
import { Progress } from "@/src/components/ui/progress";
import { format } from "date-fns";
import Link from "next/link";
import { Button } from "@/src/components/ui/button";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function SuperAdminAnalyticsPage() {
  const session = await getSession();

  if (!session || session.role !== "SUPER_ADMIN") {
    redirect("/login");
  }

  const result = await getSuperAdminAnalytics();

  if (!result.success || !result.data) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Super Admin Analytics
          </h1>
          <p className="text-muted-foreground mt-2">
            Failed to load analytics data. Please try again.
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

  const { companyAnalytics, userAnalytics, moduleAnalytics, planStats } =
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Super Admin Analytics
          </h1>
          <p className="text-muted-foreground mt-2">
            Comprehensive analytics for all companies, modules, and users
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/dashboard/admin">← Back to Dashboard</Link>
        </Button>
      </div>

      {/* Company Analytics */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-primary/10 p-2">
            <Building2 className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">Company Analytics</h2>
            <p className="text-sm text-muted-foreground">
              Performance metrics for all companies
            </p>
          </div>
        </div>

        {companyAnalytics.length > 0 ? (
          <div className="rounded-md border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Company Name</TableHead>
                  <TableHead>Subscription</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Users</TableHead>
                  <TableHead>Modules</TableHead>
                  <TableHead>Completed</TableHead>
                  <TableHead>Completion Rate</TableHead>
                  <TableHead>Avg Score</TableHead>
                  <TableHead>Pass Rate</TableHead>
                  <TableHead>Engagement</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {companyAnalytics.map((company: any) => (
                  <TableRow key={company.companyId}>
                    <TableCell className="font-medium">
                      {company.companyName}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          company.subscriptionStatus === "ACTIVE"
                            ? "default"
                            : "secondary"
                        }
                      >
                        {company.subscriptionStatus}
                      </Badge>
                    </TableCell>
                    <TableCell>{company.planName}</TableCell>
                    <TableCell>
                      {company.activeUsers}/{company.totalUsers}
                    </TableCell>
                    <TableCell>
                      {company.totalModules}
                      <span className="text-xs text-muted-foreground ml-1">
                        ({company.companyModules}C + {company.globalModules}G)
                      </span>
                    </TableCell>
                    <TableCell>{company.completedProgress}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">
                          {company.completionRate}%
                        </span>
                        <Progress
                          value={company.completionRate}
                          className="w-16"
                        />
                      </div>
                    </TableCell>
                    <TableCell>
                      <span
                        className={
                          company.avgScore >= 80
                            ? "text-green-600 font-semibold"
                            : company.avgScore >= 60
                            ? "text-blue-600 font-semibold"
                            : "text-orange-600 font-semibold"
                        }
                      >
                        {company.avgScore}%
                      </span>
                    </TableCell>
                    <TableCell>{company.passRate}%</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">
                          {company.engagementRate}%
                        </span>
                        <Progress
                          value={company.engagementRate}
                          className="w-16"
                        />
                      </div>
                    </TableCell>
                    <TableCell>
                      {company.createdAt
                        ? format(new Date(company.createdAt), "MMM dd, yyyy")
                        : "N/A"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <Card>
            <CardContent className="pt-6">
              <p className="text-muted-foreground text-center">
                No company data available
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Plan Analytics */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-green-500/10 p-2">
            <Briefcase className="h-5 w-5 text-green-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">Plan Analytics</h2>
            <p className="text-sm text-muted-foreground">
              Subscription plans and revenue
            </p>
          </div>
        </div>

        {planStats.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {planStats.map((plan: any) => (
              <Card key={plan.planId} className="border-l-4 border-l-primary">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle>{plan.planName}</CardTitle>
                      <CardDescription>
                        ${plan.price}/month • {plan.usersLimit} users
                      </CardDescription>
                    </div>
                    <DollarSign className="h-5 w-5 text-green-600" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
                        Companies Using
                      </span>
                      <span className="font-semibold">
                        {plan.companiesUsingPlan}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
                        Active Subscriptions
                      </span>
                      <Badge variant="default">
                        {plan.activeSubscriptions}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t">
                      <span className="text-sm font-medium">
                        Total Revenue
                      </span>
                      <span className="text-lg font-bold text-green-600">
                        ${plan.totalRevenue.toLocaleString()}
                      </span>
                    </div>
                    <div className="pt-2">
                      <p className="text-xs text-muted-foreground mb-2">
                        Features:
                      </p>
                      <div className="space-y-1">
                        {plan.features.slice(0, 3).map((feature: string, idx: number) => (
                          <p key={idx} className="text-xs flex items-center gap-1">
                            <CheckCircle2 className="h-3 w-3 text-green-600" />
                            {feature}
                          </p>
                        ))}
                        {plan.features.length > 3 && (
                          <p className="text-xs text-muted-foreground">
                            +{plan.features.length - 3} more
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="pt-6">
              <p className="text-muted-foreground text-center">
                No plan data available
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Module Analytics */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-blue-500/10 p-2">
            <BookOpen className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">Module Analytics</h2>
            <p className="text-sm text-muted-foreground">
              Performance metrics for all training modules
            </p>
          </div>
        </div>

        {moduleAnalytics.length > 0 ? (
          <div className="rounded-md border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Module Title</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Difficulty</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Assigned To</TableHead>
                  <TableHead>Total Attempts</TableHead>
                  <TableHead>Completed</TableHead>
                  <TableHead>In Progress</TableHead>
                  <TableHead>Passed</TableHead>
                  <TableHead>Failed</TableHead>
                  <TableHead>Completion Rate</TableHead>
                  <TableHead>Pass Rate</TableHead>
                  <TableHead>Avg Score</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {moduleAnalytics.map((module: any) => (
                  <TableRow key={module.moduleId}>
                    <TableCell className="font-medium max-w-xs">
                      {module.title}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{module.category}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={getDifficultyColor(module.difficulty)}
                      >
                        {module.difficulty}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={
                          module.type === "Global"
                            ? "bg-blue-500/10 text-blue-600"
                            : "bg-primary/10 text-primary"
                        }
                      >
                        {module.type}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      {module.assignedTo}
                    </TableCell>
                    <TableCell>{module.totalAttempts}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        {module.completedCount}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4 text-blue-600" />
                        {module.inProgressCount}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Award className="h-4 w-4 text-green-600" />
                        {module.passedCount}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <XCircle className="h-4 w-4 text-red-600" />
                        {module.failedCount}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">
                          {module.completionRate}%
                        </span>
                        <Progress
                          value={module.completionRate}
                          className="w-16"
                        />
                      </div>
                    </TableCell>
                    <TableCell>
                      <span
                        className={
                          module.passRate >= 80
                            ? "text-green-600 font-semibold"
                            : module.passRate >= 60
                            ? "text-blue-600 font-semibold"
                            : "text-orange-600 font-semibold"
                        }
                      >
                        {module.passRate}%
                      </span>
                    </TableCell>
                    <TableCell>
                      <span
                        className={
                          module.avgScore >= 80
                            ? "text-green-600 font-semibold"
                            : module.avgScore >= 60
                            ? "text-blue-600 font-semibold"
                            : "text-orange-600 font-semibold"
                        }
                      >
                        {module.avgScore}%
                      </span>
                    </TableCell>
                    <TableCell>
                      {module.createdAt
                        ? format(new Date(module.createdAt), "MMM dd, yyyy")
                        : "N/A"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <Card>
            <CardContent className="pt-6">
              <p className="text-muted-foreground text-center">
                No module data available
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* User Analytics */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-purple-500/10 p-2">
            <Users className="h-5 w-5 text-purple-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">User Analytics</h2>
            <p className="text-sm text-muted-foreground">
              Performance metrics for all users
            </p>
          </div>
        </div>

        {userAnalytics.length > 0 ? (
          <div className="rounded-md border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Completed</TableHead>
                  <TableHead>In Progress</TableHead>
                  <TableHead>Passed</TableHead>
                  <TableHead>Total Attempts</TableHead>
                  <TableHead>Avg Score</TableHead>
                  <TableHead>Last Login</TableHead>
                  <TableHead>Joined</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {userAnalytics.map((user: any) => (
                  <TableRow key={user.userId}>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          user.role === "SUPER_ADMIN"
                            ? "destructive"
                            : user.role === "COMPANY_ADMIN"
                            ? "default"
                            : "secondary"
                        }
                      >
                        {user.role.replace("_", " ")}
                      </Badge>
                    </TableCell>
                    <TableCell>{user.companyName}</TableCell>
                    <TableCell>
                      <Badge
                        variant={user.isActive ? "default" : "secondary"}
                      >
                        {user.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        {user.completedModules}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4 text-blue-600" />
                        {user.inProgressModules}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Award className="h-4 w-4 text-green-600" />
                        {user.passedModules}
                      </div>
                    </TableCell>
                    <TableCell>{user.totalAttempts}</TableCell>
                    <TableCell>
                      <span
                        className={
                          user.avgScore >= 80
                            ? "text-green-600 font-semibold"
                            : user.avgScore >= 60
                            ? "text-blue-600 font-semibold"
                            : user.avgScore > 0
                            ? "text-orange-600 font-semibold"
                            : "text-muted-foreground"
                        }
                      >
                        {user.avgScore > 0 ? `${user.avgScore}%` : "N/A"}
                      </span>
                    </TableCell>
                    <TableCell>
                      {user.lastLoginAt
                        ? format(new Date(user.lastLoginAt), "MMM dd, HH:mm")
                        : "Never"}
                    </TableCell>
                    <TableCell>
                      {user.createdAt
                        ? format(new Date(user.createdAt), "MMM dd, yyyy")
                        : "N/A"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <Card>
            <CardContent className="pt-6">
              <p className="text-muted-foreground text-center">
                No user data available
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

