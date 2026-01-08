"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createPlan } from "@/src/actions/plans";
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
import { Loader2, Plus, X } from "lucide-react";

interface AddPlanModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddPlanModal({ open, onOpenChange }: AddPlanModalProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [features, setFeatures] = useState<string[]>(["10 Users", "15 training modules/month"]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);

    const data = {
      name: formData.get("name") as string,
      features: features.filter(f => f.trim() !== ""),
      usersLimit: parseInt(formData.get("usersLimit") as string),
      price: parseFloat(formData.get("price") as string),
    };

    if (data.features.length === 0) {
      setError("At least one feature is required");
      setLoading(false);
      return;
    }

    const result = await createPlan(data);

    if (result.success) {
      onOpenChange(false);
      router.refresh();
      // Reset form
      (e.target as HTMLFormElement).reset();
      setFeatures(["10 Users", "15 training modules/month"]);
    } else {
      setError(result.message);
    }

    setLoading(false);
  }

  function addFeature() {
    setFeatures([...features, ""]);
  }

  function updateFeature(index: number, value: string) {
    const newFeatures = [...features];
    newFeatures[index] = value;
    setFeatures(newFeatures);
  }

  function removeFeature(index: number) {
    if (features.length > 1) {
      setFeatures(features.filter((_, i) => i !== index));
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Plan</DialogTitle>
          <DialogDescription>
            Define a subscription plan with features and limits
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            {error && (
              <div className="p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="name">Plan Name *</Label>
              <Input
                id="name"
                name="name"
                placeholder="e.g., Basic, Pro, Enterprise"
                required
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label>Features *</Label>
              <div className="space-y-2">
                {features.map((feature, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      value={feature}
                      onChange={(e) => updateFeature(index, e.target.value)}
                      placeholder="e.g., 10 Users, Unlimited modules"
                      disabled={loading}
                    />
                    {features.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeFeature(index)}
                        disabled={loading}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addFeature}
                disabled={loading}
                className="w-full"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Feature
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="usersLimit">Users Limit *</Label>
                <Input
                  id="usersLimit"
                  name="usersLimit"
                  type="number"
                  defaultValue="10"
                  min="1"
                  required
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="price">Price (USD) *</Label>
                <Input
                  id="price"
                  name="price"
                  type="number"
                  step="0.01"
                  defaultValue="199"
                  min="0"
                  required
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
                "Create Plan"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

