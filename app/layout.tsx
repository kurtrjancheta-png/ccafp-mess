import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AuthProvider } from "./context/AuthContext";
import Sidebar from "./components/Sidebar";

export const metadata: Metadata = {
  title: "CCAFP Mess - Disposition & Diet Portal",
  description: "CCAFP Mess Council Portal for managing cadet dispositions, announcements, dietary restrictions, and concerns.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "CCAFP Mess",
  },
};

export const viewport: Viewport = {
  themeColor: "#1e293b",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <div className="app-container">
            <Sidebar />
            <main className="main-content">
              {children}
            </main>
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
