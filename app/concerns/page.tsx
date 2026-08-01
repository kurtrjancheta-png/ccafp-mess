"use client";

import React, { useState } from "react";

interface Concern {
  id: number;
  timestamp: string;
  name: string;
  class: string;
  coy: string;
  subject: string;
  details: string;
  anonymous: boolean;
  status: "Received" | "Under Investigation" | "Resolved";
  resolutionResponse?: string;
}

const INITIAL_CONCERNS: Concern[] = [
  {
    id: 1,
    timestamp: "July 26, 2026 18:30",
    name: "CDT 2CL JUAN DELA CRUZ",
    class: "2CL",
    coy: "ALFA",
    subject: "Quality of Rice during Breakfast",
    details: "The garlic rice served during this morning's breakfast was slightly undercooked. Many cadets in our table complained about the hardness of the grains. Requesting the kitchen crew to ensure proper steaming times.",
    anonymous: false,
    status: "Under Investigation",
  },
  {
    id: 2,
    timestamp: "July 24, 2026 12:15",
    name: "Anonymous",
    class: "3CL",
    coy: "CHARLIE",
    subject: "Serving Portion Size",
    details: "The portion size for the chicken curry served today was quite small compared to last week. Some tables ran out of meat shares before the final cadets could serve themselves.",
    anonymous: true,
    status: "Resolved",
    resolutionResponse: "Council Response: Additional servings allocated. Kitchen stewards instructed to maintain standard 150g portion sizes for meat dishes.",
  },
];

