"use client";

import { useEffect, useState } from "react";
import {
  getCompanyAnalytics,
  getModuleDetailedAnalytics,
} from "@/src/actions/analytics";
import { Button } from "@/src/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";
import { Badge } from "@/src/components/ui/badge";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  Users,
  BookOpen,
  TrendingUp,
  Award,
  Activity,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  Target,
  Loader2,
} from "lucide-react";

interface ModulePerformance {
  moduleId: string;
  title: string;
  category: string;
  isGlobal: boolean;
  totalAssigned: number;
  completed: number;
  inProgress: number;
  failed: number;
  notStarted: number;
  completionRate: number;
  averageScore: number;
  passRate: number;
  totalAttempts: number;
  passed: number;
}

interface UserPerformance {
  userId: string;
  name: string;
  email: string;
  role: string;
  totalModules: number;
  completed: number;
  inProgress: number;
  notStarted: number;
  completionRate: number;
  averageScore: number;
  passed: number;
  failed: number;
}

interface DetailedAnalytics {
  moduleTitle: string;
  moduleCategory: string;
  isGlobal: boolean;
  totalQuestions: number;
  passingPoints: number;
  totalPoints: number;
  statistics: any;
  userResponses: any[];
}

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

export default function CompanyAnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [companyName, setCompanyName] = useState("");
  const [overview, setOverview] = useState<any>(null);
  const [modulePerformance, setModulePerformance] = useState<ModulePerformance[]>([]);
  const [userPerformance, setUserPerformance] = useState<UserPerformance[]>([]);
  const [topPerformers, setTopPerformers] = useState<UserPerformance[]>([]);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);

  // Modal state
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedModule, setSelectedModule] = useState<string | null>(null);
  const [detailedAnalytics, setDetailedAnalytics] = useState<DetailedAnalytics | null>(
    null
  );
  const [loadingDetails, setLoadingDetails] = useState(false);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const result = await getCompanyAnalytics();

      if (result.success && result.data) {
        setCompanyName(result.data.companyName);
        setOverview(result.data.overview);
        setModulePerformance(result.data.modulePerformance);
        setUserPerformance(result.data.userPerformance);
        setTopPerformers(result.data.topPerformers);
        setRecentActivity(result.data.recentActivity);
      } else {
        alert(result.message || "Failed to load analytics");
      }
    } catch (error) {
      console.error("Error loading analytics:", error);
      alert("An error occurred while loading analytics");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnalytics();
  }, []);

  const handleViewDetails = async (moduleId: string) => {
    setSelectedModule(moduleId);
    setDetailModalOpen(true);
    setLoadingDetails(true);

    try {
      const result = await getModuleDetailedAnalytics(moduleId);

      if (result.success && result.data) {
        setDetailedAnalytics(result.data);
      } else {
        alert(result.message || "Failed to load module details");
        setDetailModalOpen(false);
      }
    } catch (error) {
      console.error("Error loading module details:", error);
      alert("An error occurred while loading module details");
      setDetailModalOpen(false);
    } finally {
      setLoadingDetails(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Prepare chart data
  const moduleCompletionData = modulePerformance.slice(0, 10).map((m) => ({
    name: m.title.substring(0, 20) + (m.title.length > 20 ? "..." : ""),
    completionRate: m.completionRate,
    averageScore: m.averageScore,
  }));

  const statusDistributionData = overview
    ? [
        { name: "Completed", value: overview.completedModules },
        {
          name: "In Progress",
          value:
            overview.totalStaff * overview.totalModules - overview.completedModules,
        },
      ]
    : [];

  const topPerformersData = topPerformers.map((p) => ({
    name: p.name.split(" ")[0],
    score: p.averageScore,
    completed: p.completed,
  }));

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Company Analytics</h1>
        <p className="text-muted-foreground mt-1">
          Real-time analytics for {companyName}
        </p>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Staff</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview?.totalStaff || 0}</div>
            <p className="text-xs text-muted-foreground">
              {overview?.activeUsers || 0} active learners
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Modules</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview?.totalModules || 0}</div>
            <p className="text-xs text-muted-foreground">
              {overview?.completedModules || 0} completions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview?.completionRate || 0}%</div>
            <p className="text-xs text-muted-foreground">
              Overall progress
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Score</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview?.averageScore || 0}%</div>
            <p className="text-xs text-muted-foreground">
              Pass rate: {overview?.passRate || 0}%
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Module Completion Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Module Completion Overview</CardTitle>
            <CardDescription>Top performing modules</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {moduleCompletionData.slice(0, 8).map((module, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium truncate flex-1 pr-4">
                      {module.name}
                    </span>
                    <div className="flex items-center gap-4 text-xs">
                      <span className="text-blue-600 font-medium">
                        {module.completionRate}% complete
                      </span>
                      <span className="text-green-600 font-medium">
                        {module.averageScore}% avg
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-500 h-2 rounded-full transition-all"
                          style={{ width: `${module.completionRate}%` }}
                        />
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-green-500 h-2 rounded-full transition-all"
                          style={{ width: `${module.averageScore}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t flex items-center justify-center gap-6 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-500 rounded"></div>
                <span className="text-muted-foreground">Completion Rate</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded"></div>
                <span className="text-muted-foreground">Average Score</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Top Performers Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Top Performers</CardTitle>
            <CardDescription>Highest scoring staff members</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={topPerformersData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="score"
                  stroke="#8b5cf6"
                  strokeWidth={2}
                  name="Avg Score %"
                />
                <Line
                  type="monotone"
                  dataKey="completed"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  name="Completed"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Module Performance Table */}
      <Card>
        <CardHeader>
          <CardTitle>Module Performance</CardTitle>
          <CardDescription>
            Detailed performance metrics for each training module
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-4 font-medium">Module</th>
                  <th className="text-left p-4 font-medium">Category</th>
                  <th className="text-left p-4 font-medium">Type</th>
                  <th className="text-center p-4 font-medium">Completed</th>
                  <th className="text-center p-4 font-medium">In Progress</th>
                  <th className="text-center p-4 font-medium">Not Started</th>
                  <th className="text-center p-4 font-medium">Completion %</th>
                  <th className="text-center p-4 font-medium">Avg Score</th>
                  <th className="text-center p-4 font-medium">Pass Rate</th>
                  <th className="text-center p-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {modulePerformance.length === 0 ? (
                  <tr>
                    <td
                      colSpan={10}
                      className="text-center p-8 text-muted-foreground"
                    >
                      No modules found
                    </td>
                  </tr>
                ) : (
                  modulePerformance.map((module) => (
                    <tr key={module.moduleId} className="border-b hover:bg-muted/50">
                      <td className="p-4">
                        <div className="font-medium">{module.title}</div>
                      </td>
                      <td className="p-4">
                        <Badge variant="outline">{module.category}</Badge>
                      </td>
                      <td className="p-4">
                        <Badge variant={module.isGlobal ? "default" : "secondary"}>
                          {module.isGlobal ? "Global" : "Company"}
                        </Badge>
                      </td>
                      <td className="p-4 text-center">
                        <span className="text-green-600 font-medium">
                          {module.completed}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <span className="text-blue-600 font-medium">
                          {module.inProgress}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <span className="text-gray-600 font-medium">
                          {module.notStarted}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-16 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-500 h-2 rounded-full"
                              style={{ width: `${module.completionRate}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium">
                            {module.completionRate}%
                          </span>
                        </div>
                      </td>
                      <td className="p-4 text-center">
                        <span
                          className={`font-medium ${
                            module.averageScore >= 80
                              ? "text-green-600"
                              : module.averageScore >= 60
                              ? "text-yellow-600"
                              : "text-red-600"
                          }`}
                        >
                          {module.averageScore}%
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <span
                          className={`font-medium ${
                            module.passRate >= 80
                              ? "text-green-600"
                              : module.passRate >= 60
                              ? "text-yellow-600"
                              : "text-red-600"
                          }`}
                        >
                          {module.passRate}%
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleViewDetails(module.moduleId)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View Details
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Latest module completions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentActivity.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No recent activity
              </p>
            ) : (
              recentActivity.map((activity, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    {activity.isPassed ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-500" />
                    )}
                    <div>
                      <p className="font-medium">{activity.userName}</p>
                      <p className="text-sm text-muted-foreground">
                        {activity.moduleTitle}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p
                      className={`font-medium ${
                        activity.isPassed ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      {activity.score}%
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {activity.completedAt
                        ? new Date(activity.completedAt).toLocaleDateString()
                        : "N/A"}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Detailed Module Analytics Modal */}
      <Dialog open={detailModalOpen} onOpenChange={setDetailModalOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {detailedAnalytics?.moduleTitle || "Module Analytics"}
            </DialogTitle>
            <DialogDescription>
              User-wise performance and responses
            </DialogDescription>
          </DialogHeader>

          {loadingDetails ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : detailedAnalytics ? (
            <div className="space-y-6">
              {/* Module Info */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold">
                      {detailedAnalytics.statistics.totalUsers}
                    </div>
                    <p className="text-xs text-muted-foreground">Total Users</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold text-green-600">
                      {detailedAnalytics.statistics.completed}
                    </div>
                    <p className="text-xs text-muted-foreground">Completed</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold text-blue-600">
                      {detailedAnalytics.statistics.inProgress}
                    </div>
                    <p className="text-xs text-muted-foreground">In Progress</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold text-gray-600">
                      {detailedAnalytics.statistics.notStarted}
                    </div>
                    <p className="text-xs text-muted-foreground">Not Started</p>
                  </CardContent>
                </Card>
              </div>

              {/* Statistics Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>Status Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Visual Pie Chart */}
                    <ResponsiveContainer width="100%" height={200}>
                      <PieChart>
                        <Pie
                          data={[
                            {
                              name: "Completed",
                              value: detailedAnalytics.statistics.completed || 0.1,
                            },
                            {
                              name: "In Progress",
                              value: detailedAnalytics.statistics.inProgress || 0.1,
                            },
                            {
                              name: "Not Started",
                              value: detailedAnalytics.statistics.notStarted || 0.1,
                            },
                            {
                              name: "Failed",
                              value: detailedAnalytics.statistics.failed || 0.1,
                            },
                          ]}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={false}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {[0, 1, 2, 3].map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={COLORS[index % COLORS.length]}
                            />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(value: any) => {
                            const total = detailedAnalytics.statistics.totalUsers;
                            const actual = value === 0.1 ? 0 : value;
                            return [
                              `${actual} (${total > 0 ? ((actual / total) * 100).toFixed(1) : 0}%)`,
                              "",
                            ];
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>

                    {/* Legend with actual numbers */}
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: COLORS[0] }}
                        />
                        <span className="text-muted-foreground">Completed:</span>
                        <span className="font-medium">
                          {detailedAnalytics.statistics.completed} (
                          {detailedAnalytics.statistics.totalUsers > 0
                            ? (
                                (detailedAnalytics.statistics.completed /
                                  detailedAnalytics.statistics.totalUsers) *
                                100
                              ).toFixed(0)
                            : 0}
                          %)
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: COLORS[1] }}
                        />
                        <span className="text-muted-foreground">In Progress:</span>
                        <span className="font-medium">
                          {detailedAnalytics.statistics.inProgress} (
                          {detailedAnalytics.statistics.totalUsers > 0
                            ? (
                                (detailedAnalytics.statistics.inProgress /
                                  detailedAnalytics.statistics.totalUsers) *
                                100
                              ).toFixed(0)
                            : 0}
                          %)
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: COLORS[2] }}
                        />
                        <span className="text-muted-foreground">Not Started:</span>
                        <span className="font-medium">
                          {detailedAnalytics.statistics.notStarted} (
                          {detailedAnalytics.statistics.totalUsers > 0
                            ? (
                                (detailedAnalytics.statistics.notStarted /
                                  detailedAnalytics.statistics.totalUsers) *
                                100
                              ).toFixed(0)
                            : 0}
                          %)
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: COLORS[3] }}
                        />
                        <span className="text-muted-foreground">Failed:</span>
                        <span className="font-medium">
                          {detailedAnalytics.statistics.failed} (
                          {detailedAnalytics.statistics.totalUsers > 0
                            ? (
                                (detailedAnalytics.statistics.failed /
                                  detailedAnalytics.statistics.totalUsers) *
                                100
                              ).toFixed(0)
                            : 0}
                          %)
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* User Responses Table */}
              <Card>
                <CardHeader>
                  <CardTitle>User Responses</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-3 font-medium">User</th>
                          <th className="text-left p-3 font-medium">Status</th>
                          <th className="text-center p-3 font-medium">Score</th>
                          <th className="text-center p-3 font-medium">Percentage</th>
                          <th className="text-center p-3 font-medium">Result</th>
                          <th className="text-center p-3 font-medium">Attempts</th>
                          <th className="text-center p-3 font-medium">Completed</th>
                        </tr>
                      </thead>
                      <tbody>
                        {detailedAnalytics.userResponses.map((user: any) => (
                          <tr key={user.userId} className="border-b hover:bg-muted/50">
                            <td className="p-3">
                              <div>
                                <p className="font-medium">{user.userName}</p>
                                <p className="text-xs text-muted-foreground">
                                  {user.userEmail}
                                </p>
                              </div>
                            </td>
                            <td className="p-3">
                              <Badge
                                variant={
                                  user.status === "COMPLETED"
                                    ? "default"
                                    : user.status === "IN_PROGRESS"
                                    ? "secondary"
                                    : "outline"
                                }
                              >
                                {user.status.replace("_", " ")}
                              </Badge>
                            </td>
                            <td className="p-3 text-center font-medium">
                              {user.score}
                            </td>
                            <td className="p-3 text-center">
                              <span
                                className={`font-medium ${
                                  user.percentage >= 80
                                    ? "text-green-600"
                                    : user.percentage >= 60
                                    ? "text-yellow-600"
                                    : user.percentage > 0
                                    ? "text-red-600"
                                    : "text-gray-400"
                                }`}
                              >
                                {user.percentage}%
                              </span>
                            </td>
                            <td className="p-3 text-center">
                              {user.status === "COMPLETED" ? (
                                user.isPassed ? (
                                  <CheckCircle className="h-5 w-5 text-green-500 mx-auto" />
                                ) : (
                                  <XCircle className="h-5 w-5 text-red-500 mx-auto" />
                                )
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                            </td>
                            <td className="p-3 text-center">{user.attempts}</td>
                            <td className="p-3 text-center text-sm text-muted-foreground">
                              {user.completedAt
                                ? new Date(user.completedAt).toLocaleDateString()
                                : "-"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">
              No data available
            </p>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

