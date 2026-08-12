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
    setSaving(true);
    setError(null);
    setSuccess(null);

    const payload = {
      action: "saveCamoTasks",
      tasks: tasks
    };

    try {
      const response = await fetch("/api/apps-script", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `Apps Script returned status ${response.status}`);
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
          {(() => {
            if (tasks.length === 0) {
              return (
                <p style={{ textAlign: "center", color: "var(--muted)", padding: "2rem" }}>
                  No tasks found in the checklist.
                </p>
              );
            }

            // Group tasks by category
            const normalTasksBeforeL: { idx: number; item: TaskItem }[] = [];
            const normalTasksAfterM: { idx: number; item: TaskItem }[] = [];
            const lGroup: { idx: number; item: TaskItem; label: string }[] = [];
            const mGroup: { idx: number; item: TaskItem; area: string; timeLabel: string }[] = [];

            tasks.forEach((item, idx) => {
              const lMatch = item.task.match(/^l\.\s+Checked\s+sanitary\s+measures:\s*(.+)$/i);
              const mMatch = item.task.match(/^m\.\s+Ensured\s+cleanliness\s+&\s+orderliness:\s*(.+?)\s*\((.+?)\)$/i);

              if (lMatch) {
                lGroup.push({ idx, item, label: lMatch[1].trim() });
              } else if (mMatch) {
                mGroup.push({ idx, item, area: mMatch[1].trim(), timeLabel: mMatch[2].trim() });
              } else {
                const firstChar = item.task.trim()[0]?.toLowerCase();
                if (firstChar >= "n" && firstChar <= "z") {
                  normalTasksAfterM.push({ idx, item });
                } else {
                  normalTasksBeforeL.push({ idx, item });
                }
              }
            });

            const renderNormalTaskRow = (item: TaskItem, idx: number) => {
              const isCompleted = item.status === "COMPLETED";
              return (
                <div 
                  key={item.task + idx}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    padding: "1.5rem",
                    borderBottom: "1px solid var(--border-color)",
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

                  {/* Task parameters: time & remarks */}
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
                        placeholder="e.g. Completed without issues."
                        value={item.remarks}
                        onChange={(e) => handleFieldChange(idx, "remarks", e.target.value)}
                        style={{ padding: "6px 10px", fontSize: "0.8rem", width: "100%" }}
                      />
                    </div>
                  </div>
                </div>
              );
            };

            const renderLGroup = () => {
              if (lGroup.length === 0) return null;
              
              const firstItem = lGroup[0].item;
              const isGroupCompleted = lGroup.every(g => g.item.status === "COMPLETED");

              return (
                <div 
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    padding: "1.5rem",
                    borderBottom: "1px solid var(--border-color)",
                    backgroundColor: "rgba(248, 250, 252, 0.5)",
                    transition: "var(--transition)"
                  }}
                  className="camo-task-row"
                >
                  <div style={{ flexGrow: 1, marginBottom: "1rem" }}>
                    <span style={{ fontSize: "1.05rem", fontWeight: 700, color: "var(--secondary)" }}>
                      l. Checked the sanitary measures of mess personnel during food preparation:
                    </span>
                    <span 
                      className={`badge ${isGroupCompleted ? "badge-army" : "badge-status"}`}
                      style={{ 
                        marginLeft: "8px", 
                        fontSize: "0.65rem", 
                        padding: "1px 6px",
                        backgroundColor: isGroupCompleted ? "#DCFCE7" : "#F1F5F9",
                        color: isGroupCompleted ? "#15803D" : "#64748B",
                        borderColor: isGroupCompleted ? "#BBF7D0" : "#E2E8F0"
                      }}
                    >
                      {isGroupCompleted ? "COMPLETED" : "PENDING"}
                    </span>
                  </div>
                  
                  {/* Horizontal Checkboxes */}
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "1.25rem", paddingLeft: "1.5rem", marginBottom: "1.25rem" }}>
                    {lGroup.map(({ idx, item, label }) => {
                      const isCompleted = item.status === "COMPLETED";
                      return (
                        <label 
                          key={idx}
                          style={{ 
                            display: "flex", 
                            alignItems: "center", 
                            gap: "8px", 
                            cursor: "pointer", 
                            fontSize: "0.9rem",
                            color: isCompleted ? "var(--success)" : "var(--secondary-light)",
                            fontWeight: isCompleted ? 600 : 500
                          }}
                        >
                          <span 
                            style={{ 
                              display: "flex", 
                              alignItems: "center", 
                              justifyContent: "center", 
                              width: "20px", 
                              height: "20px", 
                              borderRadius: "5px", 
                              border: `2px solid ${isCompleted ? "var(--success)" : "var(--border-color)"}`, 
                              backgroundColor: isCompleted ? "var(--success)" : "transparent",
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
                              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="white" style={{ width: "12px", height: "12px" }}>
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </span>
                          {label}
                        </label>
                      );
                    })}
                  </div>

                  {/* Group-wide parameters */}
                  <div 
                    style={{ 
                      paddingLeft: "1.5rem", 
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
                        placeholder="e.g. 10:30"
                        value={firstItem.time}
                        onChange={(e) => {
                          lGroup.forEach(({ idx }) => handleFieldChange(idx, "time", e.target.value));
                        }}
                        style={{ padding: "6px 10px", fontSize: "0.8rem" }}
                      />
                    </div>

                    <div className="form-group" style={{ margin: 0 }}>
                      <label style={{ fontSize: "0.7rem", color: "var(--muted)" }}>Remarks / Observations</label>
                      <input
                        type="text"
                        className="input-field"
                        placeholder="e.g. All staff checked and compliant."
                        value={firstItem.remarks}
                        onChange={(e) => {
                          lGroup.forEach(({ idx }) => handleFieldChange(idx, "remarks", e.target.value));
                        }}
                        style={{ padding: "6px 10px", fontSize: "0.8rem", width: "100%" }}
                      />
                    </div>
                  </div>
                </div>
              );
            };

            const renderMGroup = () => {
              if (mGroup.length === 0) return null;

              const areas = ["Cadet dining area", "Preparation area", "Cooking area", "Dish washing area", "Floor", "CAMO room"];
              const times = ["2100H", "1000H", "1600H"];
              const firstItem = mGroup[0].item;
              const isGroupCompleted = mGroup.every(g => g.item.status === "COMPLETED");

              return (
                <div 
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    padding: "1.5rem",
                    borderBottom: "1px solid var(--border-color)",
                    backgroundColor: "rgba(248, 250, 252, 0.3)",
                    transition: "var(--transition)"
                  }}
                  className="camo-task-row"
                >
                  <div style={{ flexGrow: 1, marginBottom: "1rem" }}>
                    <span style={{ fontSize: "1.05rem", fontWeight: 700, color: "var(--secondary)" }}>
                      m. Ensured the cleanliness and orderliness of the following:
                    </span>
                    <span 
                      className={`badge ${isGroupCompleted ? "badge-army" : "badge-status"}`}
                      style={{ 
                        marginLeft: "8px", 
                        fontSize: "0.65rem", 
                        padding: "1px 6px",
                        backgroundColor: isGroupCompleted ? "#DCFCE7" : "#F1F5F9",
                        color: isGroupCompleted ? "#15803D" : "#64748B",
                        borderColor: isGroupCompleted ? "#BBF7D0" : "#E2E8F0"
                      }}
                    >
                      {isGroupCompleted ? "COMPLETED" : "PENDING"}
                    </span>
                  </div>

                  {/* Cleanliness Table Grid */}
                  <div style={{ overflowX: "auto", marginBottom: "1.25rem", paddingLeft: "1.5rem" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "450px" }}>
                      <thead>
                        <tr style={{ borderBottom: "1.5px solid var(--border-color)" }}>
                          <th style={{ textAlign: "left", padding: "8px", fontSize: "0.8rem", color: "var(--muted)", fontWeight: 700, textTransform: "uppercase" }}>Area</th>
                          {times.map(t => (
                            <th key={t} style={{ textAlign: "center", padding: "8px", fontSize: "0.8rem", color: "var(--muted)", fontWeight: 700, textTransform: "uppercase", width: "100px" }}>{t}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {areas.map(area => (
                          <tr key={area} style={{ borderBottom: "1px solid var(--border-color)" }}>
                            <td style={{ padding: "10px 8px", fontSize: "0.9rem", color: "var(--secondary)", fontWeight: 600 }}>{area}</td>
                            {times.map(t => {
                              const match = mGroup.find(g => g.area.toLowerCase() === area.toLowerCase() && g.timeLabel.toLowerCase() === t.toLowerCase());
                              if (!match) return <td key={t} style={{ textAlign: "center", color: "var(--muted)" }}>-</td>;
                              
                              const isCompleted = match.item.status === "COMPLETED";
                              return (
                                <td key={t} style={{ textAlign: "center", padding: "8px" }}>
                                  <label 
                                    style={{ 
                                      display: "inline-flex", 
                                      alignItems: "center", 
                                      justifyContent: "center", 
                                      width: "20px", 
                                      height: "20px", 
                                      borderRadius: "5px", 
                                      border: `2px solid ${isCompleted ? "var(--success)" : "var(--border-color)"}`, 
                                      backgroundColor: isCompleted ? "var(--success)" : "transparent",
                                      cursor: "pointer",
                                      transition: "var(--transition)"
                                    }}
                                  >
                                    <input
                                      type="checkbox"
                                      checked={isCompleted}
                                      onChange={() => handleStatusToggle(match.idx)}
                                      style={{ display: "none" }}
                                    />
                                    {isCompleted && (
                                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="white" style={{ width: "12px", height: "12px" }}>
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                                      </svg>
                                    )}
                                  </label>
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Group-wide parameters for Cleanliness */}
                  <div 
                    style={{ 
                      paddingLeft: "1.5rem", 
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
                        placeholder="e.g. 21:00"
                        value={firstItem.time}
                        onChange={(e) => {
                          mGroup.forEach(({ idx }) => handleFieldChange(idx, "time", e.target.value));
                        }}
                        style={{ padding: "6px 10px", fontSize: "0.8rem" }}
                      />
                    </div>

                    <div className="form-group" style={{ margin: 0 }}>
                      <label style={{ fontSize: "0.7rem", color: "var(--muted)" }}>Remarks / Observations</label>
                      <input
                        type="text"
                        className="input-field"
                        placeholder="e.g. Cleanliness check verified for all areas."
                        value={firstItem.remarks}
                        onChange={(e) => {
                          mGroup.forEach(({ idx }) => handleFieldChange(idx, "remarks", e.target.value));
                        }}
                        style={{ padding: "6px 10px", fontSize: "0.8rem", width: "100%" }}
                      />
                    </div>
                  </div>
                </div>
              );
            };

            return (
              <>
                {normalTasksBeforeL.map(({ item, idx }) => renderNormalTaskRow(item, idx))}
                {renderLGroup()}
                {renderMGroup()}
                {normalTasksAfterM.map(({ item, idx }) => renderNormalTaskRow(item, idx))}
              </>
            );
          })()}
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
