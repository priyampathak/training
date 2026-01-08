import { redirect } from "next/navigation";
import { getSession } from "@/src/actions/auth";

export default async function AdminLoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Check if user is already logged in
  const session = await getSession();

  if (session) {
    // Redirect based on role
    if (session.role === "SUPER_ADMIN") {
      redirect("/dashboard/admin");
    } else if (session.role === "COMPANY_ADMIN") {
      redirect("/dashboard/company");
    } else if (session.role === "STAFF") {
      redirect("/dashboard/learn");
    } else {
      redirect("/dashboard");
    }
  }

  return <>{children}</>;
}

