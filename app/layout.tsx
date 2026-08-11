import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "./context/AuthContext";
import Sidebar from "./components/Sidebar";

export const metadata: Metadata = {
  title: "CCAFP Mess - Disposition & Diet Portal",
  description: "CCAFP Mess Council Portal for managing cadet dispositions, announcements, dietary restrictions, and concerns.",
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
