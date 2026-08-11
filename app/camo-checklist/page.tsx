"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "../context/AuthContext";

interface TaskItem {
  task: string;
  status: string;
  time: string;
  remarks: string;
}

export default function CamoChecklistPage() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const isAuthorized = user && (user.role === "CAMO" || user.role === "RMESSO");

  useEffect(() => {
    if (isAuthorized) {
      fetchTasks();
    }
  }, [isAuthorized]);

  // CSV parsing helper
  const parseCSV = (text: string): TaskItem[] => {
    const list: TaskItem[] = [];
    const lines = text.split(/\r?\n/);
    if (lines.length < 2) return [];

    const headers = lines[0].split(",").map(h => h.trim().toUpperCase().replace(/^"|"$/g, ""));
    const taskIdx = headers.indexOf("TASK");
    const statusIdx = headers.indexOf("STATUS");
    const timeIdx = headers.indexOf("TIME");
    const remarksIdx = headers.indexOf("REMARKS");

    if (taskIdx === -1) return [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      // Simple CSV split (handling double quotes)
      const parts: string[] = [];
      let current = "";
      let inQuotes = false;

      for (let j = 0; j < line.length; j++) {
        const char = line[j];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === "," && !inQuotes) {
          parts.push(current.trim().replace(/^"|"$/g, ""));
          current = "";
        } else {
          current += char;
        }
      }
      parts.push(current.trim().replace(/^"|"$/g, ""));

      if (parts[taskIdx]) {
        list.push({
          task: parts[taskIdx],
          status: statusIdx !== -1 && parts[statusIdx] ? parts[statusIdx].toUpperCase() : "PENDING",
          time: timeIdx !== -1 && parts[timeIdx] ? parts[timeIdx] : "",
          remarks: remarksIdx !== -1 && parts[remarksIdx] ? parts[remarksIdx] : ""
        });
      }
    }
    return list;
  };

  const fetchTasks = async () => {
    setLoading(true);
    setError(null);
    const sheetId = process.env.NEXT_PUBLIC_SPREADSHEET_ID || "14dSYE1ntxNrnBdgSn-mWU5z-GMHK7qdMcKFchgh0pAQ";
    const gid = "65446490"; // CAMO checklist GID
    const url = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${gid}&t=${Date.now()}`;

    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Google Sheet returned status ${response.status}`);
      }

      const csvText = await response.text();
      const parsedTasks = parseCSV(csvText);
      
      if (parsedTasks.length > 0) {
        setTasks(parsedTasks);
      } else {
        console.warn("CAMO Tasks sheet returned empty list.");
        setTasks([]);
        setError("Checklist spreadsheet appears to be empty.");
      }
    } catch (err: any) {
      console.error("Failed to fetch CAMO tasks dynamically:", err.message);
      setError(`Unable to connect to live checklist sheet. Error: ${err.message}`);
      setTasks([]);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusToggle = (index: number) => {
    setTasks(prev => 
      prev.map((item, idx) => {
        if (idx !== index) return item;
        
        const newStatus = item.status === "COMPLETED" ? "PENDING" : "COMPLETED";
        
        // Auto-set current time if marking completed and time is empty
        let newTime = item.time;
        if (newStatus === "COMPLETED" && !item.time) {
          const now = new Date();
          const hh = String(now.getHours()).padStart(2, "0");
          const mm = String(now.getMinutes()).padStart(2, "0");
          newTime = `${hh}:${mm}`;
        } else if (newStatus === "PENDING") {
          newTime = ""; // Clear time if marking pending
        }

        return {
          ...item,
          status: newStatus,
          time: newTime
        };
      })
    );
  };

  const handleFieldChange = (index: number, field: "time" | "remarks", value: string) => {
    setTasks(prev =>
      prev.map((item, idx) => {
        if (idx !== index) return item;
        return {
          ...item,
          [field]: value
        };
      })
    );
  };

  const handleSave = async () => {
    const appsScriptUrl = process.env.NEXT_PUBLIC_APPS_SCRIPT_URL;
    if (!appsScriptUrl) {
      alert("Google Apps Script URL is not configured. Please use Google Sheets directly to edit.");
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(null);

    const payload = {
      action: "saveCamoTasks",
      tasks: tasks
    };

    try {
      const response = await fetch(appsScriptUrl, {
        method: "POST",
        headers: {
          "Content-Type": "text/plain"
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`Apps Script returned status ${response.status}`);
      }

      const json = await response.json();
      if (json.success) {
        setSuccess("Checklist changes saved to Google Sheets successfully!");
        setTimeout(() => setSuccess(null), 5000);
      } else {
        throw new Error(json.error || "Failed to save tasks.");
      }
    } catch (err: any) {
      console.error("Failed to save CAMO checklist:", err);
      setError(`Failed to save to sheet: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  // ACCESS DENIED VIEW
  if (!isAuthorized) {
    return (
      <div 
        style={{ 
          maxWidth: "500px", 
          margin: "80px auto", 
          textAlign: "center", 
          padding: "2.5rem 1.5rem"
        }}
        className="card animate-fade-in"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          style={{ width: "64px", height: "64px", color: "var(--primary)", margin: "0 auto 1.5rem" }}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
          />
        </svg>
        <h3 style={{ fontSize: "1.4rem", marginBottom: "10px", color: "var(--secondary)" }}>Access Denied</h3>
        <p style={{ color: "var(--secondary-light)", fontSize: "0.9rem", lineHeight: "1.6", marginBottom: "2rem" }}>
          You do not have the required permissions to view the CAMO Task Checklist dashboard. This area is reserved for Cadet Assistants to the Mess Officer and the Regimental Mess Officer.
        </p>
        <Link href="/" className="btn btn-primary" style={{ width: "100%" }}>
          Return to Dashboard
        </Link>
      </div>
    );
  }

  // LOADER VIEW
  if (loading && tasks.length === 0) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "300px" }}>
        <svg className="animate-spin" style={{ width: "40px", height: "40px", color: "var(--primary)", marginBottom: "1rem" }} fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        <span style={{ fontSize: "0.9rem", color: "var(--muted)" }}>Loading checklist tasks...</span>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "900px", margin: "0 auto" }} className="animate-fade-in">
      {/* Page Header */}
      <header className="page-header">
        <div className="page-title">
          <h2>CAMO Task Checklist</h2>
          <p>
            Posted guards task supervisor portal. 
            Source:{" "}
            <span style={{ fontWeight: 700, color: error ? "var(--primary)" : "var(--success)" }}>
              {error ? "Offline" : "Live Spreadsheet Checklist"}
            </span>
          </p>
        </div>
        
        <div className="header-actions" style={{ display: "flex", gap: "10px" }}>
          <a
            href="https://docs.google.com/spreadsheets/d/14dSYE1ntxNrnBdgSn-mWU5z-GMHK7qdMcKFchgh0pAQ/edit?gid=65446490#gid=65446490"
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-outline"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ width: "16px", height: "16px" }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            Open Sheet GID 65446490
          </a>
          <button 
            className="btn btn-primary animate-pulse" 
            onClick={handleSave}
            disabled={saving || loading}
          >
            {saving ? (
              <>
                <svg className="animate-spin" style={{ width: "16px", height: "16px", marginRight: "6px" }} fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Saving...
              </>
            ) : "Save Checklist Changes"}
          </button>
        </div>
      </header>

      {/* Success Notification */}
      {success && (
        <div className="alert-success animate-fade-in" style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "1.5rem" }}>
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ width: "18px", height: "18px" }}>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{success}</span>
        </div>
      )}

      {/* Local/Fetch Error Warning */}
      {error && (
        <div 
          className="alert-success animate-fade-in" 
          style={{ 
            backgroundColor: "#FEF2F2", 
            border: "1px solid #FECACA", 
            color: "#991B1B", 
            marginBottom: "1.5rem",
            display: "flex",
            alignItems: "center",
            gap: "8px"
          }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ width: "18px", height: "18px" }}>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <strong>Notice:</strong> {error}
        </div>
      )}

      {/* Checklist Card */}
      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ padding: "1.25rem 1.5rem", backgroundColor: "var(--background)", borderBottom: "1.5px solid var(--border-color)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--primary)", textTransform: "uppercase" }}>Yap Hall Security Operations</span>
            <h3 style={{ margin: 0, fontSize: "1.1rem", color: "var(--secondary)" }}>Daily Posted Guard Checklist</h3>
          </div>
          <span className="badge badge-diet" style={{ padding: "4px 8px" }}>
            Active tasks: {tasks.filter(t => t.status !== "COMPLETED").length} left
          </span>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          {tasks.length > 0 ? (
            tasks.map((item, idx) => {
              const isCompleted = item.status === "COMPLETED";
              return (
                <div 
                  key={item.task + idx}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    padding: "1.5rem",
                    borderBottom: idx < tasks.length - 1 ? "1px solid var(--border-color)" : "none",
                    backgroundColor: isCompleted ? "var(--success-light)" : "transparent",
                    transition: "var(--transition)"
                  }}
                  className="camo-task-row"
                >
                  {/* Task label & checkbox */}
                  <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
                    <label 
                      style={{ 
                        display: "flex", 
                        alignItems: "center", 
                        justifyContent: "center", 
                        width: "24px", 
                        height: "24px", 
                        borderRadius: "6px", 
                        border: `2px solid ${isCompleted ? "var(--success)" : "var(--border-color)"}`, 
                        backgroundColor: isCompleted ? "var(--success)" : "transparent",
                        cursor: "pointer",
                        marginTop: "2px",
                        flexShrink: 0,
                        transition: "var(--transition)"
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={isCompleted}
                        onChange={() => handleStatusToggle(idx)}
                        style={{ display: "none" }}
                      />
                      {isCompleted && (
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="white" style={{ width: "16px", height: "16px" }}>
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </label>

                    <div style={{ flexGrow: 1 }}>
                      <span 
                        style={{ 
                          fontSize: "1rem", 
                          fontWeight: 700, 
                          color: isCompleted ? "var(--secondary-light)" : "var(--secondary)",
                          textDecoration: isCompleted ? "line-through" : "none",
                          transition: "var(--transition)"
                        }}
                      >
                        {item.task}
                      </span>
                      
                      {/* Subtitle status badge */}
                      <span 
                        className={`badge ${isCompleted ? "badge-army" : "badge-status"}`}
                        style={{ 
                          marginLeft: "8px", 
                          fontSize: "0.65rem", 
                          padding: "1px 6px",
                          backgroundColor: isCompleted ? "#DCFCE7" : "#F1F5F9",
                          color: isCompleted ? "#15803D" : "#64748B",
                          borderColor: isCompleted ? "#BBF7D0" : "#E2E8F0"
                        }}
                      >
                        {item.status}
                      </span>
                    </div>
                  </div>

                  {/* Task parameters: time & remarks (expandable layout) */}
                  <div 
                    style={{ 
                      marginTop: "1rem", 
                      paddingLeft: "36px", 
                      display: "grid", 
                      gridTemplateColumns: "150px 1fr", 
                      gap: "1.25rem",
                      alignItems: "center"
                    }}
                  >
                    <div className="form-group" style={{ margin: 0 }}>
                      <label style={{ fontSize: "0.7rem", color: "var(--muted)" }}>Completed Time</label>
                      <input
                        type="text"
                        className="input-field"
                        placeholder="e.g. 06:45"
                        value={item.time}
                        onChange={(e) => handleFieldChange(idx, "time", e.target.value)}
                        style={{ padding: "6px 10px", fontSize: "0.8rem" }}
                      />
                    </div>

                    <div className="form-group" style={{ margin: 0 }}>
                      <label style={{ fontSize: "0.7rem", color: "var(--muted)" }}>Remarks / Observations</label>
                      <input
                        type="text"
                        className="input-field"
                        placeholder="e.g. Temperature checked normal, no queue issues."
                        value={item.remarks}
                        onChange={(e) => handleFieldChange(idx, "remarks", e.target.value)}
                        style={{ padding: "6px 10px", fontSize: "0.8rem", width: "100%" }}
                      />
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <p style={{ textAlign: "center", color: "var(--muted)", padding: "2rem" }}>
              No tasks found in the checklist.
            </p>
          )}
        </div>
      </div>

      {/* Checklist Safety Advisory */}
      <div className="card animate-fade-in animate-stagger-2" style={{ borderLeft: "4px solid var(--accent)", marginTop: "2rem" }}>
        <h4 style={{ fontSize: "0.95rem", marginBottom: "0.5rem" }}>CCAFP Posted Guards Protocol</h4>
        <p style={{ fontSize: "0.8rem", color: "var(--secondary-light)", lineHeight: "1.5", margin: 0 }}>
          Checklist tasks are assigned by the Regimental Mess Officer (RMESSO). Toggling a task to completed automatically sets the current local time. Be sure to click <strong>"Save Checklist Changes"</strong> on the top right to commit your updates to the live Google Sheets database.
        </p>
      </div>
    </div>
  );
}
