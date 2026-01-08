"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getSuperAdminAnalytics } from "@/src/actions/super-admin-dashboard";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
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
  Filter,
  Loader2,
} from "lucide-react";
import { Badge } from "@/src/components/ui/badge";
import { Progress } from "@/src/components/ui/progress";
import { format } from "date-fns";
import Link from "next/link";
import { Button } from "@/src/components/ui/button";

export default function SuperAdminAnalyticsPage() {
  const router = useRouter();
  const [timeFilter, setTimeFilter] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadAnalytics();
  }, [timeFilter]);

  async function loadAnalytics() {
    try {
      setLoading(true);
      setError(null);
      const result = await getSuperAdminAnalytics(timeFilter === "all" ? undefined : timeFilter);
      
      if (result.success && result.data) {
        setAnalyticsData(result.data);
      } else {
        setError(result.message || "Failed to load analytics");
      }
    } catch (err: any) {
      console.error("Error loading analytics:", err);
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Loading analytics...</p>
      </div>
    );
  }

  if (error || !analyticsData) {
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
            <p className="text-destructive">{error || "No data available"}</p>
            <Button onClick={loadAnalytics} className="mt-4">
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { companyAnalytics, userAnalytics, moduleAnalytics, planStats, revenueAnalytics } = analyticsData;

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

      {/* Time Filter */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-muted-foreground" />
            <CardTitle>Time Period Filter</CardTitle>
          </div>
          <CardDescription>
            Filter analytics data by time period
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium">Select Time Period:</label>
            <Select value={timeFilter} onValueChange={setTimeFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Select period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="weekly">Last 7 Days</SelectItem>
                <SelectItem value="monthly">Last 30 Days</SelectItem>
                <SelectItem value="quarterly">Last 3 Months</SelectItem>
                <SelectItem value="6months">Last 6 Months</SelectItem>
                <SelectItem value="yearly">Last Year</SelectItem>
              </SelectContent>
            </Select>
            {timeFilter !== "all" && (
              <span className="text-sm text-muted-foreground">
                Showing data from{" "}
                {timeFilter === "weekly"
                  ? "last 7 days"
                  : timeFilter === "monthly"
                  ? "last 30 days"
                  : timeFilter === "quarterly"
                  ? "last 3 months"
                  : timeFilter === "6months"
                  ? "last 6 months"
                  : "last year"}
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Revenue Analytics */}
      {revenueAnalytics && (
        <>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-green-500/10 p-2">
                <DollarSign className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Revenue Analytics</h2>
                <p className="text-sm text-muted-foreground">
                  Real-time subscription and revenue metrics
                </p>
              </div>
            </div>

            {/* Key Revenue Metrics */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card className="border-l-4 border-l-green-600">
                <CardHeader className="pb-2">
                  <CardDescription>Monthly Recurring Revenue</CardDescription>
                  <CardTitle className="text-3xl font-bold text-green-600">
                    ${revenueAnalytics.totalMRR.toLocaleString()}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground">
                    {revenueAnalytics.totalActiveSubscriptions} active subscriptions
                  </p>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-blue-600">
                <CardHeader className="pb-2">
                  <CardDescription>Annual Recurring Revenue</CardDescription>
                  <CardTitle className="text-3xl font-bold text-blue-600">
                    ${revenueAnalytics.totalARR.toLocaleString()}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground">
                    Projected annual revenue
                  </p>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-purple-600">
                <CardHeader className="pb-2">
                  <CardDescription>Average Revenue Per User</CardDescription>
                  <CardTitle className="text-3xl font-bold text-purple-600">
                    ${revenueAnalytics.arpu.toLocaleString()}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground">
                    Per company/month
                  </p>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-orange-600">
                <CardHeader className="pb-2">
                  <CardDescription>Churn Rate</CardDescription>
                  <CardTitle className="text-3xl font-bold text-orange-600">
                    {revenueAnalytics.churnRate}%
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground">
                    {revenueAnalytics.churnedSubscriptions} churned
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Revenue by Plan */}
            <Card>
              <CardHeader>
                <CardTitle>Revenue by Plan</CardTitle>
                <CardDescription>
                  Revenue breakdown by subscription plan
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {revenueAnalytics.revenueByPlan.map((plan: any, idx: number) => (
                    <div key={idx} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{plan.planName}</Badge>
                          <span className="text-sm text-muted-foreground">
                            {plan.activeSubscriptions} subscriptions
                          </span>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-green-600">
                            ${plan.monthlyRevenue.toLocaleString()}/mo
                          </p>
                          <p className="text-xs text-muted-foreground">
                            ${plan.annualRevenue.toLocaleString()}/year
                          </p>
                        </div>
                      </div>
                      <Progress
                        value={(plan.monthlyRevenue / revenueAnalytics.totalMRR) * 100}
                        className="h-2"
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Revenue by Status */}
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Revenue by Subscription Status</CardTitle>
                  <CardDescription>
                    Revenue breakdown by status
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded-full bg-green-500"></div>
                        <span className="text-sm">Active</span>
                      </div>
                      <span className="font-semibold text-green-600">
                        ${revenueAnalytics.revenueByStatus.active.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded-full bg-blue-500"></div>
                        <span className="text-sm">Trial</span>
                      </div>
                      <span className="font-semibold text-blue-600">
                        ${revenueAnalytics.revenueByStatus.trial.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded-full bg-orange-500"></div>
                        <span className="text-sm">Cancelled</span>
                      </div>
                      <span className="font-semibold text-orange-600">
                        ${revenueAnalytics.revenueByStatus.cancelled.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded-full bg-gray-500"></div>
                        <span className="text-sm">Expired</span>
                      </div>
                      <span className="font-semibold text-gray-600">
                        ${revenueAnalytics.revenueByStatus.expired.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Subscription Trends</CardTitle>
                  <CardDescription>
                    {timeFilter === "all" ? "All time" : "For selected period"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                      <div>
                        <p className="text-sm font-medium text-green-900">New Subscriptions</p>
                        <p className="text-xs text-green-700">Companies joined</p>
                      </div>
                      <div className="text-2xl font-bold text-green-600">
                        {revenueAnalytics.newSubscriptions}
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                      <div>
                        <p className="text-sm font-medium text-orange-900">Churned Subscriptions</p>
                        <p className="text-xs text-orange-700">Cancelled or expired</p>
                      </div>
                      <div className="text-2xl font-bold text-orange-600">
                        {revenueAnalytics.churnedSubscriptions}
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                      <div>
                        <p className="text-sm font-medium text-blue-900">Net Growth</p>
                        <p className="text-xs text-blue-700">New - Churned</p>
                      </div>
                      <div className={`text-2xl font-bold ${
                        revenueAnalytics.newSubscriptions - revenueAnalytics.churnedSubscriptions >= 0 
                          ? "text-green-600" 
                          : "text-red-600"
                      }`}>
                        {revenueAnalytics.newSubscriptions - revenueAnalytics.churnedSubscriptions >= 0 ? "+" : ""}
                        {revenueAnalytics.newSubscriptions - revenueAnalytics.churnedSubscriptions}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Top Revenue Generating Companies */}
            <Card>
              <CardHeader>
                <CardTitle>Top Revenue Generating Companies</CardTitle>
                <CardDescription>
                  Companies ranked by monthly revenue
                </CardDescription>
              </CardHeader>
              <CardContent>
                {revenueAnalytics.topRevenueCompanies.length > 0 ? (
                  <div className="rounded-md border overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Rank</TableHead>
                          <TableHead>Company Name</TableHead>
                          <TableHead>Plan</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Monthly Revenue</TableHead>
                          <TableHead>Annual Revenue</TableHead>
                          <TableHead>Start Date</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {revenueAnalytics.topRevenueCompanies.map((company: any, idx: number) => (
                          <TableRow key={company.companyId}>
                            <TableCell>
                              <Badge variant={idx < 3 ? "default" : "secondary"}>
                                #{idx + 1}
                              </Badge>
                            </TableCell>
                            <TableCell className="font-medium">
                              {company.companyName}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">{company.planName}</Badge>
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
                            <TableCell>
                              <span className="font-semibold text-green-600">
                                ${company.monthlyRevenue.toLocaleString()}
                              </span>
                            </TableCell>
                            <TableCell>
                              <span className="font-semibold">
                                ${company.annualRevenue.toLocaleString()}
                              </span>
                            </TableCell>
                            <TableCell>
                              {company.startDate
                                ? format(new Date(company.startDate), "MMM dd, yyyy")
                                : "N/A"}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-8">
                    No revenue data available
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}

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

