import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";

async function handleSignOut(request: Request) {
  try {
    const supabase = await createClient();
    await supabase.auth.signOut();

    const cookieStore = await cookies();
    const { origin } = new URL(request.url);
    const response = NextResponse.redirect(`${origin}/login`, { status: 303 });

    // Explicitly purge and expire all Supabase auth cookies
    cookieStore.getAll().forEach((cookie) => {
      if (
        cookie.name.includes("supabase") ||
        cookie.name.startsWith("sb-") ||
        cookie.name.includes("auth-token")
      ) {
        cookieStore.delete(cookie.name);
        response.cookies.delete(cookie.name);
        response.cookies.set(cookie.name, "", {
          maxAge: 0,
          path: "/",
          expires: new Date(0),
        });
      }
    });

    return response;
  } catch (error: any) {
    const { origin } = new URL(request.url);
    return NextResponse.redirect(`${origin}/login`, { status: 303 });
  }
}

export async function POST(request: Request) {
  return handleSignOut(request);
}

export async function GET(request: Request) {
  return handleSignOut(request);
}
