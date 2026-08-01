"use client";

import React, { useState } from "react";

interface Announcement {
  id: number;
  date: string;
  title: string;
  category: "General" | "Menu Update" | "Inspection" | "Policy";
  content: string;
  postedBy: string;
  isImportant?: boolean;
}

const SAMPLE_ANNOUNCEMENTS: Announcement[] = [
  {
    id: 1,
    date: "August 1, 2026",
    title: "Change in Sunday Dinner Schedule",
    category: "Menu Update",
    content: "Please be informed that the Sunday dinner mess call will start at 1730H instead of the usual 1800H due to the upcoming Commandant's parade preparation. All companies must proceed to the mess hall in accordance with their company designated groupings.",
    postedBy: "Regimental Mess Officer",
    isImportant: true,
  },
  {
    id: 2,
    date: "July 28, 2026",
    title: "Submission of Special Diet Requests",
    category: "Policy",
    content: "All cadets requiring special dietary accommodations for the first semester must register their requirements on this portal. A valid medical certificate signed by the PMA Medical Officer must be uploaded. Walk-in requests to the kitchen staff will no longer be honored starting next week.",
    postedBy: "Mess Council Chairman",
    isImportant: true,
  },
  {
    id: 3,
    date: "July 24, 2026",
    title: "Weekly Mess Hall Sanitation Inspection",
    category: "Inspection",
    content: "The weekly sanitary inspection will be conducted this coming Saturday at 0900H. All company mess representatives are requested to ensure their respective dining tables, utensils, and serving lines are properly polished and sanitized prior to the inspection.",
    postedBy: "Chief Steward",
  },
  {
    id: 4,
    date: "July 20, 2026",
    title: "Mess Hall Cutlery Replacements",
    category: "General",
    content: "New batches of stainless steel trays, forks, and spoons have been delivered. Company stewards must report to the warehouse at 1400H today to sign off on and claim their new company allocations.",
    postedBy: "Quartermaster Liaison",
  }
];

export default function AnnouncementsPage() {
  const [announcements] = useState<Announcement[]>(SAMPLE_ANNOUNCEMENTS);
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [bookmarkedIds, setBookmarkedIds] = useState<number[]>([]);

  const toggleBookmark = (id: number) => {
    if (bookmarkedIds.includes(id)) {
      setBookmarkedIds(bookmarkedIds.filter(bId => bId !== id));
    } else {
      setBookmarkedIds([...bookmarkedIds, id]);
    }
  };

  const filteredAnnouncements = announcements.filter(a => {
    if (selectedCategory === "ALL") return true;
    return a.category === selectedCategory;
  });

  return (
    <div className="animate-fade-in">
      <header className="page-header">
        <div className="page-title">
          <h2>Announcements Board</h2>
          <p>Official notices, administrative circulars, and schedules from the CCAFP Mess Council.</p>
        </div>
      </header>

      {/* Category Filter Tabs */}
      <div className="card" style={{ padding: "1.25rem 1.75rem", marginBottom: "1.5rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
          <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--secondary-light)" }}>Filter by Category:</span>
          <div className="filter-button-group" style={{ margin: 0 }}>
            {["ALL", "General", "Menu Update", "Inspection", "Policy"].map(cat => (
              <button
                key={cat}
                className={`filter-btn ${selectedCategory === cat ? "active" : ""}`}
                onClick={() => setSelectedCategory(cat)}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Timeline Section */}
      <div className="timeline">
        {filteredAnnouncements.length > 0 ? (
          filteredAnnouncements.map((a, idx) => {
            const isBookmarked = bookmarkedIds.includes(a.id);
            return (
              <div 
                key={a.id} 
                className={`timeline-item animate-fade-in`}
                style={{ animationDelay: `${idx * 0.08}s` }}
              >
                {/* Timeline Node Dot */}
                <div className="timeline-dot"></div>

                {/* Announcement Card wrapper */}
                <div className="card" style={{ margin: "0 0 0.5rem 0", position: "relative" }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      marginBottom: "1rem",
                      flexWrap: "wrap",
                      gap: "10px",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                      <span
                        className="badge"
                        style={{
                          backgroundColor:
                            a.category === "Menu Update"
                              ? "#FEE2E2"
                              : a.category === "Policy"
                              ? "#FEF3C7"
                              : a.category === "Inspection"
                              ? "#E0F2FE"
                              : "#F1F5F9",
                          color:
                            a.category === "Menu Update"
                              ? "#EF4444"
                              : a.category === "Policy"
                              ? "#D97706"
                              : a.category === "Inspection"
                              ? "#0284C7"
                              : "#475569",
                        }}
                      >
                        {a.category}
                      </span>
                      {a.isImportant && (
                        <span className="badge badge-status" style={{ fontSize: "0.65rem" }}>
                          CRITICAL
                        </span>
                      )}
                      <h3 style={{ fontSize: "1.15rem", margin: "0" }}>{a.title}</h3>
                    </div>
                    
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <span style={{ fontSize: "0.8rem", color: "var(--muted)" }}>{a.date}</span>
                      
                      {/* Bookmark Icon Button */}
                      <button
                        onClick={() => toggleBookmark(a.id)}
                        style={{
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          color: isBookmarked ? "var(--accent)" : "var(--muted)",
                          padding: "2px",
                          transition: "color 0.2s ease, transform 0.2s ease",
                        }}
                        title={isBookmarked ? "Unpin Announcement" : "Pin Announcement"}
                        onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.15)"}
                        onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill={isBookmarked ? "currentColor" : "none"}
                          stroke="currentColor"
                          strokeWidth="2"
                          style={{ width: "18px", height: "18px" }}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M17.593 3.022c.44.053.765.412.765.854v16.355a.75.75 0 01-1.25.56L12 17.52l-5.108 3.27a.75.75 0 01-1.25-.56V3.876c0-.442.325-.801.765-.854a48.29 48.29 0 0111.187 0z"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>
                  
                  <p style={{ color: "var(--secondary-light)", fontSize: "0.9rem", marginBottom: "1.25rem", lineHeight: "1.6" }}>
                    {a.content}
                  </p>
                  
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      borderTop: "1px solid var(--border-color)",
                      paddingTop: "0.75rem",
                      fontSize: "0.75rem",
                      color: "var(--muted)",
                    }}
                  >
                    <span>Posted by: <strong style={{ color: "var(--secondary-light)" }}>{a.postedBy}</strong></span>
                    <span>CCAFP Officers Command</span>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="card" style={{ padding: "2rem", textAlign: "center", color: "var(--muted)" }}>
            No announcements found in the selected category.
          </div>
        )}
      </div>
    </div>
  );
}
