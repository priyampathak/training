import { redirect } from "next/navigation";
import { getSession } from "@/src/actions/auth";
import { getCompanyModules } from "@/src/actions/company-modules";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";
import {
  BookOpen,
  Building2,
  Globe,
  BarChart3,
  Users,
  Target,
  Award,
  AlertCircle,
  Brain,
  FileText,
  TrendingUp,
  CheckCircle2,
  Clock,
  XCircle,
  Activity,
} from "lucide-react";
import { Badge } from "@/src/components/ui/badge";
import { Button } from "@/src/components/ui/button";
import { Progress } from "@/src/components/ui/progress";
import Link from "next/link";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function CompanyModulesPage() {
  const session = await getSession();

  if (!session || session.role !== "COMPANY_ADMIN") {
    redirect("/login");
  }

  const result = await getCompanyModules();

  if (!result.success || !result.data) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Training Modules</h1>
          <p className="text-muted-foreground mt-2">
            Failed to load modules. Please try again.
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

  const { companyModules, globalModules, companyName, stats } = result.data;


  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "IT & Security":
        return <Target className="h-4 w-4" />;
      case "Communication":
        return <Brain className="h-4 w-4" />;
      case "Management":
        return <Award className="h-4 w-4" />;
      case "HR":
        return <FileText className="h-4 w-4" />;
      default:
        return <BookOpen className="h-4 w-4" />;
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const renderModuleCard = (module: any, isCompanyModule: boolean) => (
    <Card
      key={module._id}
      className="hover:shadow-lg transition-all duration-200 border-l-4 border-l-primary/50"
    >
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-2 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <CardTitle className="text-lg">{module.title}</CardTitle>
              {module.isMandatory && (
                <Badge variant="destructive" className="whitespace-nowrap">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  Required
                </Badge>
              )}
            </div>
            <CardDescription className="line-clamp-2">
              {module.description}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Tags and Difficulty */}
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="outline" className="gap-1">
              {getCategoryIcon(module.category)}
              {module.category}
            </Badge>
            <Badge variant="secondary">
              {isCompanyModule ? "Company" : "Global"}
            </Badge>
          </div>

          {/* Module Stats */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <BookOpen className="h-4 w-4" />
              <span>{module.slidesCount} Slides</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Brain className="h-4 w-4" />
              <span>{module.questionsCount} Questions</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Award className="h-4 w-4" />
              <span>{module.totalPoints} Points</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Target className="h-4 w-4" />
              <span>Pass: {module.passingPoints}+</span>
            </div>
          </div>

          {/* Real-time Analytics Overview */}
          <div className="p-4 bg-muted/50 rounded-lg space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">Completion Rate</span>
              <span className="font-bold text-primary">
                {module.analytics.completionRate}%
              </span>
            </div>
            <Progress value={module.analytics.completionRate} className="h-2" />
            
            <div className="text-xs text-muted-foreground">
              {module.analytics.completed} of {module.analytics.totalStaff} staff completed
            </div>

            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="flex flex-col items-center p-2 bg-background rounded">
                <CheckCircle2 className="h-4 w-4 text-green-600 mb-1" />
                <span className="font-bold">{module.analytics.completed}</span>
                <span className="text-muted-foreground">Completed</span>
              </div>
              <div className="flex flex-col items-center p-2 bg-background rounded">
                <Clock className="h-4 w-4 text-blue-600 mb-1" />
                <span className="font-bold">{module.analytics.inProgress}</span>
                <span className="text-muted-foreground">In Progress</span>
              </div>
              <div className="flex flex-col items-center p-2 bg-background rounded">
                <XCircle className="h-4 w-4 text-gray-400 mb-1" />
                <span className="font-bold">{module.analytics.notStarted}</span>
                <span className="text-muted-foreground">Not Started</span>
              </div>
            </div>

            {/* Additional Metrics */}
            <div className="space-y-2 pt-2 border-t">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-orange-600" />
                  <span className="text-muted-foreground">Engagement:</span>
                </div>
                <span className="font-bold text-orange-600">
                  {module.analytics.engagementRate}%
                </span>
              </div>

              {module.analytics.completedCount > 0 && (
                <>
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-purple-600" />
                      <span className="text-muted-foreground">Avg Score:</span>
                    </div>
                    <span className="font-bold text-purple-600">
                      {module.analytics.averageScore}%
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <Award className="h-4 w-4 text-green-600" />
                      <span className="text-muted-foreground">Pass Rate:</span>
                    </div>
                    <span className="font-bold text-green-600">
                      {module.analytics.passRate}%
                    </span>
                  </div>

                  <div className="text-xs text-muted-foreground text-center">
                    {module.analytics.passed} passed, {module.analytics.failed} failed
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href={`/dashboard/company/modules/${module._id}/responses`}>
                <Users className="mr-2 h-4 w-4" />
                Responses ({module.analytics.uniqueUsersStarted})
              </Link>
            </Button>
            <Button variant="default" size="sm" asChild>
              <Link href={`/dashboard/company/modules/${module._id}/analytics`}>
                <BarChart3 className="mr-2 h-4 w-4" />
                Analytics
              </Link>
            </Button>
          </div>

          {/* Footer Info */}
          <div className="text-xs text-muted-foreground pt-2 border-t space-y-1">
            <div className="flex items-center justify-between">
              <span>Created by {module.createdBy.name}</span>
              <span>{formatDate(module.createdAt)}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Training Modules</h1>
        <p className="text-muted-foreground mt-2">
          Real-time analytics for {companyName} training modules
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Staff</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalStaff}</div>
            <p className="text-xs text-muted-foreground mt-1">Active members</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Company Modules</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.companyModulesCount}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Exclusive to {companyName}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Global Modules</CardTitle>
            <Globe className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.globalModulesCount}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Available to all
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Modules</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalModules}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Training courses
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Company-Specific Modules Section */}
      {companyModules.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-primary/10 p-2">
              <Building2 className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">
                {companyName} Training Modules
              </h2>
              <p className="text-sm text-muted-foreground">
                Exclusive modules with real-time performance tracking
              </p>
            </div>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2">
            {companyModules.map((module: any) => renderModuleCard(module, true))}
          </div>
        </div>
      )}

      {/* Global Modules Section */}
      {globalModules.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-blue-500/10 p-2">
              <Globe className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Global Training Modules</h2>
              <p className="text-sm text-muted-foreground">
                Universal modules with company-specific analytics
              </p>
            </div>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2">
            {globalModules.map((module: any) => renderModuleCard(module, false))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {companyModules.length === 0 && globalModules.length === 0 && (
        <Card>
          <CardHeader>
            <CardTitle>No Training Modules Available</CardTitle>
            <CardDescription>
              There are currently no training modules for your organization.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-sm text-muted-foreground max-w-md">
                Contact the Super Admin to create training modules for your company,
                or wait for global modules to be published.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
