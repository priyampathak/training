"use client";

import { useEffect, useState } from "react";
import {
  getCompanyTrainingModules,
  toggleCompanyModuleStatus,
  deleteCompanyModule,
  getModuleAnalytics,
} from "@/src/actions/company-training";
import { Button } from "@/src/components/ui/button";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/src/components/ui/table";
import { Badge } from "@/src/components/ui/badge";
import { Progress } from "@/src/components/ui/progress";
import { CreateCompanyModuleWizard } from "@/src/components/CreateCompanyModuleWizard";
import { PreviewModuleModal } from "@/src/components/PreviewModuleModal";
import { EditCompanyModuleWizard } from "@/src/components/EditCompanyModuleWizard";
import {
  Plus,
  BookOpen,
  CheckCircle,
  XCircle,
  Loader2,
  Trash2,
  Building2,
  Presentation,
  HelpCircle,
  Eye,
  Filter,
  BarChart3,
  Users,
  Award,
  TrendingUp,
  Globe,
} from "lucide-react";
import { formatDate } from "@/src/lib/utils";

interface TrainingModule {
  _id: string;
  assignedCompanyId: string | null;
  assignedCompanyName: string;
  meta: {
    title: string;
    description: string;
    category: string;
    tags: string[];
    difficulty: "ROOKIE" | "PRO" | "LEGEND";
  };
  slides: any[];
  quiz: any[];
  assessment: {
    totalPoints: number;
    passingPoints: number;
    passingPercentage?: number;
  };
  settings: {
    isMandatory: boolean;
  };
  display?: {
    headingFontSize: number;
    contentFontSize: number;
  };
  isActive: boolean;
  isGlobal: boolean;
  createdBy: {
    _id: string;
    name: string;
    email: string;
  };
  createdAt: Date;
}

