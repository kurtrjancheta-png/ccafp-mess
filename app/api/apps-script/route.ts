import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const appsScriptUrl = process.env.NEXT_PUBLIC_APPS_SCRIPT_URL;

    if (!appsScriptUrl) {
      return NextResponse.json(
        { success: false, error: "Google Apps Script URL is not configured on the server." },
        { status: 500 }
      );
    }

    const response = await fetch(appsScriptUrl, {
      method: "POST",
      headers: {
        "Content-Type": "text/plain",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(`Apps Script responded with status: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Next.js Apps Script Proxy Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to communicate with Google Sheets." },
      { status: 500 }
    );
  }
}
