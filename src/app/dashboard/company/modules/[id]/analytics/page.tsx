import { redirect } from "next/navigation";
import { getSession } from "@/src/actions/auth";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default async function ModuleAnalyticsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getSession();

  if (!session || session.role !== "COMPANY_ADMIN") {
    redirect("/login");
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" asChild>
          <Link href="/dashboard/company/modules">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Module Analytics</h1>
          <p className="text-muted-foreground mt-2">
            Detailed analytics and insights for this training module
          </p>
        </div>
      </div>

      {/* Coming Soon Card */}
      <Card>
        <CardHeader>
          <CardTitle>Training Analytics Dashboard</CardTitle>
          <CardDescription>
            This feature is coming soon
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="py-8 text-center">
            <p className="text-muted-foreground">
              You'll be able to view comprehensive analytics, including:
            </p>
            <ul className="mt-4 space-y-2 text-sm text-muted-foreground max-w-md mx-auto">
              <li>✓ Completion trends over time</li>
              <li>✓ Average scores and pass rates</li>
              <li>✓ Question-by-question performance</li>
              <li>✓ Time spent on each slide</li>
              <li>✓ Staff performance leaderboard</li>
              <li>✓ Engagement metrics</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

