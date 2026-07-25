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
}

const INITIAL_CONCERNS: Concern[] = [
  {
    id: 1,
    timestamp: "July 24, 2026 18:30",
    name: "CDT 2CL JUAN DELA CRUZ",
    class: "2CL",
    coy: "ALFA",
    subject: "Quality of Rice during Breakfast",
    details: "The garlic rice served during this morning's breakfast was slightly undercooked. Many cadets in our table complained about the hardness of the grains. Requesting the kitchen crew to ensure proper steaming times.",
    anonymous: false,
  },
  {
    id: 2,
    timestamp: "July 22, 2026 12:15",
    name: "Anonymous",
    class: "3CL",
    coy: "CHARLIE",
    subject: "Serving Portion Size",
    details: "The portion size for the chicken curry served today was quite small compared to last week. Some tables ran out of meat shares before the final cadets could serve themselves.",
    anonymous: true,
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
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject || !details) return;

    const newConcern: Concern = {
      id: Date.now(),
      timestamp: new Date().toLocaleString(),
      name: isAnonymous ? "Anonymous" : name || "CDT " + cadetClass + " CADET",
      class: cadetClass,
      coy: coy,
      subject: subject,
      details: details,
      anonymous: isAnonymous,
    };

    setConcerns([newConcern, ...concerns]);
    setSubject("");
    setDetails("");
    setName("");
    setIsAnonymous(false);
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 5000);
  };

  return (
    <div>
      <header className="page-header">
        <div className="page-title">
          <h2>Mess Concerns & Feedback</h2>
          <p>Submit reports, suggestions, or complaints directly to the Mess Council.</p>
        </div>
      </header>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "2.5rem" }}>
        
        {/* Form Column */}
        <div>
          <div className="card">
            <div className="card-title">Submit Feedback Report</div>
            
            {submitted && (
              <div className="alert-success">
                Feedback submitted successfully. Thank you for your response!
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              <div className="form-group">
                <label>Submission Type</label>
                <div style={{ display: "flex", gap: "1.5rem", marginTop: "4px" }}>
                  <label style={{ display: "flex", alignItems: "center", gap: "6px", textTransform: "none", fontWeight: "normal", fontSize: "0.9rem", cursor: "pointer" }}>
                    <input
                      type="radio"
                      name="anonymous"
                      checked={!isAnonymous}
                      onChange={() => setIsAnonymous(false)}
                      style={{ accentColor: "var(--primary)" }}
                    />
                    Provide Details (Name & Company)
                  </label>
                  <label style={{ display: "flex", alignItems: "center", gap: "6px", textTransform: "none", fontWeight: "normal", fontSize: "0.9rem", cursor: "pointer" }}>
                    <input
                      type="radio"
                      name="anonymous"
                      checked={isAnonymous}
                      onChange={() => setIsAnonymous(true)}
                      style={{ accentColor: "var(--primary)" }}
                    />
                    Anonymous Submission
                  </label>
                </div>
              </div>

              {!isAnonymous && (
                <>
                  <div className="form-group">
                    <label htmlFor="name-input">Full Name</label>
                    <input
                      id="name-input"
                      type="text"
                      className="input-field"
                      placeholder="e.g. CDT 1CL JUAN DELA CRUZ"
                      value={name}
                      onChange={(e) => setName(e.target.value.toUpperCase())}
                      required={!isAnonymous}
                    />
                  </div>

                  <div style={{ display: "flex", gap: "1rem" }}>
                    <div className="form-group" style={{ flex: 1 }}>
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

                    <div className="form-group" style={{ flex: 1 }}>
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
                </>
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
                  placeholder="Please provide specific details such as date, meal type (breakfast/lunch/dinner), table number, and description..."
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  style={{ resize: "vertical", fontFamily: "inherit" }}
                  required
                ></textarea>
              </div>

              <button type="submit" className="btn btn-primary" style={{ marginTop: "8px" }}>
                Submit Concern
              </button>
            </form>
          </div>
        </div>

        {/* List Column */}
        <div>
          <div className="card">
            <div className="card-title">Recent Concerns Box</div>
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {concerns.map((c) => (
                <div
                  key={c.id}
                  style={{
                    padding: "1rem",
                    border: "1px solid var(--border-color)",
                    borderRadius: "12px",
                    backgroundColor: "#FFFBFB",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: "6px",
                    }}
                  >
                    <span
                      className="badge"
                      style={{
                        backgroundColor: c.anonymous ? "#EEF2F6" : "#E2FFE7",
                        color: c.anonymous ? "#64748B" : "#047857",
                      }}
                    >
                      {c.anonymous ? "Anonymous" : c.name}
                    </span>
                    <span style={{ fontSize: "0.75rem", color: "var(--muted)" }}>{c.timestamp}</span>
                  </div>
                  <h4 style={{ fontSize: "0.95rem", margin: "6px 0" }}>{c.subject}</h4>
                  <p style={{ fontSize: "0.85rem", color: "var(--secondary-light)" }}>{c.details}</p>
                  {!c.anonymous && (
                    <div style={{ fontSize: "0.75rem", color: "var(--muted)", marginTop: "8px", borderTop: "1px solid var(--border-color)", paddingTop: "6px" }}>
                      Company: {c.coy} | Class: {c.class}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
