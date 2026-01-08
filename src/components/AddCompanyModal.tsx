"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createCompany, searchUserByEmail } from "@/src/actions/companies";
import { getAllPlans } from "@/src/actions/plans";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";
import { Loader2, Search, CheckCircle } from "lucide-react";

interface AddCompanyModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface Plan {
  _id: string;
  name: string;
  usersLimit: number;
  price: number;
}

interface User {
  _id: string;
  name: string;
  email: string;
  designation?: string;
}

export function AddCompanyModal({ open, onOpenChange }: AddCompanyModalProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [plans, setPlans] = useState<Plan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [searchEmail, setSearchEmail] = useState("");
  const [searching, setSearching] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userSearchError, setUserSearchError] = useState("");

  useEffect(() => {
    if (open) {
      loadPlans();
    }
  }, [open]);

  async function loadPlans() {
    const result = await getAllPlans();
    if (result.success && result.data) {
      setPlans(result.data.filter((p: any) => p.isActive));
    }
  }

  async function handleSearchUser() {
    if (!searchEmail.trim()) {
      setUserSearchError("Please enter an email");
      return;
    }

    setSearching(true);
    setUserSearchError("");
    setSelectedUser(null);

    const result = await searchUserByEmail(searchEmail.trim());

    if (result.success && result.data) {
      setSelectedUser(result.data);
    } else {
      setUserSearchError(result.message);
    }

    setSearching(false);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (!selectedPlan) {
      setError("Please select a plan");
      setLoading(false);
      return;
    }

    if (!selectedUser) {
      setError("Please search and select an admin user");
      setLoading(false);
      return;
    }

    const formData = new FormData(e.currentTarget);

    const data = {
      name: formData.get("name") as string,
      contactEmail: formData.get("contactEmail") as string,
      planId: selectedPlan._id,
      adminUserId: selectedUser._id,
    };

    const result = await createCompany(data);

    if (result.success) {
      onOpenChange(false);
      router.refresh();
      // Reset form
      (e.target as HTMLFormElement).reset();
      setSelectedPlan(null);
      setSelectedUser(null);
      setSearchEmail("");
    } else {
      setError(result.message);
    }

    setLoading(false);
  }

  function handlePlanChange(planId: string) {
    const plan = plans.find((p) => p._id === planId);
    setSelectedPlan(plan || null);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Company</DialogTitle>
          <DialogDescription>
            Create a new company and assign an admin user
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-6 py-4">
            {error && (
              <div className="p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg">
                {error}
              </div>
            )}

            {/* Company Details */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Company Name *</Label>
                <Input
                  id="name"
                  name="name"
                  placeholder="Acme Corporation"
                  required
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contactEmail">Contact Email *</Label>
                <Input
                  id="contactEmail"
                  name="contactEmail"
                  type="email"
                  placeholder="contact@acme.com"
                  required
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="planId">Select Plan *</Label>
                <select
                  id="planId"
                  name="planId"
                  required
                  disabled={loading || plans.length === 0}
                  onChange={(e) => handlePlanChange(e.target.value)}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="">
                    {plans.length === 0 ? "Loading plans..." : "Select a plan..."}
                  </option>
                  {plans.map((plan) => (
                    <option key={plan._id} value={plan._id}>
                      {plan.name} - {plan.usersLimit} users - ${plan.price}/mo
                    </option>
                  ))}
                </select>
              </div>

              {selectedPlan && (
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm font-medium">Users Limit</p>
                  <p className="text-2xl font-bold">{selectedPlan.usersLimit}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    From {selectedPlan.name} plan
                  </p>
                </div>
              )}
            </div>

            {/* Admin User Search */}
            <div className="space-y-4">
              <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                Assign Admin User
              </h3>

              <div className="space-y-2">
                <Label htmlFor="searchEmail">Search User by Email *</Label>
                <div className="flex gap-2">
                  <Input
                    id="searchEmail"
                    type="email"
                    placeholder="user@example.com"
                    value={searchEmail}
                    onChange={(e) => setSearchEmail(e.target.value)}
                    disabled={loading || searching}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleSearchUser();
                      }
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleSearchUser}
                    disabled={loading || searching}
                  >
                    {searching ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Search className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                {userSearchError && (
                  <p className="text-sm text-destructive">{userSearchError}</p>
                )}
              </div>

              {selectedUser && (
                <div className="p-4 border rounded-lg bg-green-50 dark:bg-green-950">
                  <div className="flex items-start gap-3">
                    <div className="mt-1">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-sm">{selectedUser.name}</p>
                      <p className="text-sm text-muted-foreground">{selectedUser.email}</p>
                      {selectedUser.designation && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {selectedUser.designation}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                onOpenChange(false);
                setSelectedPlan(null);
                setSelectedUser(null);
                setSearchEmail("");
                setError("");
                setUserSearchError("");
              }}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !selectedPlan || !selectedUser}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Company"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
