"use client";

import React, { useState } from "react";

export default function DietSignifyPage() {
  const [name, setName] = useState("");
  const [serialNo, setSerialNo] = useState("");
  const [cadetClass, setCadetClass] = useState("1CL");
  const [coy, setCoy] = useState("ALFA");
  const [diet, setDiet] = useState("No Pork");
  const [otherDiet, setOtherDiet] = useState("");
  const [medCert, setMedCert] = useState<File | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setMedCert(e.target.files[0]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !serialNo || (diet === "Other" && !otherDiet) || !medCert) return;

    // Simulate submission
    console.log("Submitting Special Diet request:", {
      name,
      serialNo,
      class: cadetClass,
      coy,
      diet: diet === "Other" ? otherDiet : diet,
      medCertName: medCert.name,
    });

    setSubmitted(true);
    setName("");
    setSerialNo("");
    setOtherDiet("");
    setMedCert(null);
    setTimeout(() => setSubmitted(false), 8000);
  };

  return (
    <div style={{ maxWidth: "700px" }}>
      <header className="page-header">
        <div className="page-title">
          <h2>Special Diet Registration</h2>
          <p>Register or update your dietary restrictions in the messing database. Requires official medical certificate verification.</p>
        </div>
      </header>

      <div className="card">
        <div className="card-title">Special Diet Form</div>

        {submitted && (
          <div className="alert-success">
            <strong>Application Received!</strong> Your special diet request has been submitted to the Regimental Mess Officer. It will be verified against the uploaded medical certificate before the database is updated.
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem" }}>
            <div className="form-group">
              <label htmlFor="name-input">Cadet Full Name</label>
              <input
                id="name-input"
                type="text"
                className="input-field"
                placeholder="e.g. CDT 1CL JUAN DELA CRUZ"
                value={name}
                onChange={(e) => setName(e.target.value.toUpperCase())}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="serial-input">Serial Number</label>
              <input
                id="serial-input"
                type="text"
                className="input-field"
                placeholder="e.g. C-27000"
                value={serialNo}
                onChange={(e) => setSerialNo(e.target.value.toUpperCase())}
                required
              />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem" }}>
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

          <div className="form-group">
            <label htmlFor="diet-select">Dietary Restriction</label>
            <select
              id="diet-select"
              className="input-field"
              value={diet}
              onChange={(e) => setDiet(e.target.value)}
            >
              <option value="No Pork">No Pork (Halal-friendly / Religious)</option>
              <option value="No Beef">No Beef (Buddhist-friendly / Medical)</option>
              <option value="Vegetarian">Vegetarian (No meat)</option>
              <option value="Vegan">Vegan (No animal products)</option>
              <option value="Seafood Allergy">Seafood Allergy</option>
              <option value="Peanut Allergy">Peanut Allergy</option>
              <option value="Other">Other (Specify below)</option>
            </select>
          </div>

          {diet === "Other" && (
            <div className="form-group">
              <label htmlFor="other-diet-input">Specify Dietary Restrictions</label>
              <input
                id="other-diet-input"
                type="text"
                className="input-field"
                placeholder="e.g. Dairy intolerance, Egg allergy"
                value={otherDiet}
                onChange={(e) => setOtherDiet(e.target.value)}
                required
              />
            </div>
          )}

          <div className="form-group">
            <label>Medical Certificate Verification</label>
            <p style={{ fontSize: "0.8rem", color: "var(--secondary-light)", marginBottom: "4px" }}>
              Please attach an official medical certificate (PDF, JPG, or PNG) supporting your requested dietary restriction. Files must be signed by the PMA Medical Disbursary.
            </p>
            <div className="file-upload-wrapper">
              <input
                type="file"
                className="file-upload-input"
                accept=".pdf,.png,.jpg,.jpeg"
                onChange={handleFileChange}
                required
              />
              <div className="file-upload-trigger">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  />
                </svg>
                <div style={{ fontWeight: 600, fontSize: "0.95rem" }}>
                  {medCert ? medCert.name : "Click to select or drag medical certificate here"}
                </div>
                <div style={{ fontSize: "0.75rem", color: "var(--muted)", marginTop: "4px" }}>
                  PDF, PNG, or JPG up to 10MB
                </div>
              </div>
            </div>
          </div>

          <button type="submit" className="btn btn-primary" style={{ marginTop: "1rem" }}>
            Submit Application
          </button>
        </form>
      </div>
    </div>
  );
}
