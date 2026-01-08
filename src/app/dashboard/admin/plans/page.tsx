"use client";

import { useEffect, useState } from "react";
import { getAllPlans, togglePlanStatus, deletePlan } from "@/src/actions/plans";
import { Button } from "@/src/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";
import { AddPlanModal } from "@/src/components/AddPlanModal";
import { Plus, CreditCard, DollarSign, Users, CheckCircle, XCircle, Loader2, Trash2 } from "lucide-react";

interface Plan {
  _id: string;
  name: string;
  features: string[];
  usersLimit: number;
  price: number;
  isActive: boolean;
  createdAt: Date;
}

export default function PlansPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  const [deletingPlan, setDeletingPlan] = useState<string | null>(null);

  useEffect(() => {
    loadPlans();
  }, []);

  async function loadPlans() {
    try {
      setLoading(true);
      setError(null);
      const result = await getAllPlans();
      if (result.success && result.data) {
        setPlans(result.data);
      } else {
        setError(result.message || "Failed to load plans");
      }
    } catch (err: any) {
      console.error("Error loading plans:", err);
      setError("An unexpected error occurred while loading plans");
    } finally {
      setLoading(false);
    }
  }

  async function handleStatusToggle(planId: string, currentStatus: boolean) {
    try {
      setUpdatingStatus(planId);
      const result = await togglePlanStatus(planId, !currentStatus);
      if (result.success) {
        await loadPlans();
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

  async function handleDelete(planId: string, planName: string) {
    if (!confirm(`Are you sure you want to delete "${planName}"?\n\nThis action cannot be undone.`)) {
      return;
    }

    try {
      setDeletingPlan(planId);
      const result = await deletePlan(planId);
      if (result.success) {
        await loadPlans();
        alert("Plan deleted successfully");
      } else {
        alert(result.message || "Failed to delete plan");
      }
    } catch (err: any) {
      console.error("Error deleting plan:", err);
      alert("An unexpected error occurred");
    } finally {
      setDeletingPlan(null);
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-2">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Loading plans...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Subscription Plans</h1>
            <p className="text-muted-foreground mt-2">
              Create and manage subscription plans for companies
            </p>
          </div>
          <Button onClick={() => setModalOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Plan
          </Button>
        </div>

        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <XCircle className="h-16 w-16 text-destructive mb-4" />
            <h3 className="text-lg font-semibold mb-2">Error Loading Plans</h3>
            <p className="text-muted-foreground text-center mb-6 max-w-md">
              {error}
            </p>
            <Button onClick={loadPlans}>
              Try Again
            </Button>
          </CardContent>
        </Card>

        <AddPlanModal open={modalOpen} onOpenChange={setModalOpen} />
      </div>
    );
  }

  const activePlans = plans.filter(p => p.isActive);
  const totalRevenue = plans.filter(p => p.isActive).reduce((sum, p) => sum + p.price, 0);
  const avgUsersLimit = plans.length > 0 ? Math.round(plans.reduce((sum, p) => sum + p.usersLimit, 0) / plans.length) : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Subscription Plans</h1>
          <p className="text-muted-foreground mt-2">
            Create and manage subscription plans for companies
          </p>
        </div>
        <Button onClick={() => setModalOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Plan
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Plans</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{plans.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Plans</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activePlans.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalRevenue.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Users Limit</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgUsersLimit}</div>
          </CardContent>
        </Card>
      </div>

      {/* Plans Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Plans</CardTitle>
          <CardDescription>
            Manage subscription plans, features, and pricing
          </CardDescription>
        </CardHeader>
        <CardContent>
          {plans.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <CreditCard className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No plans yet</h3>
              <p className="text-muted-foreground mb-6">
                Create your first subscription plan to get started
              </p>
              <Button onClick={() => setModalOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Plan
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-4 font-medium">Plan Name</th>
                    <th className="text-left p-4 font-medium">Features</th>
                    <th className="text-left p-4 font-medium">Users Limit</th>
                    <th className="text-left p-4 font-medium">Price</th>
                    <th className="text-left p-4 font-medium">Status</th>
                    <th className="text-left p-4 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {plans.map((plan) => (
                    <tr key={plan._id} className="border-b hover:bg-muted/50">
                      <td className="p-4">
                        <div className="font-medium">{plan.name}</div>
                      </td>
                      <td className="p-4">
                        <ul className="text-sm space-y-1">
                          {plan.features.map((feature, idx) => (
                            <li key={idx} className="flex items-center gap-2">
                              <CheckCircle className="h-3 w-3 text-green-600" />
                              {feature}
                            </li>
                          ))}
                        </ul>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{plan.usersLimit}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="font-semibold text-lg">
                          ${plan.price}
                          <span className="text-sm text-muted-foreground font-normal">/mo</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <Button
                          size="sm"
                          variant={plan.isActive ? "default" : "outline"}
                          onClick={() => handleStatusToggle(plan._id, plan.isActive)}
                          disabled={updatingStatus === plan._id}
                          className="min-w-[80px]"
                        >
                          {updatingStatus === plan._id ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : plan.isActive ? (
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
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDelete(plan._id, plan.name)}
                            disabled={deletingPlan === plan._id}
                          >
                            {deletingPlan === plan._id ? (
                              <Loader2 className="h-4 w-4 animate-spin text-destructive" />
                            ) : (
                              <Trash2 className="h-4 w-4 text-destructive" />
                            )}
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

      {/* Add Plan Modal */}
      <AddPlanModal open={modalOpen} onOpenChange={setModalOpen} />
    </div>
  );
}

