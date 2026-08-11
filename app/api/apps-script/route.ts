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
      
      // Strip HTML tags and scripts to extract the raw text error message
      const cleanText = textResponse
        .replace(/<script[\s\S]*?<\/script>/gi, "")
        .replace(/<style[\s\S]*?<\/style>/gi, "")
        .replace(/<[^>]*>/g, " ")
        .replace(/\s+/g, " ")
        .trim();

      let cleanError = "Google Sheets returned an invalid response. Please ensure you redeployed the Apps Script and authorized all spreadsheet permissions.";
      
      if (cleanText.includes("Error details:")) {
        const match = cleanText.match(/Error details:\s*([\s\S]*?)(?:$|\s+Google|\s+Help|\s+Learn)/i);
        if (match && match[1]) {
          cleanError = `Apps Script Error: ${match[1].trim()}`;
        }
      } else if (cleanText.includes("Exception:")) {
        const match = cleanText.match(/(Exception:\s*[\s\S]*?)(?:$|\s+Google|\s+Help|\s+Learn)/i);
        if (match && match[1]) {
          cleanError = `Apps Script Error: ${match[1].trim()}`;
        }
      } else if (cleanText.length > 0) {
        // Fallback to displaying a short snippet of the cleaned text
        const snippet = cleanText.substring(0, 180);
        cleanError = `Apps Script Response: ${snippet}${cleanText.length > 180 ? "..." : ""}`;
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
