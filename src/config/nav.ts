import { UserRole } from "@/src/models/User";
import {
  LayoutDashboard,
  Building2,
  Users,
  BookOpen,
  BarChart3,
  GraduationCap,
  CreditCard,
} from "lucide-react";

export interface NavItem {
  title: string;
  href: string;
  icon: any;
}

/**
 * Returns navigation items based on user role
 */
export function getNavItems(role: UserRole): NavItem[] {
  switch (role) {
    case "SUPER_ADMIN":
      return [
        {
          title: "Dashboard",
          href: "/dashboard/admin",
          icon: LayoutDashboard,
        },
        {
          title: "Companies",
          href: "/dashboard/admin/companies",
          icon: Building2,
        },
        {
          title: "Plans",
          href: "/dashboard/admin/plans",
          icon: CreditCard,
        },
        {
          title: "Users",
          href: "/dashboard/admin/users",
          icon: Users,
        },
        {
          title: "Global Modules",
          href: "/dashboard/admin/modules",
          icon: BookOpen,
        },
        {
          title: "Analytics",
          href: "/dashboard/admin/analytics",
          icon: BarChart3,
        },
      ];

    case "COMPANY_ADMIN":
      return [
        {
          title: "Dashboard",
          href: "/dashboard/company",
          icon: LayoutDashboard,
        },
        {
          title: "Create Training",
          href: "/dashboard/company/training",
          icon: BookOpen,
        },
        {
          title: "Training Modules",
          href: "/dashboard/company/modules",
          icon: BarChart3,
        },
        {
          title: "Team Members",
          href: "/dashboard/company/team",
          icon: Users,
        },
        {
          title: "Analytics",
          href: "/dashboard/company/analytics",
          icon: BarChart3,
        },
      ];

    case "STAFF":
      return [
        {
          title: "My Learning",
          href: "/dashboard/learn",
          icon: GraduationCap,
        },
        {
          title: "Available Courses",
          href: "/dashboard/learn/courses",
          icon: BookOpen,
        },
        {
          title: "My Progress",
          href: "/dashboard/learn/progress",
          icon: BarChart3,
        },
      ];

    default:
      return [];
  }
}

