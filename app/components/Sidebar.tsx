"use client";

import React, { useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "../context/AuthContext";

export default function Sidebar() {
  const pathname = usePathname();
  const { user, login, logout, error: authError } = useAuth();
  
  // Custom States for Collapsible & Auto-collapse behaviors
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isPinned, setIsPinned] = useState(false);
  const timerRef = useRef<any>(null);

  const [isDark, setIsDark] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallBtn, setShowInstallBtn] = useState(false);
  
  // Login Modal State
  const [showLogin, setShowLogin] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const clearTimer = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const startTimer = () => {
    clearTimer();
    timerRef.current = setTimeout(() => {
      if (!isPinned && !showLogin) {
        setIsCollapsed(true);
      }
    }, 10000); // 10 seconds
  };

  // Expansion and hover events
  const handleMouseEnter = () => {
    clearTimer();
    setIsCollapsed(false); // Expand on hover
  };

  const handleMouseLeave = () => {
    if (!isPinned) {
      startTimer(); // Start 10s collapse timer when hover leaves
    }
  };

  const togglePin = (e: React.MouseEvent) => {
    e.stopPropagation();
    const nextPinned = !isPinned;
    setIsPinned(nextPinned);
    localStorage.setItem("sidebar-pinned", nextPinned ? "true" : "false");
    
    if (nextPinned) {
      clearTimer();
      setIsCollapsed(false);
    } else {
      startTimer();
    }
  };

  // Mount initialization
  useEffect(() => {
    setIsMounted(true);
    
    // Theme setup
    const savedTheme = localStorage.getItem("theme");
    const hasDarkClass = document.body.classList.contains("dark");
    if (savedTheme === "dark" || (!savedTheme && hasDarkClass)) {
      setIsDark(true);
      document.body.classList.add("dark");
    } else {
      setIsDark(false);
      document.body.classList.remove("dark");
    }

    // Pin setup
    const savedPin = localStorage.getItem("sidebar-pinned");
    if (savedPin === "true") {
      setIsPinned(true);
      setIsCollapsed(false);
    } else {
      // Auto-collapse 10 seconds after page load
      timerRef.current = setTimeout(() => {
        setIsCollapsed(true);
      }, 10000);
    }

    // Service Worker registration
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js")
        .then((reg) => console.log("Service Worker registered successfully:", reg.scope))
        .catch((err) => console.error("Service Worker registration failed:", err));
    }

    // PWA installation event listeners
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallBtn(true);
    };

    const handleAppInstalled = () => {
      setDeferredPrompt(null);
      setShowInstallBtn(false);
      console.log("PWA was installed");
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    if (window.matchMedia("(display-mode: standalone)").matches || (navigator as any).standalone) {
      setShowInstallBtn(false);
    }

    return () => {
      clearTimer();
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  // Update dynamic CSS variable
  useEffect(() => {
    if (!isMounted) return;
    const width = isCollapsed ? "80px" : "280px";
    document.documentElement.style.setProperty("--sidebar-width", width);
  }, [isCollapsed, isMounted]);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`User choice outcome: ${outcome}`);
    setDeferredPrompt(null);
    setShowInstallBtn(false);
  };

  // Lock body scroll and prevent collapse when login modal is open
  useEffect(() => {
    if (showLogin) {
      clearTimer();
      setIsCollapsed(false);
      document.body.classList.add("modal-open");
    } else {
      document.body.classList.remove("modal-open");
      if (!isPinned && isMounted) {
        startTimer();
      }
    }
    return () => {
      document.body.classList.remove("modal-open");
    };
  }, [showLogin, isMounted]);

  const toggleTheme = () => {
    const newDark = !isDark;
    setIsDark(newDark);
    if (newDark) {
      document.body.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.body.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    setIsSubmitting(true);
    
    try {
      const success = await login(username, password);
      if (success) {
        setShowLogin(false);
        setUsername("");
        setPassword("");
      }
    } catch (err: any) {
      setLocalError("Authentication failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isMounted) {
    return (
      <aside className="sidebar">
        <div className="brand-section">
          <div className="brand-logo-placeholder">CM</div>
          <div className="brand-text">
            <h1>CCAFP Mess</h1>
            <span>Cadet Disposition</span>
          </div>
        </div>
        <div className="nav-menu-loading" style={{ height: "200px" }}></div>
      </aside>
    );
  }

  const navItems = [
    {
      href: "/",
      label: "Dashboard",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 002 2h2a2 2 0 002-2z" />
        </svg>
      ),
    },
    {
      href: "/menu",
      label: "Weekly Menu",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      ),
    },
    {
      href: "/announcements",
      label: "Announcements",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
        </svg>
      ),
    },
    {
      href: "/dissemination",
      label: "Disseminations",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
    },
    {
      href: "/diet",
      label: "Signify Diet",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      ),
    },
    {
      href: "/concerns",
      label: "Submit Concerns",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
        </svg>
      ),
    },
  ];

  const isCamoChecklistVisible = user && (user.role === "CAMO" || user.role === "RMESSO");
  const isRedirectButtonVisible = user && (user.role === "RMESSO" || user.role === "MESS_OFFICER");

  return (
    <aside 
      className={`sidebar ${isCollapsed ? "collapsed" : ""}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Brand Section */}
      <div className="brand-section">
        <div className="brand-logo-placeholder">CM</div>
        <div className="brand-text">
          <h1>CCAFP Mess</h1>
          <span>Cadet Disposition</span>
        </div>
        
        {/* Toggle Pin/Lock Button */}
        <button 
          className="pin-sidebar-btn" 
          onClick={togglePin}
          title={isPinned ? "Unpin Sidebar (Auto-collapse enabled)" : "Pin Sidebar (Keep expanded)"}
        >
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2.5" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            style={{ 
              width: "14px", 
              height: "14px", 
              transform: isPinned ? "rotate(45deg)" : "none", 
              transition: "transform 0.2s ease" 
            }}
          >
            <line x1="12" y1="17" x2="12" y2="22"></line>
            <path d="M5 17h14v-1.76a2 2 0 0 0-.44-1.24l-2.78-3.5A2 2 0 0 1 15 9.25V5a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4.25c0 .4-.12.8-.35 1.12l-2.78 3.5a2 2 0 0 0-.44 1.24Z"></path>
          </svg>
        </button>
      </div>

      {/* Nav Menu */}
      <nav className="nav-menu">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`nav-item ${isActive ? "active" : ""}`}
            >
              {item.icon}
              <span>{item.label}</span>
            </Link>
          );
        })}

        {/* CAMO checklist link if visible */}
        {isCamoChecklistVisible && (
          <Link
            href="/camo-checklist"
            className={`nav-item ${pathname === "/camo-checklist" ? "active" : ""}`}
            style={{ 
              borderLeft: "3px solid var(--accent)", 
              backgroundColor: pathname === "/camo-checklist" ? "var(--accent-light)" : "transparent"
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
            <span style={{ color: "var(--secondary)" }}>CAMO Task Checklist</span>
          </Link>
        )}

        {/* Sheet redirect button if visible */}
        {isRedirectButtonVisible && (
          <div style={{ padding: "0.5rem 1rem", marginTop: "1rem" }} className="no-print">
            <a
              href="https://docs.google.com/spreadsheets/d/14dSYE1ntxNrnBdgSn-mWU5z-GMHK7qdMcKFchgh0pAQ/edit?gid=0#gid=0"
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-accent"
              style={{ width: "100%", fontSize: "0.75rem", padding: "8px 12px", display: "inline-flex", gap: "6px" }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ width: "14px", height: "14px" }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              <span>Edit Disposition</span>
            </a>
          </div>
        )}
      </nav>

      {/* Sidebar Footer */}
      <div className="sidebar-footer">
        {/* Auth Toggle Action */}
        {user ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "6px", width: "100%", marginBottom: "1rem" }} className="no-print">
            <span style={{ fontSize: "0.7rem", color: "var(--muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              Logged in as: <strong style={{ color: "var(--secondary)" }}>{user.username}</strong>
            </span>
            <button
              onClick={logout}
              className="btn btn-outline"
              style={{ width: "100%", padding: "6px 12px", fontSize: "0.75rem", borderColor: "var(--primary)" }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ width: "12px", height: "12px", marginRight: "4px" }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span>Log Out</span>
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowLogin(true)}
            className="btn btn-primary no-print"
            style={{ width: "100%", marginBottom: "1rem", padding: "8px 12px", fontSize: "0.75rem" }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ width: "12px", height: "12px", marginRight: "4px" }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span>Log In as Admin</span>
          </button>
        )}

        {/* PWA Install Button */}
        {showInstallBtn && (
          <button
            onClick={handleInstallClick}
            className="btn btn-primary no-print"
            style={{
              width: "100%",
              marginBottom: "1rem",
              padding: "8px 12px",
              fontSize: "0.75rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px",
              background: "linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%)",
              color: "#ffffff"
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ width: "14px", height: "14px" }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            <span>Install App</span>
          </button>
        )}

        {/* Theme Toggle */}
        <button className="theme-toggle-btn" onClick={toggleTheme} aria-label="Toggle Theme">
          {isDark ? (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m0-11.314l.707.707m11.314 11.314l.707-.707M12 5a7 7 0 100 14 7 7 0 000-14z" />
              </svg>
              <span>Light Mode</span>
            </>
          ) : (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
              <span>Dark Mode</span>
            </>
          )}
        </button>

        {/* Copyright */}
        <div className="copyright-text">
          CCAFP Mess Council &copy; 2026
        </div>
      </div>

      {/* Premium Login Modal Overlay */}
      {showLogin && isMounted && createPortal(
        <div className="modal-backdrop" onClick={() => setShowLogin(false)}>
          <div 
            className="modal-content" 
            onClick={(e) => e.stopPropagation()}
            style={{ 
              border: "1px solid var(--primary-light)",
              background: isDark ? "rgba(30, 41, 59, 0.9)" : "rgba(255, 255, 255, 0.9)",
              backdropFilter: "blur(12px)",
              maxWidth: "400px"
            }}
          >
            <div className="modal-header" style={{ borderBottom: "1.5px solid var(--border-color)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span className="brand-logo-placeholder" style={{ width: "28px", height: "28px", fontSize: "0.75rem" }}>CM</span>
                <h3 style={{ fontSize: "1.1rem", fontWeight: 800 }}>CCAFP Admin Login</h3>
              </div>
              <button className="modal-close-x" onClick={() => setShowLogin(false)}>&times;</button>
            </div>
            
            <form onSubmit={handleLoginSubmit}>
              <div className="modal-body" style={{ display: "flex", flexDirection: "column", gap: "1.25rem", padding: "1.5rem" }}>
                <p style={{ fontSize: "0.8rem", color: "var(--muted)", margin: 0 }}>
                  Authorized access only. Enter your credentials from the official Mess Disposition Sheet roster.
                </p>
                
                {(localError || authError) && (
                  <div 
                    className="alert-success animate-fade-in" 
                    style={{ 
                      backgroundColor: "#FEF2F2", 
                      border: "1px solid #FECACA", 
                      color: "#991B1B",
                      padding: "8px 12px",
                      borderRadius: "6px",
                      fontSize: "0.75rem"
                    }}
                  >
                    <strong>Error:</strong> {localError || authError}
                  </div>
                )}
                
                <div className="form-group">
                  <label htmlFor="modal-username">Username</label>
                  <input
                    id="modal-username"
                    type="text"
                    className="input-field"
                    placeholder="e.g. RMESSO or 1MESSO"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    style={{ textTransform: "uppercase" }}
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="modal-password">Password</label>
                  <input
                    id="modal-password"
                    type="password"
                    className="input-field"
                    placeholder="Enter password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              </div>
              
              <div className="modal-footer" style={{ borderTop: "1.5px solid var(--border-color)", padding: "1rem 1.5rem" }}>
                <button 
                  type="button" 
                  className="btn btn-outline" 
                  onClick={() => setShowLogin(false)}
                  style={{ marginRight: "10px", padding: "8px 16px" }}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  disabled={isSubmitting}
                  style={{ padding: "8px 20px" }}
                >
                  {isSubmitting ? (
                    <>
                      <svg className="animate-spin" style={{ width: "12px", height: "12px", marginRight: "4px" }} fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Authenticating...
                    </>
                  ) : "Log In"}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </aside>
  );
}
