"use client";

import { useEffect, useState } from "react";
import { getAllModules, toggleModuleStatus, deleteModule } from "@/src/actions/modules";
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
import { CreateModuleWizard } from "@/src/components/CreateModuleWizard";
import { PreviewModuleModal } from "@/src/components/PreviewModuleModal";
import { EditModuleWizard } from "@/src/components/EditModuleWizard";
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

export default function ModulesPage() {
  const [modules, setModules] = useState<TrainingModule[]>([]);
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
  const [filterAssignment, setFilterAssignment] = useState<string>("all");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  useEffect(() => {
    loadModules();
  }, []);

  async function loadModules() {
    try {
      setLoading(true);
      setError(null);
      const result = await getAllModules();
      if (result.success && result.data) {
        setModules(result.data);
      } else {
        setError(result.message || "Failed to load modules");
      }
    } catch (err: any) {
      console.error("Error loading modules:", err);
      setError("An unexpected error occurred while loading modules");
    } finally {
      setLoading(false);
    }
  }

  async function handleStatusToggle(moduleId: string, currentStatus: boolean) {
    try {
      setUpdatingStatus(moduleId);
      const result = await toggleModuleStatus(moduleId, !currentStatus);
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
      const result = await deleteModule(moduleId);
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
            <h1 className="text-3xl font-bold tracking-tight">Training Modules</h1>
            <p className="text-muted-foreground mt-2">
              Manage global training modules available to all companies
            </p>
          </div>
          <Button onClick={() => setModalOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Module
          </Button>
        </div>

        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <XCircle className="h-16 w-16 text-destructive mb-4" />
            <h3 className="text-lg font-semibold mb-2">Error Loading Modules</h3>
            <p className="text-muted-foreground text-center mb-6 max-w-md">
              {error}
            </p>
            <Button onClick={loadModules}>
              Try Again
            </Button>
          </CardContent>
        </Card>

        <CreateModuleWizard open={modalOpen} onOpenChange={setModalOpen} />
      </div>
    );
  }

  // Sort modules: assigned to companies first, then global
  const sortedModules = [...modules].sort((a, b) => {
    // First sort by assignment (assigned companies come first)
    if (!a.isGlobal && b.isGlobal) return -1;
    if (a.isGlobal && !b.isGlobal) return 1;
    // Then by creation date (newest first)
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  // Apply filters
  const filteredModules = sortedModules.filter((module) => {
    // Filter by assignment
    if (filterAssignment !== "all") {
      if (filterAssignment === "global" && !module.isGlobal) return false;
      if (filterAssignment === "company" && module.isGlobal) return false;
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
  const categories = [...new Set(modules.map((m) => m.meta.category))];
  const companyModulesCount = modules.filter((m) => !m.isGlobal).length;
  const globalModulesCount = modules.filter((m) => m.isGlobal).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Training Modules</h1>
          <p className="text-muted-foreground mt-2">
            Manage global training modules available to all companies
          </p>
        </div>
        <Button onClick={() => setModalOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Module
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
              {activeModules.length} active
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
            <p className="text-xs text-muted-foreground mt-1">
              Available to companies
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Slides</CardTitle>
            <Presentation className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalSlides}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Content slides
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Quiz Questions</CardTitle>
            <HelpCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalQuestions}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Total questions
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-muted-foreground" />
            <CardTitle>Filters</CardTitle>
          </div>
          <CardDescription>
            Filter modules by assignment, category, difficulty, and status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Assignment Filter */}
            <div>
              <label className="text-sm font-medium mb-2 block">Assignment</label>
              <Select value={filterAssignment} onValueChange={setFilterAssignment}>
                <SelectTrigger>
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All ({modules.length})</SelectItem>
                  <SelectItem value="company">Company ({companyModulesCount})</SelectItem>
                  <SelectItem value="global">Global ({globalModulesCount})</SelectItem>
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
          {(filterAssignment !== "all" || filterCategory !== "all" || filterStatus !== "all") && (
            <div className="mt-4 flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Showing {filteredModules.length} of {modules.length} modules
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setFilterAssignment("all");
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
          <CardTitle>All Training Modules</CardTitle>
          <CardDescription>
            Company-assigned modules are shown first, followed by global modules
          </CardDescription>
        </CardHeader>
        <CardContent>
          {modules.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <BookOpen className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No modules yet</h3>
              <p className="text-muted-foreground mb-6">
                Create your first training module using the wizard
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
                    <th className="text-left p-4 font-medium">Assignment</th>
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
                        <div className="flex items-center gap-1 text-sm">
                          {module.isGlobal ? (
                            <span className="text-muted-foreground">Global</span>
                          ) : (
                            <>
                              <Building2 className="h-3 w-3 text-muted-foreground" />
                              {module.assignedCompanyName}
                            </>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="text-sm">{module.meta.category}</span>
                      </td>
                      <td className="p-4">
                        <Button
                          size="sm"
                          variant={module.isActive ? "default" : "outline"}
                          onClick={() => handleStatusToggle(module._id, module.isActive)}
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
                            variant="outline"
                            onClick={() => handlePreview(module)}
                            title="Preview Module"
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Preview
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEdit(module)}
                            title="Edit Module"
                            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                          >
                            <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            Edit
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
                        </div>
                      </td>
                    </tr>
                  )))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Module Wizard */}
      <CreateModuleWizard open={modalOpen} onOpenChange={setModalOpen} />

      {/* Preview Module Modal */}
      <PreviewModuleModal
        open={previewModalOpen}
        onOpenChange={setPreviewModalOpen}
        module={previewModule}
      />

      {/* Edit Module Modal */}
      <EditModuleWizard
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        module={editModule}
        onSuccess={loadModules}
      />
    </div>
  );
}

