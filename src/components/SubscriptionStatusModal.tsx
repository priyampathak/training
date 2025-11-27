"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";
import { Button } from "@/src/components/ui/button";
import { AlertTriangle, XCircle, Loader2 } from "lucide-react";
import { checkSubscriptionStatus } from "@/src/actions/subscription";
import { logout } from "@/src/actions/auth";

interface SubscriptionStatusModalProps {
  userRole: string;
}

export function SubscriptionStatusModal({
  userRole,
}: SubscriptionStatusModalProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<string>("ACTIVE");
  const [companyName, setCompanyName] = useState<string>("");
  const [remainingTime, setRemainingTime] = useState<number>(5);
  const [checking, setChecking] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    // Skip for Super Admin
    if (userRole === "SUPER_ADMIN") {
      setChecking(false);
      return;
    }

    checkStatus();
  }, [userRole]);

  const checkStatus = async () => {
    try {
      const result = await checkSubscriptionStatus();
      if (result.success && result.data) {
        setStatus(result.data.status);
        setCompanyName(result.data.companyName || "");
        if (result.data.showModal) {
          setOpen(true);
        }
      }
    } catch (error) {
      console.error("Failed to check subscription status:", error);
    } finally {
      setChecking(false);
    }
  };

  // Auto-dismiss for PAST_DUE after 5 seconds
  useEffect(() => {
    if (open && status === "PAST_DUE") {
      const interval = setInterval(() => {
        setRemainingTime((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            setOpen(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [open, status]);

  // Don't render anything while checking or if not applicable
  if (checking || userRole === "SUPER_ADMIN") {
    return null;
  }

  // PAST_DUE: 5-second modal
  if (status === "PAST_DUE") {
    return (
      <Dialog open={open} onOpenChange={() => {}}>
        <DialogContent
          className="sm:max-w-md"
          onPointerDownOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-yellow-100 p-2">
                <AlertTriangle className="h-6 w-6 text-yellow-600" />
              </div>
              <div>
                <DialogTitle className="text-xl">Payment Due</DialogTitle>
                <DialogDescription className="text-base mt-1">
                  Your subscription payment is overdue
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <div className="space-y-4">
            {companyName && (
              <div className="rounded-lg bg-yellow-50 border border-yellow-200 p-4">
                <p className="text-sm text-yellow-800">
                  <strong>Company:</strong> {companyName}
                </p>
              </div>
            )}
            <p className="text-sm text-muted-foreground">
              Please contact your administrator to update the payment
              information to continue using the platform without interruption.
            </p>
            <div className="flex items-center justify-between pt-2">
              <p className="text-xs text-muted-foreground">
                This message will close in{" "}
                <span className="font-bold text-yellow-600">
                  {remainingTime}
                </span>{" "}
                seconds
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // CANCELLED: Persistent modal
  if (status === "CANCELLED") {
    return (
      <Dialog open={open} onOpenChange={() => {}}>
        <DialogContent
          className="sm:max-w-md"
          onPointerDownOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-red-100 p-2">
                <XCircle className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <DialogTitle className="text-xl">Subscription Expired</DialogTitle>
                <DialogDescription className="text-base mt-1">
                  Your subscription has been cancelled
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <div className="space-y-4">
            {companyName && (
              <div className="rounded-lg bg-red-50 border border-red-200 p-4">
                <p className="text-sm text-red-800">
                  <strong>Company:</strong> {companyName}
                </p>
              </div>
            )}
            <div className="rounded-lg bg-red-50 border border-red-200 p-4">
              <p className="text-sm text-red-800 font-semibold">
                Access Restricted
              </p>
              <p className="text-xs text-red-700 mt-1">
                Your company's subscription has been cancelled. Please contact
                your administrator to renew the subscription and regain access
                to the platform.
              </p>
            </div>
            <p className="text-sm text-muted-foreground">
              To continue using the platform, your administrator must renew the
              subscription. All features and data are currently unavailable.
            </p>
            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={async () => {
                  setLoggingOut(true);
                  try {
                    await logout();
                    // Force a hard redirect to clear all client state
                    window.location.href = "/login";
                  } catch (error) {
                    console.error("Logout failed:", error);
                    setLoggingOut(false);
                  }
                }}
                disabled={loggingOut}
              >
                {loggingOut ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Logging out...
                  </>
                ) : (
                  "Logout"
                )}
              </Button>
              <Button
                className="flex-1 bg-red-600 hover:bg-red-700"
                onClick={() => {
                  // Contact admin functionality can be added here
                  alert(
                    "Please contact your administrator at their registered email to renew the subscription."
                  );
                }}
                disabled={loggingOut}
              >
                Contact Admin
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return null;
}

