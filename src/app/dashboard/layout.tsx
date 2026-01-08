import { redirect } from "next/navigation";
import { getSession } from "@/src/actions/auth";
import { Sidebar } from "@/src/components/Sidebar";
import { Topbar } from "@/src/components/Topbar";
import { SubscriptionStatusModal } from "@/src/components/SubscriptionStatusModal";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-background">
      <Sidebar role={session.role} userName={session.name} />
      <div className="pl-64">
        <Topbar userName={session.name} />
        <main className="p-8">{children}</main>
      </div>
      <SubscriptionStatusModal userRole={session.role} />
    </div>
  );
}

