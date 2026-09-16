import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedHost } from "@/lib/supabase/server";

export async function GET() {
  try {
    const host = await getAuthenticatedHost();

    if (!host) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const teamMembers = await prisma.teamMember.findMany({
      where: { hostId: host.id },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      success: true,
      teamMembers,
      currentUserRole: host.role,
      isOwner: host.isOwner,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const host = await getAuthenticatedHost();

    if (!host) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    if (host.role !== "OWNER" && host.role !== "MANAGER") {
      return NextResponse.json(
        { success: false, error: "Forbidden. Only Owners and Managers can invite team members." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { email, displayName, role = "DOOR_STAFF" } = body;

    if (!email || !displayName) {
      return NextResponse.json(
        { success: false, error: "Email and Display Name are required." },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Prevent inviting oneself
    if (normalizedEmail === host.email.toLowerCase()) {
      return NextResponse.json(
        { success: false, error: "You are already the owner of this organization." },
        { status: 400 }
      );
    }

    // Check if already in team
    const existing = await prisma.teamMember.findFirst({
      where: {
        hostId: host.id,
        email: normalizedEmail,
      },
    });

    if (existing) {
      return NextResponse.json(
        { success: false, error: "This email has already been added to your team." },
        { status: 400 }
      );
    }

    // Check if user has an existing Host record we can link
    const existingUserHost = await prisma.host.findUnique({
      where: { email: normalizedEmail },
      select: { id: true },
    });

    const member = await prisma.teamMember.create({
      data: {
        hostId: host.id,
        email: normalizedEmail,
        displayName: displayName.trim(),
        role: role.toUpperCase(),
        userId: existingUserHost?.id || null,
      },
    });

    return NextResponse.json({
      success: true,
      member,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const host = await getAuthenticatedHost();

    if (!host) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    if (host.role !== "OWNER" && host.role !== "MANAGER") {
      return NextResponse.json(
        { success: false, error: "Forbidden. Only Owners and Managers can remove team members." },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const memberId = searchParams.get("memberId");

    if (!memberId) {
      return NextResponse.json(
        { success: false, error: "memberId is required" },
        { status: 400 }
      );
    }

    // Verify member belongs to this host
    const member = await prisma.teamMember.findFirst({
      where: { id: memberId, hostId: host.id },
    });

    if (!member) {
      return NextResponse.json(
        { success: false, error: "Team member not found in your organization." },
        { status: 404 }
      );
    }

    // Managers cannot remove other Managers or Owners
    if (host.role === "MANAGER" && (member.role === "OWNER" || member.role === "MANAGER")) {
      return NextResponse.json(
        { success: false, error: "Managers can only remove Door Staff." },
        { status: 403 }
      );
    }

    await prisma.teamMember.delete({
      where: { id: memberId },
    });

    return NextResponse.json({
      success: true,
      message: "Team member removed successfully.",
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
