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

    const textResponse = await response.text();
    try {
      const data = JSON.parse(textResponse);
      return NextResponse.json(data);
    } catch (parseError) {
      console.error("Failed to parse Apps Script response as JSON. Response was:", textResponse);
      
      // Parse HTML title or generic errors to provide helpful debugging feedback
      let cleanError = "Google Sheets returned an invalid response. Please ensure you redeployed the Apps Script as a 'New Deployment' and authorized all spreadsheet permissions.";
      
      const titleMatch = textResponse.match(/<title>([\s\S]*?)<\/title>/i);
      if (titleMatch && titleMatch[1]) {
        const titleText = titleMatch[1].trim();
        // Ignore generic Google login titles
        if (!titleText.includes("Google Accounts") && !titleText.includes("Sign in")) {
          cleanError = `Apps Script Error: ${titleText}`;
        }
      }
      
      if (textResponse.includes("Unknown POST action")) {
        cleanError = "Apps Script Error: Unknown POST action. Please redeploy your script using a new version/deployment to apply the weekly menu code.";
      }
      
      return NextResponse.json(
        { success: false, error: cleanError },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error("Next.js Apps Script Proxy Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to communicate with Google Sheets." },
      { status: 500 }
    );
  }
}
