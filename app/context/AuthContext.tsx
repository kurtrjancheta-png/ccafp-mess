"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export interface User {
  username: string;
  role: "RMESSO" | "MESS_OFFICER" | "CAMO";
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const FALLBACK_CREDENTIALS: Record<string, string> = {
  RMESSO: "ILYKRJANCHETA",
  "1MESSO": "ADMIN",
  "2MESSO": "ADMIN",
  "3MESSO": "ADMIN",
  "4MESSO": "ADMIN",
  AMESSO: "ADMIN",
  BMESSO: "ADMIN",
  CMESSO: "ADMIN",
  DMESSO: "ADMIN",
  EMESSO: "ADMIN",
  FMESSO: "ADMIN",
  GMESSO: "ADMIN",
  HMESSO: "ADMIN",
  CAMO1: "ADMIN",
  CAMO2: "ADMIN",
};

// Helper to parse CSV simply
const parseCSV = (text: string): Record<string, string> => {
  const credentialsMap: Record<string, string> = {};
  const lines = text.split(/\r?\n/);
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    // Split by comma, handling potential double quotes
    const parts = line.split(",").map(part => part.replace(/^"|"$/g, "").trim());
    if (parts.length >= 2) {
      const username = parts[0].toUpperCase();
      const password = parts[1]; // Passwords are case-sensitive
      if (username) {
        credentialsMap[username] = password;
      }
    }
  }
  
  return credentialsMap;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Restore session from localStorage on mount
  useEffect(() => {
    try {
      const savedUser = localStorage.getItem("ccafp_user");
      if (savedUser) {
        setUser(JSON.parse(savedUser));
      }
    } catch (e) {
      console.error("Failed to restore auth state", e);
    } finally {
      setLoading(false);
    }
  }, []);

  const login = async (usernameInput: string, passwordInput: string): Promise<boolean> => {
    setError(null);
    const username = usernameInput.trim().toUpperCase();
    const password = passwordInput; // Maintain case-sensitivity for password

    if (!username || !password) {
      setError("Please fill in all fields.");
      return false;
    }

    try {
      // Fetch dynamic credentials from Google Sheet
      const sheetId = process.env.NEXT_PUBLIC_SPREADSHEET_ID || "14dSYE1ntxNrnBdgSn-mWU5z-GMHK7qdMcKFchgh0pAQ";
      const gid = "1459510313"; // Credentials sheet GID
      const url = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${gid}&t=${Date.now()}`;
      
      let credentials = FALLBACK_CREDENTIALS;
      
      try {
        const response = await fetch(url);
        if (response.ok) {
          const csvText = await response.text();
          const parsedCreds = parseCSV(csvText);
          if (Object.keys(parsedCreds).length > 0) {
            credentials = parsedCreds;
          }
        } else {
          console.warn("Failed to fetch dynamic credentials sheet, using fallback database.");
        }
      } catch (fetchErr) {
        console.warn("Spreadsheet login check offline, using local fallback credentials:", fetchErr);
      }

      // Check if credentials match
      if (credentials[username] && credentials[username] === password) {
        // Determine role
        let role: "RMESSO" | "MESS_OFFICER" | "CAMO" = "MESS_OFFICER";
        if (username === "RMESSO") {
          role = "RMESSO";
        } else if (username === "CAMO1" || username === "CAMO2") {
          role = "CAMO";
        } else if (username.endsWith("MESSO")) {
          role = "MESS_OFFICER";
        }

        const authenticatedUser: User = { username, role };
        setUser(authenticatedUser);
        localStorage.setItem("ccafp_user", JSON.stringify(authenticatedUser));
        return true;
      } else {
        setError("Invalid username or password.");
        return false;
      }
    } catch (err: any) {
      console.error("Login verification failed", err);
      setError("An error occurred during authentication.");
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("ccafp_user");
    setError(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, error }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
