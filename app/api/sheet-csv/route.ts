import { NextResponse } from "next/server";
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const gid = searchParams.get("gid");
    const sheetId = process.env.NEXT_PUBLIC_SPREADSHEET_ID || "14dSYE1ntxNrnBdgSn-mWU5z-GMHK7qdMcKFchgh0pAQ";

    if (!gid) {
      return NextResponse.json({ error: "Missing GID parameter" }, { status: 400 });
    }

    const url = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${gid}&t=${Date.now()}`;

    // Enforce a strict 6-second timeout on Google Sheets fetch
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
      }
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return NextResponse.json(
        { error: `Google Sheets responded with status: ${response.status}` },
        { status: response.status }
      );
    }

    const csvText = await response.text();

    return new Response(csvText, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        "Pragma": "no-cache",
        "Expires": "0",
      },
    });
  } catch (error: any) {
    console.error("API Sheet CSV Proxy Error:", error);
    const isTimeout = error.name === "AbortError";
    return NextResponse.json(
      { error: isTimeout ? "Connection to Google Sheets timed out after 6s." : (error.message || "Failed to fetch spreadsheet CSV") },
      { status: isTimeout ? 504 : 500 }
    );
  }
}

