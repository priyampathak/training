"use client";

import { useEffect, useState } from "react";
import {
  getTeamMembers,
  addTeamMember,
  deleteTeamMember,
  toggleTeamMemberStatus,
} from "@/src/actions/team";
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
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import {
  Plus,
  Users,
  Trash2,
  Loader2,
  CheckCircle,
  XCircle,
  Shield,
  User,
} from "lucide-react";

interface TeamMember {
  _id: string;
  name: string;
  email: string;
  role: string;
  designation: string;
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string | null;
}

export default function TeamPage() {
  const [loading, setLoading] = useState(true);
  const [companyName, setCompanyName] = useState("");
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "STAFF" as "COMPANY_ADMIN" | "STAFF",
  });

  const loadTeamMembers = async () => {
    setLoading(true);
    try {
      console.log("🔄 Loading team members...");
      const result = await getTeamMembers();
      console.log("📥 Result:", result);

      if (result.success && result.data) {
        setCompanyName(result.data.companyName);
        setMembers(result.data.members);
        console.log("✅ Team members loaded:", result.data.members.length);
      } else {
        console.error("❌ Failed to load team members:", result.message);
        alert(result.message || "Failed to load team members");
      }
    } catch (error) {
      console.error("❌ Error loading team members:", error);
      alert("An error occurred while loading team members");
    } finally {
      setLoading(false);
      console.log("✅ Loading complete");
    }
  };

  useEffect(() => {
    loadTeamMembers();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const result = await addTeamMember(formData);

      if (result.success) {
        alert(result.message);
        setModalOpen(false);
        setFormData({ name: "", email: "", password: "", role: "STAFF" });
        await loadTeamMembers();
      } else {
        alert(result.message);
      }
    } catch (error) {
      console.error("Add team member error:", error);
      alert("An error occurred while adding team member");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (memberId: string) => {
    if (!confirm("Are you sure you want to delete this team member?")) {
      return;
    }

    try {
      const result = await deleteTeamMember(memberId);
      if (result.success) {
        alert(result.message);
        await loadTeamMembers();
      } else {
        alert(result.message);
      }
    } catch (error) {
      console.error("Delete team member error:", error);
      alert("An error occurred while deleting team member");
    }
  };

  const handleToggleStatus = async (memberId: string) => {
    try {
      const result = await toggleTeamMemberStatus(memberId);
      if (result.success) {
        alert(result.message);
        await loadTeamMembers();
      } else {
        alert(result.message);
      }
    } catch (error) {
      console.error("Toggle status error:", error);
      alert("An error occurred while toggling team member status");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Team Management</h1>
          <p className="text-muted-foreground mt-1">
            Manage your team members for {companyName}
          </p>
        </div>
        <Button onClick={() => setModalOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Team Member
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Members
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{members.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {members.filter((m) => m.isActive).length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inactive</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {members.filter((m) => !m.isActive).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Team Members Table */}
      <Card>
        <CardHeader>
          <CardTitle>Team Members</CardTitle>
          <CardDescription>
            All team members in your company
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-4 font-medium">Name</th>
                  <th className="text-left p-4 font-medium">Email</th>
                  <th className="text-left p-4 font-medium">Role</th>
                  <th className="text-left p-4 font-medium">Designation</th>
                  <th className="text-left p-4 font-medium">Status</th>
                  <th className="text-left p-4 font-medium">Last Login</th>
                  <th className="text-left p-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {members.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center p-8 text-muted-foreground">
                      No team members found. Add your first team member!
                    </td>
                  </tr>
                ) : (
                  members.map((member) => (
                    <tr key={member._id} className="border-b hover:bg-muted/50">
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          {member.role === "COMPANY_ADMIN" ? (
                            <Shield className="h-4 w-4 text-blue-500" />
                          ) : (
                            <User className="h-4 w-4 text-gray-500" />
                          )}
                          <span className="font-medium">{member.name}</span>
                        </div>
                      </td>
                      <td className="p-4 text-muted-foreground">
                        {member.email}
                      </td>
                      <td className="p-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            member.role === "COMPANY_ADMIN"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {member.role === "COMPANY_ADMIN" ? "Admin" : "Staff"}
                        </span>
                      </td>
                      <td className="p-4 text-muted-foreground">
                        {member.designation}
                      </td>
                      <td className="p-4">
                        {member.isActive ? (
                          <span className="flex items-center gap-1 text-green-600">
                            <CheckCircle className="h-4 w-4" />
                            Active
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-red-600">
                            <XCircle className="h-4 w-4" />
                            Inactive
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-muted-foreground">
                        {member.lastLoginAt
                          ? new Date(member.lastLoginAt).toLocaleDateString()
                          : "Never"}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleToggleStatus(member._id)}
                          >
                            {member.isActive ? (
                              <>
                                <XCircle className="h-4 w-4 mr-1" />
                                Deactivate
                              </>
                            ) : (
                              <>
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Activate
                              </>
                            )}
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDelete(member._id)}
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Delete
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Add Team Member Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Team Member</DialogTitle>
            <DialogDescription>
              Add a new member to your team
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">Full Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="John Doe"
                required
              />
            </div>

            <div>
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                placeholder="john@example.com"
                required
              />
            </div>

            <div>
              <Label htmlFor="password">Password *</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                placeholder="Minimum 4 characters"
                required
                minLength={4}
              />
            </div>

            <div>
              <Label htmlFor="role">Role *</Label>
              <Select
                value={formData.role}
                onValueChange={(value: "COMPANY_ADMIN" | "STAFF") =>
                  setFormData({ ...formData, role: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="STAFF">Staff</SelectItem>
                  <SelectItem value="COMPANY_ADMIN">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setModalOpen(false)}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Adding...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Member
                  </>
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