export default function ConcernsPage() {
  const [concerns, setConcerns] = useState<Concern[]>(INITIAL_CONCERNS);
  const [subject, setSubject] = useState("");
  const [details, setDetails] = useState("");
  const [name, setName] = useState("");
  const [cadetClass, setCadetClass] = useState("1CL");
  const [coy, setCoy] = useState("ALFA");
  const [isAnonymous, setIsAnonymous] = useState(false);
  
  // Interactive UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject || !details) return;

    setIsSubmitting(true);

    setTimeout(() => {
      const newConcern: Concern = {
        id: Date.now(),
        timestamp: new Date().toLocaleString("en-US", {
          month: "long",
          day: "numeric",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        }),
        name: isAnonymous ? "Anonymous" : name || `CDT ${cadetClass} CADET`,
        class: cadetClass,
        coy: coy,
        subject: subject,
        details: details,
        anonymous: isAnonymous,
        status: "Received",
      };

      setConcerns([newConcern, ...concerns]);
      setSubject("");
      setDetails("");
      setName("");
      setIsAnonymous(false);
      setIsSubmitting(false);
      setSubmitted(true);
      setTimeout(() => setSubmitted(false), 5000);
    }, 1200);
  };

  const filteredConcerns = concerns.filter((c) => {
    const matchesStatus = filterStatus === "ALL" || c.status === filterStatus;
    const matchesSearch =
      c.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.details.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="animate-fade-in">
      <header className="page-header">
        <div className="page-title">
          <h2>Mess Concerns & Feedback</h2>
          <p>File reports, dining comments, or special requests directly to the Mess Council administrative deck.</p>
        </div>
      </header>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "2.5rem" }}>
        
        {/* Form Column */}
        <div className="animate-fade-in animate-stagger-1">
          <div className="card">
            <div className="card-title">Submit Feedback Report</div>
            
            {submitted && (
              <div className="alert-success animate-fade-in" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ width: "18px", height: "18px" }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Report submitted successfully. Thank you for your feedback!</span>
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              <div className="form-group">
                <label>Submission Privacy</label>
                <div style={{ display: "flex", gap: "1.5rem", marginTop: "4px" }}>
                  <label style={{ display: "flex", alignItems: "center", gap: "6px", textTransform: "none", fontWeight: "normal", fontSize: "0.85rem", cursor: "pointer", color: "var(--secondary)" }}>
                    <input
                      type="radio"
                      name="anonymous"
                      checked={!isAnonymous}
                      onChange={() => setIsAnonymous(false)}
                      style={{ accentColor: "var(--primary)" }}
                    />
                    Provide Details
                  </label>
                  <label style={{ display: "flex", alignItems: "center", gap: "6px", textTransform: "none", fontWeight: "normal", fontSize: "0.85rem", cursor: "pointer", color: "var(--secondary)" }}>
                    <input
                      type="radio"
                      name="anonymous"
                      checked={isAnonymous}
                      onChange={() => setIsAnonymous(true)}
                      style={{ accentColor: "var(--primary)" }}
                    />
                    Anonymous
                  </label>
                </div>
              </div>

              {!isAnonymous && (
                <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                  <div className="form-group">
                    <label htmlFor="name-input">Full Name</label>
                    <input
                      id="name-input"
                      type="text"
                      className="input-field"
                      placeholder="e.g. CDT 2CL JUAN DELA CRUZ"
                      value={name}
                      onChange={(e) => setName(e.target.value.toUpperCase())}
                      required={!isAnonymous}
                    />
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                    <div className="form-group">
                      <label htmlFor="class-select">Class</label>
                      <select
                        id="class-select"
                        className="input-field"
                        value={cadetClass}
                        onChange={(e) => setCadetClass(e.target.value)}
                      >
                        <option value="1CL">1CL (First Class)</option>
                        <option value="2CL">2CL (Second Class)</option>
                        <option value="3CL">3CL (Third Class)</option>
                        <option value="4CL">4CL (Fourth Class)</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label htmlFor="coy-select">Company</label>
                      <select
                        id="coy-select"
                        className="input-field"
                        value={coy}
                        onChange={(e) => setCoy(e.target.value)}
                      >
                        <option value="ALFA">Alfa</option>
                        <option value="BRAVO">Bravo</option>
                        <option value="CHARLIE">Charlie</option>
                        <option value="DELTA">Delta</option>
                        <option value="ECHO">Echo</option>
                        <option value="FOXTROT">Foxtrot</option>
                        <option value="GOLF">Golf</option>
                        <option value="HAWK">Hawk</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              <div className="form-group">
                <label htmlFor="subject-input">Subject / Title</label>
                <input
                  id="subject-input"
                  type="text"
                  className="input-field"
                  placeholder="e.g. Undercooked Meat / Cutlery Shortage"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="details-textarea">Description of Concern</label>
                <textarea
                  id="details-textarea"
                  className="input-field"
                  rows={5}
                  placeholder="Please state table numbers, date, meal, and specific details..."
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  style={{ resize: "vertical", fontFamily: "inherit" }}
                  required
                ></textarea>
              </div>

              <button type="submit" className="btn btn-primary" style={{ marginTop: "8px" }} disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin" style={{ width: "16px", height: "16px", marginRight: "6px" }} fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Filing report...
                  </>
                ) : "Submit Concern"}
              </button>
            </form>
          </div>
        </div>

        {/* List Column */}
        <div className="animate-fade-in animate-stagger-2" style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          
          {/* Filters & Search Box */}
          <div className="card" style={{ padding: "1.25rem" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div className="form-group">
                <label htmlFor="concern-search">Search Logs</label>
                <input
                  id="concern-search"
                  type="text"
                  placeholder="Search subject or text..."
                  className="input-field"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>Status Filter</label>
                <div className="filter-button-group">
                  {["ALL", "Received", "Under Investigation", "Resolved"].map(status => (
                    <button
                      key={status}
                      type="button"
                      className={`filter-btn ${filterStatus === status ? "active" : ""}`}
                      onClick={() => setFilterStatus(status)}
                      style={{ padding: "4px 8px", fontSize: "0.75rem" }}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Concerns Feed */}
          <div className="card">
            <div className="card-title">Recent Concerns Box</div>
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {filteredConcerns.length > 0 ? (
                filteredConcerns.map((c) => (
                  <div
                    key={c.id}
                    style={{
                      padding: "1.25rem",
                      border: "1px solid var(--border-color)",
                      borderRadius: "var(--border-radius-md)",
                      backgroundColor: "var(--background)",
                      position: "relative",
                    }}
                    className="animate-fade-in"
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        marginBottom: "10px",
                        flexWrap: "wrap",
                        gap: "6px",
                      }}
                    >
                      <div style={{ display: "flex", gap: "6px", alignItems: "center", flexWrap: "wrap" }}>
                        <span
                          className="badge"
                          style={{
                            backgroundColor: c.anonymous ? "var(--border-color)" : "var(--primary-light)",
                            color: c.anonymous ? "var(--secondary-light)" : "var(--primary)",
                          }}
                        >
                          {c.anonymous ? "Anonymous" : c.name}
                        </span>
                        
                        {/* Status tag */}
                        <span
                          className="badge"
                          style={{
                            backgroundColor:
                              c.status === "Resolved"
                                ? "var(--success-light)"
                                : c.status === "Under Investigation"
                                ? "var(--warning-light)"
                                : "var(--background)",
                            color:
                              c.status === "Resolved"
                                ? "var(--success)"
                                : c.status === "Under Investigation"
                                ? "var(--warning)"
                                : "var(--muted)",
                            border: `1px solid ${
                              c.status === "Resolved"
                                ? "var(--success)"
                                : c.status === "Under Investigation"
                                ? "var(--warning)"
                                : "var(--border-color)"
                            }`,
                            fontSize: "0.65rem",
                          }}
                        >
                          {c.status}
                        </span>
                      </div>
                      <span style={{ fontSize: "0.75rem", color: "var(--muted)" }}>{c.timestamp}</span>
                    </div>

                    <h4 style={{ fontSize: "1rem", margin: "6px 0", color: "var(--secondary)" }}>{c.subject}</h4>
                    <p style={{ fontSize: "0.85rem", color: "var(--secondary-light)", lineHeight: "1.5" }}>{c.details}</p>
                    
                    {!c.anonymous && (
                      <div style={{ fontSize: "0.75rem", color: "var(--muted)", marginTop: "8px", borderTop: "1px dashed var(--border-color)", paddingTop: "6px" }}>
                        Company: {c.coy} | Class: {c.class}
                      </div>
                    )}

                    {/* Official Council Response Block */}
                    {c.resolutionResponse && (
                      <div 
                        style={{ 
                          marginTop: "10px", 
                          padding: "8px 12px", 
                          backgroundColor: "var(--success-light)", 
                          borderLeft: "3px solid var(--success)",
                          borderRadius: "4px",
                          fontSize: "0.8rem",
                          color: "var(--secondary)",
                          fontWeight: 500
                        }}
                      >
                        {c.resolutionResponse}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <p style={{ textAlign: "center", color: "var(--muted)", padding: "1.5rem" }}>No feedback files match the filter.</p>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
