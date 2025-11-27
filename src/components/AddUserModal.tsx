"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createUser } from "@/src/actions/users";
import { getAllCompanies } from "@/src/actions/companies";
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
import { Loader2 } from "lucide-react";

interface AddUserModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface Company {
  _id: string;
  name: string;
}

export function AddUserModal({ open, onOpenChange }: AddUserModalProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedRole, setSelectedRole] = useState<string>("STAFF");
  const [loadingCompanies, setLoadingCompanies] = useState(true);

  useEffect(() => {
    if (open) {
      loadCompanies();
    }
  }, [open]);

  async function loadCompanies() {
    setLoadingCompanies(true);
    const result = await getAllCompanies();
    if (result.success && result.data) {
      setCompanies(result.data);
    }
    setLoadingCompanies(false);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const role = formData.get("role") as "SUPER_ADMIN" | "COMPANY_ADMIN" | "STAFF";
    const companyId = formData.get("companyId") as string;
    const designation = formData.get("designation") as string;

    const data: any = {
      name: formData.get("name") as string,
      email: formData.get("email") as string,
      password: formData.get("password") as string,
      role: role,
    };

    // Only include companyId if it has a value
    if (companyId && companyId.trim() !== "") {
      data.companyId = companyId;
    }

    // Only include designation if it has a value
    if (designation && designation.trim() !== "") {
      data.designation = designation;
    }

    const result = await createUser(data);

    if (result.success) {
      onOpenChange(false);
      router.refresh();
      // Reset form
      (e.target as HTMLFormElement).reset();
      setSelectedRole("STAFF");
      setError("");
    } else {
      setError(result.message);
    }

    setLoading(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New User</DialogTitle>
          <DialogDescription>
            Create a new user account with specific role and company
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            {error && (
              <div className="p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg">
                {error}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2 col-span-2">
                <Label htmlFor="name">Full Name *</Label>
                <Input
                  id="name"
                  name="name"
                  placeholder="John Doe"
                  required
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="john@example.com"
                  required
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password *</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="Min 6 characters"
                  required
                  disabled={loading}
                  minLength={6}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="role">Role *</Label>
                <select
                  id="role"
                  name="role"
                  required
                  disabled={loading}
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="STAFF">Staff</option>
                  <option value="COMPANY_ADMIN">Admin</option>
                  <option value="SUPER_ADMIN">Super Admin</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="companyId">Company (Optional)</Label>
                <select
                  id="companyId"
                  name="companyId"
                  disabled={loading || loadingCompanies}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="">
                    {loadingCompanies
                      ? "Loading companies..."
                      : companies.length === 0
                      ? "No companies available"
                      : "Select company (optional)"}
                  </option>
                  {companies.map((company) => (
                    <option key={company._id} value={company._id}>
                      {company.name}
                    </option>
                  ))}
                </select>
                {!loadingCompanies && companies.length === 0 && (
                  <p className="text-xs text-muted-foreground">
                    No companies yet. User can be assigned to a company later.
                  </p>
                )}
              </div>

              <div className="space-y-2 col-span-2">
                <Label htmlFor="designation">Designation</Label>
                <Input
                  id="designation"
                  name="designation"
                  placeholder="e.g., HR Manager, Developer"
                  disabled={loading}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create User"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

