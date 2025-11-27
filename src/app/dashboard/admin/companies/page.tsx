"use client";

import { useEffect, useState } from "react";
import { getAllCompanies, updateCompanySubscription } from "@/src/actions/companies";
import { Button } from "@/src/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";
import { AddCompanyModal } from "@/src/components/AddCompanyModal";
import { Plus, Building2, Users, Calendar, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { formatDate } from "@/src/lib/utils";

interface Company {
  _id: string;
  name: string;
  slug: string;
  contactEmail: string;
  branding: {
    primaryColor: string;
  };
  subscription: {
    planId?: string | null;
    planName: string;
    status: string;
    validTill?: Date;
  };
  limits: {
    maxStaff: number;
    maxStorageMB: number;
  };
  userCount: number;
  activeUserCount: number;
  adminName: string;
  adminEmail: string;
  createdAt: Date;
}

export default function CompaniesPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);

  useEffect(() => {
    loadCompanies();
  }, []);

  async function loadCompanies() {
    try {
      setLoading(true);
      setError(null);
      const result = await getAllCompanies();
      if (result.success && result.data) {
        setCompanies(result.data);
      } else {
        setError(result.message || "Failed to load companies");
      }
    } catch (err: any) {
      console.error("Error loading companies:", err);
      setError("An unexpected error occurred while loading companies");
    } finally {
      setLoading(false);
    }
  }

  async function handleStatusChange(companyId: string, status: "ACTIVE" | "PAST_DUE" | "CANCELLED") {
    try {
      setUpdatingStatus(companyId);
      const result = await updateCompanySubscription(companyId, status);
      if (result.success) {
        await loadCompanies();
      } else {
        alert(result.message || "Failed to update status");
      }
    } catch (err: any) {
      console.error("Error updating status:", err);
      alert("An unexpected error occurred");
    } finally {
      setUpdatingStatus(null);
    }
  }

  function getStatusColor(status: string) {
    switch (status) {
      case "ACTIVE":
        return "bg-green-100 text-green-700 border-green-200";
      case "PAST_DUE":
        return "bg-yellow-100 text-yellow-700 border-yellow-200";
      case "CANCELLED":
        return "bg-red-100 text-red-700 border-red-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  }

  function getPlanColor(plan: string) {
    switch (plan) {
      case "ENTERPRISE":
        return "bg-purple-100 text-purple-700";
      case "STARTER":
        return "bg-blue-100 text-blue-700";
      case "FREE":
        return "bg-gray-100 text-gray-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-2">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Loading companies...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Companies</h1>
            <p className="text-muted-foreground mt-2">
              Manage all companies and their subscriptions
            </p>
          </div>
          <Button onClick={() => setModalOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Company
          </Button>
        </div>

        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <XCircle className="h-16 w-16 text-destructive mb-4" />
            <h3 className="text-lg font-semibold mb-2">Error Loading Companies</h3>
            <p className="text-muted-foreground text-center mb-6 max-w-md">
              {error}
            </p>
            <Button onClick={loadCompanies}>
              Try Again
            </Button>
          </CardContent>
        </Card>

        <AddCompanyModal open={modalOpen} onOpenChange={setModalOpen} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Companies</h1>
          <p className="text-muted-foreground mt-2">
            Manage organizations and their subscriptions
          </p>
        </div>
        <Button onClick={() => setModalOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Company
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Companies</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{companies.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {companies.filter((c) => c.subscription.status === "ACTIVE").length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {companies.reduce((sum, c) => sum + c.userCount, 0)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cancelled</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {companies.filter((c) => c.subscription.status === "CANCELLED").length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Companies Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Companies</CardTitle>
          <CardDescription>
            Manage company details, subscriptions, and limits
          </CardDescription>
        </CardHeader>
        <CardContent>
          {companies.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Building2 className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No companies yet</h3>
              <p className="text-muted-foreground mb-6">
                Create your first company to get started
              </p>
              <Button onClick={() => setModalOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Company
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-4 font-medium">Company</th>
                    <th className="text-left p-4 font-medium">Admin</th>
                    <th className="text-left p-4 font-medium">Plan</th>
                    <th className="text-left p-4 font-medium">Status</th>
                    <th className="text-left p-4 font-medium">Users</th>
                    <th className="text-left p-4 font-medium">Limits</th>
                    <th className="text-left p-4 font-medium">Created</th>
                    <th className="text-left p-4 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {companies.map((company) => (
                    <tr key={company._id} className="border-b hover:bg-muted/50">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-semibold"
                            style={{ backgroundColor: company.branding.primaryColor }}
                          >
                            {company.name.substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-medium">{company.name}</div>
                            <div className="text-sm text-muted-foreground">
                              @{company.slug}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div>
                          <div className="font-medium text-sm">{company.adminName}</div>
                          {company.adminEmail && (
                            <div className="text-xs text-muted-foreground">
                              {company.adminEmail}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                          {company.subscription.planName}
                        </span>
                      </td>
                      <td className="p-4">
                        <select
                          value={company.subscription.status}
                          onChange={(e) =>
                            handleStatusChange(
                              company._id,
                              e.target.value as "ACTIVE" | "PAST_DUE" | "CANCELLED"
                            )
                          }
                          disabled={updatingStatus === company._id}
                          className={`text-xs font-medium px-2.5 py-1 rounded-full border ${getStatusColor(
                            company.subscription.status
                          )}`}
                        >
                          <option value="ACTIVE">Active</option>
                          <option value="PAST_DUE">Past Due</option>
                          <option value="CANCELLED">Cancelled</option>
                        </select>
                      </td>
                      <td className="p-4">
                        <div className="text-sm">
                          <div className="font-medium">{company.userCount} total</div>
                          <div className="text-muted-foreground">
                            {company.activeUserCount} active
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="text-sm">
                          <div>Staff: {company.userCount}/{company.limits.maxStaff}</div>
                          <div className="text-muted-foreground">
                            Storage: {company.limits.maxStorageMB} MB
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          {formatDate(company.createdAt)}
                        </div>
                      </td>
                      <td className="p-4">
                        <Button variant="ghost" size="sm">
                          View
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Company Modal */}
      <AddCompanyModal open={modalOpen} onOpenChange={setModalOpen} />
    </div>
  );
}

