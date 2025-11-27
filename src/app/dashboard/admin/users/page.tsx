"use client";

import { useEffect, useState } from "react";
import { getAllUsers, toggleUserStatus, deleteUser, getCurrentUser } from "@/src/actions/users";
import { Button } from "@/src/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";
import { AddUserModal } from "@/src/components/AddUserModal";
import { ResetPasswordModal } from "@/src/components/ResetPasswordModal";
import { Plus, Users as UsersIcon, UserCheck, UserX, Loader2, Trash2, Building2, XCircle, Key } from "lucide-react";
import { formatDate } from "@/src/lib/utils";

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  companyId: string | null;
  companyName: string | null;
  designation?: string;
  isActive: boolean;
  lastLoginAt?: Date;
  createdAt: Date;
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  const [deletingUser, setDeletingUser] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [resetPasswordModalOpen, setResetPasswordModalOpen] = useState(false);
  const [selectedUserForReset, setSelectedUserForReset] = useState<{
    _id: string;
    name: string;
    email: string;
  } | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      setError(null);
      
      // Get current user
      const currentUserResult = await getCurrentUser();
      if (currentUserResult.success && currentUserResult.data) {
        setCurrentUserId(currentUserResult.data.userId);
      }

      // Get all users
      const result = await getAllUsers();
      if (result.success && result.data) {
        setUsers(result.data);
      } else {
        setError(result.message || "Failed to load users");
      }
    } catch (err: any) {
      console.error("Error loading users:", err);
      setError("An unexpected error occurred while loading users");
    } finally {
      setLoading(false);
    }
  }

  async function handleStatusToggle(userId: string, currentStatus: boolean) {
    try {
      setUpdatingStatus(userId);
      const result = await toggleUserStatus(userId, !currentStatus);
      if (result.success) {
        await loadData();
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

  async function handleDelete(userId: string, userName: string, userRole: string) {
    if (userId === currentUserId) {
      alert("You cannot delete your own account!");
      return;
    }

    // First confirmation - basic warning
    if (!confirm(`Are you sure you want to delete user "${userName}"?\n\nThis action cannot be undone.`)) {
      return;
    }

    // Second confirmation for Admin users
    if (userRole === "COMPANY_ADMIN") {
      if (!confirm(`⚠️ WARNING: "${userName}" is an Admin user!\n\nDeleting this user will PERMANENTLY remove them from the database.\n\nAre you absolutely sure you want to proceed?`)) {
        return;
      }
    }

    try {
      setDeletingUser(userId);
      const result = await deleteUser(userId);
      if (result.success) {
        await loadData();
        alert("User has been permanently deleted from the database.");
      } else {
        alert(result.message || "Failed to delete user");
      }
    } catch (err: any) {
      console.error("Error deleting user:", err);
      alert("An unexpected error occurred");
    } finally {
      setDeletingUser(null);
    }
  }

  function getRoleBadgeColor(role: string) {
    switch (role) {
      case "SUPER_ADMIN":
        return "bg-purple-100 text-purple-700";
      case "COMPANY_ADMIN":
        return "bg-blue-100 text-blue-700";
      case "STAFF":
        return "bg-gray-100 text-gray-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-2">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Loading users...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Users</h1>
            <p className="text-muted-foreground mt-2">
              Manage all users across the platform
            </p>
          </div>
          <Button onClick={() => setModalOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add User
          </Button>
        </div>

        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <XCircle className="h-16 w-16 text-destructive mb-4" />
            <h3 className="text-lg font-semibold mb-2">Error Loading Users</h3>
            <p className="text-muted-foreground text-center mb-6 max-w-md">
              {error}
            </p>
            <Button onClick={loadData}>
              Try Again
            </Button>
          </CardContent>
        </Card>

        <AddUserModal open={modalOpen} onOpenChange={setModalOpen} />
      </div>
    );
  }

  const activeUsers = users.filter(u => u.isActive);
  const superAdmins = users.filter(u => u.role === "SUPER_ADMIN");
  const companyAdmins = users.filter(u => u.role === "COMPANY_ADMIN");
  const staff = users.filter(u => u.role === "STAFF");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Users</h1>
          <p className="text-muted-foreground mt-2">
            Manage all user accounts across the platform
          </p>
        </div>
        <Button onClick={() => setModalOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add User
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <UsersIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {staff.length} Staff, {companyAdmins.length} Admins, {superAdmins.length} Super
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <UserCheck className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeUsers.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {users.length > 0 ? Math.round((activeUsers.length / users.length) * 100) : 0}% of total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inactive Users</CardTitle>
            <UserX className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users.length - activeUsers.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Disabled or suspended
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Staff Members</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{staff.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Across all companies
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Users</CardTitle>
          <CardDescription>
            View and manage all registered users
          </CardDescription>
        </CardHeader>
        <CardContent>
          {users.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <UsersIcon className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No users yet</h3>
              <p className="text-muted-foreground mb-6">
                Create your first user account to get started
              </p>
              <Button onClick={() => setModalOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add User
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-4 font-medium">User</th>
                    <th className="text-left p-4 font-medium">Role</th>
                    <th className="text-left p-4 font-medium">Company</th>
                    <th className="text-left p-4 font-medium">Status</th>
                    <th className="text-left p-4 font-medium">Created</th>
                    <th className="text-left p-4 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user._id} className="border-b hover:bg-muted/50">
                      <td className="p-4">
                        <div>
                          <div className="font-medium">{user.name}</div>
                          <div className="text-sm text-muted-foreground">{user.email}</div>
                          {user.designation && (
                            <div className="text-xs text-muted-foreground mt-0.5">
                              {user.designation}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleBadgeColor(
                            user.role
                          )}`}
                        >
                          {user.role.replace("_", " ")}
                        </span>
                      </td>
                      <td className="p-4">
                        {user.companyName ? (
                          <div className="flex items-center gap-2">
                            <Building2 className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">{user.companyName}</span>
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="p-4">
                        <Button
                          size="sm"
                          variant={user.isActive ? "default" : "outline"}
                          onClick={() => handleStatusToggle(user._id, user.isActive)}
                          disabled={updatingStatus === user._id}
                          className="min-w-[80px]"
                        >
                          {updatingStatus === user._id ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : user.isActive ? (
                            <>
                              <UserCheck className="mr-1 h-3 w-3" />
                              Active
                            </>
                          ) : (
                            <>
                              <UserX className="mr-1 h-3 w-3" />
                              Inactive
                            </>
                          )}
                        </Button>
                      </td>
                      <td className="p-4">
                        <div className="text-sm text-muted-foreground">
                          {formatDate(user.createdAt)}
                        </div>
                        {user.lastLoginAt && (
                          <div className="text-xs text-muted-foreground mt-0.5">
                            Last: {formatDate(user.lastLoginAt)}
                          </div>
                        )}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          {/* Reset Password Button */}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedUserForReset({
                                _id: user._id,
                                name: user.name,
                                email: user.email,
                              });
                              setResetPasswordModalOpen(true);
                            }}
                            title="Reset Password"
                          >
                            <Key className="h-4 w-4 text-blue-600" />
                          </Button>

                          {/* Delete Button */}
                          {user._id !== currentUserId ? (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDelete(user._id, user.name, user.role)}
                              disabled={deletingUser === user._id}
                              title={user.role === "COMPANY_ADMIN" ? "Delete Admin (Extra confirmation required)" : "Delete User"}
                            >
                              {deletingUser === user._id ? (
                                <Loader2 className="h-4 w-4 animate-spin text-destructive" />
                              ) : (
                                <Trash2 className="h-4 w-4 text-destructive" />
                              )}
                            </Button>
                          ) : (
                            <span className="text-xs text-muted-foreground px-3">You</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add User Modal */}
      <AddUserModal open={modalOpen} onOpenChange={setModalOpen} />

      {/* Reset Password Modal */}
      <ResetPasswordModal
        open={resetPasswordModalOpen}
        onOpenChange={setResetPasswordModalOpen}
        user={selectedUserForReset}
        onSuccess={loadData}
      />
    </div>
  );
}
