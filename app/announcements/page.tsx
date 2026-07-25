"use client";

import React from "react";

interface Announcement {
  id: number;
  date: string;
  title: string;
  category: "General" | "Menu Update" | "Inspection" | "Policy";
  content: string;
  postedBy: string;
}

const SAMPLE_ANNOUNCEMENTS: Announcement[] = [
  {
    id: 1,
    date: "July 25, 2026",
    title: "Change in Sunday Dinner Schedule",
    category: "Menu Update",
    content: "Please be informed that the Sunday dinner mess call will start at 1730H instead of the usual 1800H due to the upcoming Commandant's parade preparation. All companies must proceed to the mess hall in accordance with their company designated groupings.",
    postedBy: "Regimental Mess Officer",
  },
  {
    id: 2,
    date: "July 22, 2026",
    title: "Submission of Special Diet Requests",
    category: "Policy",
    content: "All cadets requiring special dietary accommodations for the first semester must register their requirements on this portal. A valid medical certificate signed by the PMA Medical Officer must be uploaded. Walk-in requests to the kitchen staff will no longer be honored starting next week.",
    postedBy: "Mess Council Chairman",
  },
  {
    id: 3,
    date: "July 18, 2026",
    title: "Weekly Mess Hall Sanitation Inspection",
    category: "Inspection",
    content: "The weekly sanitary inspection will be conducted this coming Saturday at 0900H. All company mess representatives are requested to ensure their respective dining tables, utensils, and serving lines are properly polished and sanitized prior to the inspection.",
    postedBy: "Chief Steward",
  },
];

export default function AnnouncementsPage() {
  return (
    <div>
      <header className="page-header">
        <div className="page-title">
          <h2>Announcements</h2>
          <p>Important updates, schedules, and circulars from the CCAFP Mess Council.</p>
        </div>
      </header>

      <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem", maxWidth: "800px" }}>
        {SAMPLE_ANNOUNCEMENTS.map((a) => (
          <div key={a.id} className="card" style={{ marginBottom: "0" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                marginBottom: "1rem",
                flexWrap: "wrap",
                gap: "8px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
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
                        : "#F3F4F6",
                    color:
                      a.category === "Menu Update"
                        ? "#EF4444"
                        : a.category === "Policy"
                        ? "#D97706"
                        : a.category === "Inspection"
                        ? "#0284C7"
                        : "#374151",
                  }}
                >
                  {a.category}
                </span>
                <h3 style={{ fontSize: "1.2rem", margin: "0" }}>{a.title}</h3>
              </div>
              <span style={{ fontSize: "0.85rem", color: "var(--muted)" }}>{a.date}</span>
            </div>
            
            <p style={{ color: "var(--secondary-light)", fontSize: "0.95rem", marginBottom: "1rem" }}>
              {a.content}
            </p>
            
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                borderTop: "1px solid var(--border-color)",
                paddingTop: "0.75rem",
                fontSize: "0.8rem",
                color: "var(--muted)",
              }}
            >
              <span>Posted by: <strong>{a.postedBy}</strong></span>
              <span>CCAFP Mess Council</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
