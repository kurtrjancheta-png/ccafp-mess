"use client";

import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import Link from "next/link";

interface Dissemination {
  id: string;
  date: string;
  headline: string;
  content: string;
  media: string; // Google Drive link or empty
  file: string;  // Google Drive link or empty
}

export default function DisseminationsPage() {
  const { user } = useAuth();
  const [disseminations, setDisseminations] = useState<Dissemination[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Filter & Search States
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<"ALL" | "MEDIA" | "FILES">("ALL");

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Dissemination | null>(null);

  // Form Fields
  const [headline, setHeadline] = useState("");
  const [content, setContent] = useState("");
  
  // File Upload State
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaBase64, setMediaBase64] = useState<string | null>(null);
  const [docFile, setDocFile] = useState<File | null>(null);
  const [docBase64, setDocBase64] = useState<string | null>(null);

  // File Inputs Refs
  const mediaInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);

  // Check if current user is authorized (RMESSO only)
  const isAuthorized = user && user.role === "RMESSO";

  useEffect(() => {
    fetchDisseminations();
  }, []);

  // Convert Drive Share link to direct view/download URL for <img> tags
  const getDirectDriveImageUrl = (url: string) => {
    if (!url) return "";
    // Matches ID from format: /file/d/FILE_ID/view or id=FILE_ID
    const match = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/) || url.match(/id=([a-zA-Z0-9_-]+)/);
    if (match && match[1]) {
      return `https://docs.google.com/uc?export=download&id=${match[1]}`;
    }
    return url;
  };

  // Helper to extract file ID to show short text
  const getDriveFileId = (url: string) => {
    if (!url) return "";
    const match = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/) || url.match(/id=([a-zA-Z0-9_-]+)/);
    return match && match[1] ? match[1].substring(0, 8) + "..." : "Link";
  };

  // CSV parsing helper handling quotes, commas, and multiline cells
  const parseCSV = (text: string): string[][] => {
    const lines: string[][] = [];
    let row: string[] = [];
    let cell = "";
    let inQuotes = false;

    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      const nextChar = text[i + 1];

      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          cell += '"';
          i++; // skip next quote
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === "," && !inQuotes) {
        row.push(cell.trim());
        cell = "";
      } else if ((char === "\r" || char === "\n") && !inQuotes) {
        row.push(cell.trim());
        if (row.some((c) => c !== "")) {
          lines.push(row);
        }
        row = [];
        cell = "";
        if (char === "\r" && nextChar === "\n") {
          i++; // skip LF
        }
      } else {
        cell += char;
      }
    }
    if (cell !== "" || row.length > 0) {
      row.push(cell.trim());
      if (row.some((c) => c !== "")) {
        lines.push(row);
      }
    }
    return lines;
  };

  const fetchDisseminations = async () => {
    setLoading(true);
    setError(null);
    const sheetId = process.env.NEXT_PUBLIC_SPREADSHEET_ID || "14dSYE1ntxNrnBdgSn-mWU5z-GMHK7qdMcKFchgh0pAQ";
    const gid = "1204067800"; // Dissemination sheet GID
    const url = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${gid}&t=${Date.now()}`;

    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Google Sheet GID returned status ${response.status}`);
      }

      const csvText = await response.text();
      const rows = parseCSV(csvText);
      
      if (rows.length < 2) {
        setDisseminations([]);
        return;
      }

      const headers = rows[0].map(h => h.trim().toUpperCase());
      const idIdx = headers.indexOf("ID");
      const dateIdx = headers.indexOf("DATE");
      const headlineIdx = headers.indexOf("HEADLINE");
      const contentIdx = headers.indexOf("CONTENT");
      const mediaIdx = headers.indexOf("MEDIA");
      const fileIdx = headers.indexOf("FILE");

      const list: Dissemination[] = [];
      for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        if (row.length === 0 || (headlineIdx !== -1 && !row[headlineIdx])) continue;

        list.push({
          id: idIdx !== -1 && row[idIdx] ? row[idIdx] : `DIS-${i}`,
          date: dateIdx !== -1 && row[dateIdx] ? row[dateIdx] : "",
          headline: headlineIdx !== -1 && row[headlineIdx] ? row[headlineIdx] : "",
          content: contentIdx !== -1 && row[contentIdx] ? row[contentIdx] : "",
          media: mediaIdx !== -1 && row[mediaIdx] ? row[mediaIdx] : "",
          file: fileIdx !== -1 && row[fileIdx] ? row[fileIdx] : ""
        });
      }

      // Sort newest first
      setDisseminations(list.reverse());
    } catch (err: any) {
      console.error("Failed to fetch disseminations:", err);
      setError(`Unable to connect to live sheet database. Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // File to Base64 Reader Promise Helper
  const readFileAsBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        resolve(result);
      };
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(file);
    });
  };

  // Handle file changes & preload as base64
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, type: "media" | "doc") => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    
    try {
      const base64 = await readFileAsBase64(file);
      if (type === "media") {
        setMediaFile(file);
        setMediaBase64(base64);
      } else {
        setDocFile(file);
        setDocBase64(base64);
      }
    } catch (err) {
      alert("Error reading file. Please select another file.");
      console.error(err);
    }
  };

  const handleOpenCreateModal = () => {
    setEditingItem(null);
    setHeadline("");
    setContent("");
    setMediaFile(null);
    setMediaBase64(null);
    setDocFile(null);
    setDocBase64(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (item: Dissemination) => {
    setEditingItem(item);
    setHeadline(item.headline);
    setContent(item.content);
    setMediaFile(null);
    setMediaBase64(null);
    setDocFile(null);
    setDocBase64(null);
    setIsModalOpen(true);
  };

  const handleSaveDissemination = async (e: React.FormEvent) => {
    e.preventDefault();
    const appsScriptUrl = process.env.NEXT_PUBLIC_APPS_SCRIPT_URL;
    if (!appsScriptUrl) {
      alert("Google Apps Script URL is not configured. Please define NEXT_PUBLIC_APPS_SCRIPT_URL in your environment.");
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(null);

    const isEdit = !!editingItem;
    
    // Prepare Payload
    const payload: any = {
      action: "saveDissemination",
      id: isEdit ? editingItem.id : null,
      headline: headline,
      content: content,
      date: isEdit ? editingItem.date : new Date().toLocaleString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false
      }),
      // Pass URLs or placeholders if no file uploads
      mediaUrl: isEdit && !mediaBase64 ? "__NO_CHANGE__" : "",
      fileUrl: isEdit && !docBase64 ? "__NO_CHANGE__" : ""
    };

    // If new files were selected, attach data
    if (mediaFile && mediaBase64) {
      payload.mediaData = mediaBase64;
      payload.mediaName = mediaFile.name;
      payload.mediaType = mediaFile.type;
    }
    if (docFile && docBase64) {
      payload.fileData = docBase64;
      payload.fileName = docFile.name;
      payload.fileType = docFile.type;
    }

    try {
      const response = await fetch(appsScriptUrl, {
        method: "POST",
        headers: { "Content-Type": "text/plain" },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`Apps Script API status ${response.status}`);
      }

      const json = await response.json();
      if (json.success) {
        setSuccess(isEdit ? "Dissemination updated successfully!" : "Dissemination posted successfully!");
        setIsModalOpen(false);
        fetchDisseminations();
        setTimeout(() => setSuccess(null), 5000);
      } else {
        throw new Error(json.error || "Save action failed");
      }
    } catch (err: any) {
      console.error(err);
      setError(`Failed to save changes: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteDissemination = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this dissemination? This action cannot be undone.")) return;

    const appsScriptUrl = process.env.NEXT_PUBLIC_APPS_SCRIPT_URL;
    if (!appsScriptUrl) {
      alert("Apps Script URL is not configured. Unable to perform write actions.");
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(appsScriptUrl, {
        method: "POST",
        headers: { "Content-Type": "text/plain" },
        body: JSON.stringify({
          action: "deleteDissemination",
          id: id
        })
      });

      if (!response.ok) {
        throw new Error(`Apps Script API status ${response.status}`);
      }

      const json = await response.json();
      if (json.success) {
        setSuccess("Dissemination deleted successfully.");
        fetchDisseminations();
        setTimeout(() => setSuccess(null), 5000);
      } else {
        throw new Error(json.error || "Delete action failed");
      }
    } catch (err: any) {
      console.error(err);
      setError(`Failed to delete dissemination: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  // Filtered Items logic
  const filteredDisseminations = disseminations.filter(item => {
    const matchesSearch = item.headline.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          item.content.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (!matchesSearch) return false;
    if (filterType === "MEDIA") return !!item.media;
    if (filterType === "FILES") return !!item.file;
    return true;
  });

  return (
    <div className="animate-fade-in" style={{ maxWidth: "850px", margin: "0 auto" }}>
      {/* Page Header */}
      <header className="page-header">
        <div className="page-title">
          <h2>Disseminations Board</h2>
          <p>
            Official notices, operational bulletins, and documents for the Cadet Corps.
            Status: <span style={{ color: error ? "var(--primary)" : "var(--success)", fontWeight: 700 }}>
              {error ? "Offline" : "Synced with Database"}
            </span>
          </p>
        </div>

        <div className="header-actions" style={{ display: "flex", gap: "10px" }}>
          {isAuthorized && (
            <button className="btn btn-primary animate-pulse" onClick={handleOpenCreateModal}>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ width: "16px", height: "16px" }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
              </svg>
              Post Dissemination
            </button>
          )}
          <button className="btn btn-outline" onClick={fetchDisseminations} disabled={loading}>
            {loading ? "Syncing..." : "Sync Board"}
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

      {/* Error alert */}
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
          <span><strong>Notice:</strong> {error}</span>
        </div>
      )}

      {/* Filter and Search Card */}
      <div className="card" style={{ padding: "1.25rem 1.75rem", marginBottom: "1.5rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
          <div className="form-group" style={{ flexGrow: 1, minWidth: "250px", margin: 0 }}>
            <input
              type="text"
              placeholder="Search headline or content..."
              className="input-field"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ width: "100%", padding: "8px 12px" }}
            />
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--secondary-light)" }}>Filters:</span>
            <div className="filter-button-group" style={{ margin: 0 }}>
              {[
                { type: "ALL", label: "Show All" },
                { type: "MEDIA", label: "With Media" },
                { type: "FILES", label: "With Files" }
              ].map(btn => (
                <button
                  key={btn.type}
                  className={`filter-btn ${filterType === btn.type ? "active" : ""}`}
                  onClick={() => setFilterType(btn.type as any)}
                  style={{ padding: "4px 8px", fontSize: "0.75rem" }}
                >
                  {btn.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Dissemination list / Timeline */}
      <div className="timeline" style={{ position: "relative" }}>
        {loading ? (
          // Skeleton loader
          [1, 2, 3].map(n => (
            <div key={n} className="timeline-item" style={{ opacity: 0.5 }}>
              <div className="timeline-dot"></div>
              <div className="card" style={{ width: "100%", height: "160px", background: "linear-gradient(90deg, var(--card-bg) 25%, var(--background) 50%, var(--card-bg) 75%)", backgroundSize: "200% 100%", animation: "shimmer 1.5s infinite" }}></div>
            </div>
          ))
        ) : filteredDisseminations.length > 0 ? (
          filteredDisseminations.map((item, index) => {
            const hasMedia = !!item.media;
            const hasFile = !!item.file;
            const directMediaUrl = getDirectDriveImageUrl(item.media);

            return (
              <div key={item.id} className="timeline-item animate-fade-in" style={{ animationDelay: `${index * 0.08}s` }}>
                {/* Visual node */}
                <div className="timeline-dot" style={{ backgroundColor: "var(--primary)" }}></div>

                {/* Content Card */}
                <div className="card" style={{ width: "100%", margin: "0 0 1rem 0", position: "relative" }}>
                  
                  {/* Headline & Actions */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "15px", flexWrap: "wrap", marginBottom: "0.75rem" }}>
                    <div style={{ flex: 1 }}>
                      <h3 style={{ fontSize: "1.25rem", color: "var(--secondary)", fontWeight: 800, lineHeight: 1.3 }}>
                        {item.headline}
                      </h3>
                      <span style={{ fontSize: "0.75rem", color: "var(--muted)" }}>{item.date}</span>
                    </div>

                    {isAuthorized && (
                      <div style={{ display: "flex", gap: "6px" }} className="no-print">
                        {/* Edit Button */}
                        <button
                          onClick={() => handleOpenEditModal(item)}
                          className="btn btn-outline"
                          style={{ padding: "4px 8px", fontSize: "0.75rem", border: "1px solid var(--accent)", color: "var(--accent)" }}
                          title="Edit Dissemination"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ width: "12px", height: "12px" }}>
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                          Edit
                        </button>

                        {/* Delete Button */}
                        <button
                          onClick={() => handleDeleteDissemination(item.id)}
                          className="btn btn-outline"
                          style={{ padding: "4px 8px", fontSize: "0.75rem", border: "1px solid var(--primary)", color: "var(--primary)" }}
                          title="Delete Dissemination"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ width: "12px", height: "12px" }}>
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          Delete
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Body Text */}
                  <p style={{ 
                    color: "var(--secondary-light)", 
                    fontSize: "0.95rem", 
                    lineHeight: "1.6", 
                    whiteSpace: "pre-wrap", 
                    marginBottom: "1rem" 
                  }}>
                    {item.content}
                  </p>

                  {/* Media Embed / Image Viewer */}
                  {hasMedia && (
                    <div style={{ marginTop: "1rem", marginBottom: "1rem" }}>
                      <span style={{ fontSize: "0.7rem", color: "var(--muted)", textTransform: "uppercase", fontWeight: 700, display: "block", marginBottom: "4px" }}>
                        Attached Media Bulletins:
                      </span>
                      
                      {/* Image Preview */}
                      {directMediaUrl.includes("docs.google.com") || directMediaUrl.includes("drive.google.com") || /\.(jpeg|jpg|gif|png|webp|svg)$/i.test(directMediaUrl) ? (
                        <div style={{ overflow: "hidden", borderRadius: "var(--border-radius-sm)", border: "1px solid var(--border-color)", display: "inline-block", maxWidth: "100%" }}>
                          <img
                            src={directMediaUrl}
                            alt="Dissemination Attachment"
                            style={{ 
                              maxWidth: "100%", 
                              maxHeight: "350px", 
                              display: "block", 
                              objectFit: "contain",
                              cursor: "zoom-in"
                            }}
                            onClick={() => window.open(item.media, "_blank")}
                            onError={(e) => {
                              // If image loading fails, display direct hyperlink instead
                              e.currentTarget.style.display = "none";
                            }}
                          />
                        </div>
                      ) : null}

                      {/* Hyperlink fallback to open Drive viewer */}
                      <div style={{ marginTop: "6px" }}>
                        <a 
                          href={item.media} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          style={{ 
                            fontSize: "0.8rem", 
                            color: "var(--primary)", 
                            fontWeight: 700, 
                            display: "inline-flex", 
                            alignItems: "center", 
                            gap: "4px",
                            textDecoration: "underline"
                          }}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ width: "14px", height: "14px" }}>
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          Open Media Attachment ({getDriveFileId(item.media)})
                        </a>
                      </div>
                    </div>
                  )}

                  {/* Attached File/Document Section */}
                  {hasFile && (
                    <div style={{ 
                      marginTop: "1.25rem", 
                      padding: "10px 14px", 
                      backgroundColor: "var(--accent-light)", 
                      borderRadius: "var(--border-radius-sm)", 
                      border: "1.5px dashed var(--accent)", 
                      display: "flex", 
                      alignItems: "center", 
                      justifyContent: "space-between", 
                      flexWrap: "wrap",
                      gap: "10px"
                    }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="var(--accent)" style={{ width: "20px", height: "20px" }}>
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <div>
                          <strong style={{ fontSize: "0.85rem", color: "var(--secondary)", display: "block" }}>Attached Circular Document</strong>
                          <span style={{ fontSize: "0.7rem", color: "var(--muted)" }}>Click to download or view file</span>
                        </div>
                      </div>
                      <a
                        href={item.file}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-accent"
                        style={{ padding: "6px 12px", fontSize: "0.75rem", display: "inline-flex", gap: "4px" }}
                      >
                        Download File
                      </a>
                    </div>
                  )}

                </div>
              </div>
            );
          })
        ) : (
          <div className="card" style={{ padding: "2.5rem", textAlign: "center", color: "var(--muted)" }}>
            No disseminations found matching your criteria.
          </div>
        )}
      </div>

      {/* Dissemination Modal (Post/Edit) */}
      {isModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "600px", animation: "modalFadeIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards" }}>
            
            {/* Header */}
            <div className="modal-header">
              <h3>{editingItem ? "Edit Dissemination" : "Post New Dissemination"}</h3>
              <button className="modal-close-x" onClick={() => setIsModalOpen(false)}>&times;</button>
            </div>

            <form onSubmit={handleSaveDissemination}>
              <div className="modal-body" style={{ display: "flex", flexDirection: "column", gap: "1.25rem", padding: "1.5rem" }}>
                
                {/* Headline input */}
                <div className="form-group">
                  <label htmlFor="form-headline">Dissemination Headline</label>
                  <input
                    id="form-headline"
                    type="text"
                    className="input-field"
                    placeholder="e.g. Mandatory Mess Hall Formations for August 15"
                    value={headline}
                    onChange={(e) => setHeadline(e.target.value)}
                    required
                  />
                </div>

                {/* Content input */}
                <div className="form-group">
                  <label htmlFor="form-content">Directive Content / Details</label>
                  <textarea
                    id="form-content"
                    className="input-field"
                    rows={8}
                    placeholder="Provide full announcement details here, support multiple lines..."
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    style={{ resize: "vertical", fontFamily: "inherit" }}
                    required
                  />
                </div>

                {/* Upload Section */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                  
                  {/* Media input */}
                  <div className="form-group">
                    <label>Media Bulletin (Image/Video)</label>
                    <div 
                      onClick={() => mediaInputRef.current?.click()}
                      style={{ 
                        border: "1.5px dashed var(--border-color)", 
                        borderRadius: "var(--border-radius-sm)", 
                        padding: "12px", 
                        textAlign: "center", 
                        cursor: "pointer", 
                        backgroundColor: "var(--background)",
                        transition: "var(--transition)"
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.borderColor = "var(--primary)"}
                      onMouseLeave={(e) => e.currentTarget.style.borderColor = "var(--border-color)"}
                    >
                      <span style={{ fontSize: "0.75rem", color: mediaFile ? "var(--primary)" : "var(--muted)", fontWeight: 600, display: "block" }}>
                        {mediaFile ? `Selected: ${mediaFile.name}` : "Click to select Media"}
                      </span>
                      {editingItem && editingItem.media && !mediaFile && (
                        <span style={{ fontSize: "0.65rem", color: "var(--success)", display: "block", marginTop: "2px" }}>
                          (Has existing media)
                        </span>
                      )}
                    </div>
                    <input
                      type="file"
                      ref={mediaInputRef}
                      onChange={(e) => handleFileChange(e, "media")}
                      accept="image/*,video/*"
                      style={{ display: "none" }}
                    />
                  </div>

                  {/* Document input */}
                  <div className="form-group">
                    <label>Official File / Circular (PDF/Doc)</label>
                    <div 
                      onClick={() => docInputRef.current?.click()}
                      style={{ 
                        border: "1.5px dashed var(--border-color)", 
                        borderRadius: "var(--border-radius-sm)", 
                        padding: "12px", 
                        textAlign: "center", 
                        cursor: "pointer", 
                        backgroundColor: "var(--background)",
                        transition: "var(--transition)"
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.borderColor = "var(--accent)"}
                      onMouseLeave={(e) => e.currentTarget.style.borderColor = "var(--border-color)"}
                    >
                      <span style={{ fontSize: "0.75rem", color: docFile ? "var(--accent)" : "var(--muted)", fontWeight: 600, display: "block" }}>
                        {docFile ? `Selected: ${docFile.name}` : "Click to select File"}
                      </span>
                      {editingItem && editingItem.file && !docFile && (
                        <span style={{ fontSize: "0.65rem", color: "var(--success)", display: "block", marginTop: "2px" }}>
                          (Has existing document)
                        </span>
                      )}
                    </div>
                    <input
                      type="file"
                      ref={docInputRef}
                      onChange={(e) => handleFileChange(e, "doc")}
                      accept=".pdf,.doc,.docx,.xls,.xlsx,.zip"
                      style={{ display: "none" }}
                    />
                  </div>

                </div>

              </div>

              {/* Footer */}
              <div className="modal-footer" style={{ padding: "1rem 1.5rem", borderTop: "1.5px solid var(--border-color)" }}>
                <button type="button" className="btn btn-outline" onClick={() => setIsModalOpen(false)} disabled={saving}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving || !headline || !content}>
                  {saving ? (
                    <>
                      <svg className="animate-spin" style={{ width: "14px", height: "14px" }} fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      {editingItem ? "Saving changes..." : "Uploading & Posting..."}
                    </>
                  ) : (
                    editingItem ? "Save Changes" : "Post Bulletin"
                  )}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* Advisory bulletin */}
      <div className="card" style={{ borderLeft: "4px solid var(--primary)", marginTop: "2.5rem" }}>
        <h4 style={{ fontSize: "0.95rem", marginBottom: "0.5rem" }}>Dissemination Deck Advisory</h4>
        <p style={{ fontSize: "0.8rem", color: "var(--secondary-light)", lineHeight: "1.5", margin: 0 }}>
          This dissemination board displays all official announcements, files, and circulars issued by the CCAFP Officers Mess Deck. Access is read-only for all cadet branches, with exclusive posting, editing, and media upload authorization delegated solely to the Regimental Mess Officer (RMESSO).
        </p>
      </div>
    </div>
  );
}