export default function CompanyTrainingPage() {
  const [modules, setModules] = useState<TrainingModule[]>([]);
  const [companyName, setCompanyName] = useState<string>("Your Company");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  const [deletingModule, setDeletingModule] = useState<string | null>(null);
  const [previewModule, setPreviewModule] = useState<TrainingModule | null>(null);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [editModule, setEditModule] = useState<TrainingModule | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);

  // Filter states
  const [filterType, setFilterType] = useState<string>("all");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  // Analytics modal states
  const [analyticsModalOpen, setAnalyticsModalOpen] = useState(false);
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);

  useEffect(() => {
    loadModules();
  }, []);

  async function loadModules() {
    try {
      setLoading(true);
      setError(null);
      console.log("🔄 Loading company training modules...");
      const result = await getCompanyTrainingModules();
      console.log("📥 Result:", result);
      
      if (result.success && result.data) {
        console.log("✅ Modules loaded:", result.data.modules.length);
        setModules(result.data.modules || []);
        setCompanyName(result.data.companyName || "Your Company");
      } else {
        console.error("❌ Failed to load:", result.message);
        setError(result.message || "Failed to load modules");
        setModules([]);
        setCompanyName("Your Company");
      }
    } catch (err: any) {
      console.error("❌ Error loading modules:", err);
      setError(err.message || "An unexpected error occurred while loading modules");
      setModules([]);
      setCompanyName("Your Company");
    } finally {
      setLoading(false);
      console.log("✅ Loading complete");
    }
  }

  async function handleViewAnalytics(moduleId: string) {
    try {
      setLoadingAnalytics(true);
      setAnalyticsModalOpen(true);
      setAnalyticsData(null);
      
      const result = await getModuleAnalytics(moduleId);
      
      if (result.success && result.data) {
        setAnalyticsData(result.data);
      } else {
        alert(result.message || "Failed to load analytics");
        setAnalyticsModalOpen(false);
      }
    } catch (err: any) {
      console.error("Error loading analytics:", err);
      alert("An unexpected error occurred");
      setAnalyticsModalOpen(false);
    } finally {
      setLoadingAnalytics(false);
    }
  }

  async function handleStatusToggle(moduleId: string) {
    try {
      setUpdatingStatus(moduleId);
      const result = await toggleCompanyModuleStatus(moduleId);
      if (result.success) {
        await loadModules();
      } else {
        alert(result.message || "Failed to update status");
      }
    } catch (err: any) {
      console.error("Error toggling status:", err);
      alert("An unexpected error occurred");
    } finally {
      setUpdatingStatus(null);
    }
  }

  async function handleDelete(moduleId: string, moduleTitle: string) {
    if (
      !confirm(
        `Are you sure you want to delete "${moduleTitle}"? This action cannot be undone.`
      )
    ) {
      return;
    }

    try {
      setDeletingModule(moduleId);
      const result = await deleteCompanyModule(moduleId);
      if (result.success) {
        alert(result.message);
        await loadModules();
      } else {
        alert(result.message || "Failed to delete module");
      }
    } catch (err: any) {
      console.error("Error deleting module:", err);
      alert("An unexpected error occurred");
    } finally {
      setDeletingModule(null);
    }
  }

  function handlePreview(module: TrainingModule) {
    setPreviewModule(module);
    setPreviewModalOpen(true);
  }

  function handleEdit(module: TrainingModule) {
    console.log("🔧 Opening edit modal for:", module.meta.title);
    setEditModule(module);
    setEditModalOpen(true);
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-2">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Loading modules...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Trainings</h1>
            <p className="text-muted-foreground mt-2">
              Manage training modules for {companyName}
            </p>
          </div>
          <Button onClick={() => setModalOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Create Module
          </Button>
        </div>

        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <XCircle className="h-16 w-16 text-destructive mb-4" />
            <h3 className="text-lg font-semibold mb-2">Error Loading Modules</h3>
            <p className="text-muted-foreground text-center mb-6 max-w-md">
              {error}
            </p>
            <Button onClick={loadModules}>Try Again</Button>
          </CardContent>
        </Card>

        <CreateCompanyModuleWizard
          open={modalOpen}
          onOpenChange={setModalOpen}
          companyName={companyName}
          onSuccess={loadModules}
        />
      </div>
    );
  }

  // Get unique categories for filter
  const categories = [...new Set(modules.map(m => m.meta.category))].sort();
  
  // Separate company and global modules
  const companyModules = modules.filter(m => !m.isGlobal);
  const globalModules = modules.filter(m => m.isGlobal);

  // Apply filters
  const filteredModules = modules.filter((module) => {
    // Filter by type
    if (filterType !== "all") {
      if (filterType === "company" && module.isGlobal) return false;
      if (filterType === "global" && !module.isGlobal) return false;
    }
    
    // Filter by category
    if (filterCategory !== "all" && module.meta.category !== filterCategory) return false;
    
    // Filter by status
    if (filterStatus !== "all") {
      if (filterStatus === "active" && !module.isActive) return false;
      if (filterStatus === "inactive" && module.isActive) return false;
    }
    
    return true;
  });

  const activeModules = modules.filter((m) => m.isActive);
  const totalSlides = modules.reduce((sum, m) => sum + (m.slides?.length || 0), 0);
  const totalQuestions = modules.reduce((sum, m) => sum + (m.quiz?.length || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Trainings</h1>
          <p className="text-muted-foreground mt-2">
            Manage training modules for {companyName}
          </p>
        </div>
        <Button onClick={() => setModalOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create Module
          </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Modules</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{modules.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {companyModules.length} company + {globalModules.length} global
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Modules</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeModules.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Available to staff</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Slides</CardTitle>
            <Presentation className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalSlides}</div>
            <p className="text-xs text-muted-foreground mt-1">Content slides</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Quiz Questions</CardTitle>
            <HelpCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalQuestions}</div>
            <p className="text-xs text-muted-foreground mt-1">Total questions</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-muted-foreground" />
            <CardTitle>Filters</CardTitle>
          </div>
          <CardDescription>
            Filter training modules by type, category, and status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Type Filter */}
            <div>
              <label className="text-sm font-medium mb-2 block">Type</label>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger>
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Modules ({modules.length})</SelectItem>
                  <SelectItem value="company">Company ({companyModules.length})</SelectItem>
                  <SelectItem value="global">Global ({globalModules.length})</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Category Filter */}
            <div>
              <label className="text-sm font-medium mb-2 block">Category</label>
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Status Filter */}
            <div>
              <label className="text-sm font-medium mb-2 block">Status</label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {/* Show filter results count */}
          {(filterType !== "all" || filterCategory !== "all" || filterStatus !== "all") && (
            <div className="mt-4 flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Showing {filteredModules.length} of {modules.length} modules
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setFilterType("all");
                  setFilterCategory("all");
                  setFilterStatus("all");
                }}
              >
                Clear Filters
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modules Table */}
      <Card>
        <CardHeader>
          <CardTitle>Company Training Modules</CardTitle>
          <CardDescription>
            Company modules shown first, followed by global modules
          </CardDescription>
        </CardHeader>
        <CardContent>
          {modules.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <BookOpen className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No modules yet</h3>
              <p className="text-muted-foreground mb-6">
                Create your first training module for your company
              </p>
              <Button onClick={() => setModalOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Create Module
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-4 font-medium">Module</th>
                    <th className="text-left p-4 font-medium">Type</th>
                    <th className="text-left p-4 font-medium">Category</th>
                    <th className="text-left p-4 font-medium">Status</th>
                    <th className="text-left p-4 font-medium">Created By</th>
                    <th className="text-left p-4 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredModules.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center">
                        <p className="text-muted-foreground">No modules match the selected filters</p>
                      </td>
                    </tr>
                  ) : (
                    filteredModules.map((module) => (
                      <tr key={module._id} className="border-b hover:bg-muted/50">
                        <td className="p-4">
                          <div>
                            <div className="font-medium">{module.meta.title}</div>
                            <div className="text-sm text-muted-foreground line-clamp-1">
                              {module.meta.description}
                            </div>
                            {module.meta.tags.length > 0 && (
                              <div className="flex gap-1 mt-1 flex-wrap">
                                {module.meta.tags.slice(0, 3).map((tag, idx) => (
                                  <span
                                    key={idx}
                                    className="text-xs bg-muted px-1.5 py-0.5 rounded"
                                  >
                                    {tag}
                                  </span>
                                ))}
                                {module.meta.tags.length > 3 && (
                                  <span className="text-xs text-muted-foreground">
                                    +{module.meta.tags.length - 3}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="p-4">
                          {module.isGlobal ? (
                            <div className="flex items-center gap-1 text-sm">
                              <Globe className="h-3 w-3 text-blue-600" />
                              <span className="text-blue-600">Global</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1 text-sm">
                              <Building2 className="h-3 w-3 text-primary" />
                              <span>Company</span>
                            </div>
                          )}
                        </td>
                        <td className="p-4">
                          <span className="text-sm">{module.meta.category}</span>
                        </td>
                        <td className="p-4">
                          {module.isGlobal ? (
                            <span className="text-xs text-muted-foreground">—</span>
                          ) : (
                            <Button
                              size="sm"
                              variant={module.isActive ? "default" : "outline"}
                              onClick={() => handleStatusToggle(module._id)}
                              disabled={updatingStatus === module._id}
                              className="min-w-[80px]"
                            >
                              {updatingStatus === module._id ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : module.isActive ? (
                                <>
                                  <CheckCircle className="mr-1 h-3 w-3" />
                                  Active
                                </>
                              ) : (
                                <>
                                  <XCircle className="mr-1 h-3 w-3" />
                                  Inactive
                                </>
                              )}
                            </Button>
                          )}
                        </td>
                        <td className="p-4">
                          <div className="text-sm">
                            <div className="font-medium">{module.createdBy.name}</div>
                            <div className="text-xs text-muted-foreground">
                              {formatDate(module.createdAt)}
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="default"
                              onClick={() => handleViewAnalytics(module._id)}
                              title="View Analytics"
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <BarChart3 className="h-4 w-4 mr-1" />
                              View
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handlePreview(module)}
                              title="Preview Module"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            {!module.isGlobal && (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleEdit(module)}
                                  title="Edit Module"
                                  className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                >
                                  <svg
                                    className="h-4 w-4"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                    />
                                  </svg>
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleDelete(module._id, module.meta.title)}
                                  disabled={deletingModule === module._id}
                                  title="Delete Module"
                                >
                                  {deletingModule === module._id ? (
                                    <Loader2 className="h-4 w-4 animate-spin text-destructive" />
                                  ) : (
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                  )}
                                </Button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Module Wizard */}
      <CreateCompanyModuleWizard
        open={modalOpen}
        onOpenChange={setModalOpen}
        companyName={companyName}
        onSuccess={loadModules}
      />

      {/* Preview Module Modal */}
      <PreviewModuleModal
        open={previewModalOpen}
        onOpenChange={setPreviewModalOpen}
        module={previewModule}
      />

      {/* Edit Module Modal */}
      <EditCompanyModuleWizard
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        module={editModule}
        onSuccess={loadModules}
      />

      {/* Analytics Modal */}
      <Dialog open={analyticsModalOpen} onOpenChange={setAnalyticsModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Module Analytics
            </DialogTitle>
            <DialogDescription>
              Real-time insights and performance metrics
            </DialogDescription>
          </DialogHeader>

          {loadingAnalytics ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Loading analytics...</p>
            </div>
          ) : analyticsData ? (
            <div className="space-y-6">
              {/* Module Info */}
              <div className="p-4 bg-muted/50 rounded-lg">
                <h3 className="font-semibold text-lg">{analyticsData.module.title}</h3>
                <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                  <span>{analyticsData.module.category}</span>
                  <span>•</span>
                  <span>{analyticsData.module.totalPoints} points</span>
                  <span>•</span>
                  <span>Pass: {analyticsData.module.passingPercentage}%</span>
                </div>
              </div>

              {/* Key Metrics */}
              <div className="grid gap-4 md:grid-cols-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Engagement
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{analyticsData.metrics.engagementRate}%</div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {analyticsData.metrics.totalUsersStarted} of {analyticsData.metrics.totalStaff} staff
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Completion
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">
                      {analyticsData.metrics.completedCount}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {analyticsData.metrics.completionRate}% completion rate
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Pass Rate
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-blue-600">
                      {analyticsData.metrics.passRate}%
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {analyticsData.metrics.passedCount} passed
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Avg Score
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{analyticsData.metrics.avgScore}%</div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Average performance
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Progress Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle>Progress Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-gray-400"></div>
                        <span className="text-sm">Not Started</span>
                      </div>
                      <span className="font-semibold">{analyticsData.metrics.notStartedCount}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                        <span className="text-sm">In Progress</span>
                      </div>
                      <span className="font-semibold">{analyticsData.metrics.inProgressCount}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-green-500"></div>
                        <span className="text-sm">Completed (Passed)</span>
                      </div>
                      <span className="font-semibold text-green-600">
                        {analyticsData.metrics.passedCount}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-red-500"></div>
                        <span className="text-sm">Completed (Failed)</span>
                      </div>
                      <span className="font-semibold text-red-600">
                        {analyticsData.metrics.failedCount}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Recent Completions */}
              {analyticsData.recentCompletions.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Recent Completions</CardTitle>
                    <CardDescription>
                      Latest {analyticsData.recentCompletions.length} completed attempts
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>User</TableHead>
                          <TableHead>Score</TableHead>
                          <TableHead>Result</TableHead>
                          <TableHead>Date</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {analyticsData.recentCompletions.map((completion: any, idx: number) => (
                          <TableRow key={idx}>
                            <TableCell>
                              <div>
                                <div className="font-medium text-sm">{completion.userName}</div>
                                <div className="text-xs text-muted-foreground">
                                  {completion.userEmail}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <span className="font-semibold">
                                {completion.score}/{completion.totalPoints}
                              </span>
                              <span className="text-xs text-muted-foreground ml-1">
                                ({completion.percentage}%)
                              </span>
                            </TableCell>
                            <TableCell>
                              {completion.isPassed ? (
                                <Badge variant="default" className="bg-green-600">Passed</Badge>
                              ) : (
                                <Badge variant="destructive">Failed</Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {completion.completedAt
                                ? formatDate(completion.completedAt)
                                : "N/A"}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              )}
            </div>
          ) : (
            <div className="py-12 text-center text-muted-foreground">
              No analytics data available
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
