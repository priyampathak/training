"use server";

import connectDB from "@/src/lib/db";
import User from "@/src/models/User";
import Company from "@/src/models/Company";
import { getSession } from "./auth";

export async function checkSubscriptionStatus() {
  try {
    const session = await getSession();

    if (!session || session.role === "SUPER_ADMIN") {
      return {
        success: true,
        data: {
          status: "ACTIVE",
          showModal: false,
        },
      };
    }

    await connectDB();

    const user = await User.findById(session.userId).lean();

    if (!user || !user.companyId) {
      return {
        success: true,
        data: {
          status: "ACTIVE",
          showModal: false,
        },
      };
    }

    const company = await Company.findById(user.companyId)
      .select("name subscription.status")
      .lean();

    if (!company) {
      return {
        success: true,
        data: {
          status: "ACTIVE",
          showModal: false,
        },
      };
    }

    const status = company.subscription?.status || "ACTIVE";
    const showModal = status === "PAST_DUE" || status === "CANCELLED";

    return {
      success: true,
      data: {
        status,
        showModal,
        companyName: company.name,
      },
    };
  } catch (error: any) {
    console.error("Check subscription status error:", error);
    return {
      success: false,
      message: error.message || "Failed to check subscription status",
      data: {
        status: "ACTIVE",
        showModal: false,
      },
    };
  }
}

