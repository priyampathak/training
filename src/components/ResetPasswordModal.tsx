"use client";

import { useState } from "react";
import { resetUserPassword } from "@/src/actions/users";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { Key, Loader2, CheckCircle2, AlertCircle } from "lucide-react";

interface ResetPasswordModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: {
    _id: string;
    name: string;
    email: string;
  } | null;
  onSuccess: () => void;
}

export function ResetPasswordModal({
  open,
  onOpenChange,
  user,
  onSuccess,
}: ResetPasswordModalProps) {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleReset = () => {
    setNewPassword("");
    setConfirmPassword("");
    setError("");
    setSuccess(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);

    // Validation
    if (!newPassword || newPassword.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (!user) {
      setError("User information is missing");
      return;
    }

    setLoading(true);

    try {
      const result = await resetUserPassword(user._id, newPassword);

      if (result.success) {
        setSuccess(true);
        setNewPassword("");
        setConfirmPassword("");
        
        // Auto-close after showing success message
        setTimeout(() => {
          onOpenChange(false);
          onSuccess();
          handleReset();
        }, 1500);
      } else {
        setError(result.message || "Failed to reset password");
      }
    } catch (err: any) {
      console.error("Error resetting password:", err);
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) {
          handleReset();
        }
        onOpenChange(isOpen);
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-blue-100 p-2">
              <Key className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <DialogTitle>Reset Password</DialogTitle>
              <DialogDescription>
                Set a new password for this user
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {user && (
          <div className="rounded-lg bg-muted p-3 mb-4">
            <p className="text-sm font-medium">{user.name}</p>
            <p className="text-xs text-muted-foreground">{user.email}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="newPassword">New Password</Label>
            <Input
              id="newPassword"
              type="password"
              placeholder="Enter new password (min 6 characters)"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              disabled={loading || success}
              required
              minLength={6}
            />
            <p className="text-xs text-muted-foreground">
              Minimum 6 characters required
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="Re-enter new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={loading || success}
              required
              minLength={6}
            />
          </div>

          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 p-3 flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {success && (
            <div className="rounded-lg bg-green-50 border border-green-200 p-3 flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-green-800">
                Password reset successfully! Closing...
              </p>
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                handleReset();
                onOpenChange(false);
              }}
              disabled={loading || success}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || success}
              className="flex-1"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Resetting...
                </>
              ) : success ? (
                <>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Success!
                </>
              ) : (
                <>
                  <Key className="mr-2 h-4 w-4" />
                  Reset Password
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

