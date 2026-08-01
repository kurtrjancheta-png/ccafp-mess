"use client";

import React, { useState } from "react";
import Link from "next/link";

export default function DietSignifyPage() {
  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [serialNo, setSerialNo] = useState("");
  const [cadetClass, setCadetClass] = useState("1CL");
  const [coy, setCoy] = useState("ALFA");
  const [diet, setDiet] = useState("No Pork");
  const [otherDiet, setOtherDiet] = useState("");
  const [medCert, setMedCert] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setMedCert(e.target.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      const validTypes = [".pdf", ".png", ".jpg", ".jpeg"];
      const ext = file.name.slice(file.name.lastIndexOf(".")).toLowerCase();
      if (validTypes.includes(ext)) {
        setMedCert(file);
      } else {
        alert("Invalid file format. Please upload PDF, PNG, or JPG.");
      }
    }
  };

  const nextStep = () => {
    if (step === 1 && (!name || !serialNo)) {
      alert("Please fill in name and serial number.");
      return;
    }
    if (step === 2 && diet === "Other" && !otherDiet) {
      alert("Please specify your dietary restriction.");
      return;
    }
    setStep(step + 1);
  };

  const prevStep = () => {
    setStep(step - 1);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !serialNo || (diet === "Other" && !otherDiet) || !medCert) return;

    setIsSubmitting(true);

    // Simulate submission loading animation
    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitted(true);
    }, 1500);
  };

  const resetForm = () => {
    setName("");
    setSerialNo("");
    setOtherDiet("");
    setMedCert(null);
    setStep(1);
    setSubmitted(false);
  };

  return (
    <div className="animate-fade-in" style={{ maxWidth: "680px" }}>
      <header className="page-header">
        <div className="page-title">
          <h2>Special Diet Registration</h2>
          <p>Request adjustments in the messing database. Official medical certificate verification is required.</p>
        </div>
      </header>

      <div className="card">
        {submitted ? (
          /* Animated Success View */
          <div style={{ textAlign: "center", padding: "2rem 1rem" }} className="animate-fade-in">
            <div className="success-checkmark">
              <div className="check-icon">
                <span className="icon-line line-tip"></span>
                <span className="icon-line line-long"></span>
              </div>
            </div>
            
            <h3 style={{ fontSize: "1.4rem", margin: "1rem 0" }}>Application Received!</h3>
            <p style={{ fontSize: "0.9rem", color: "var(--secondary-light)", marginBottom: "2rem", lineHeight: "1.6" }}>
              Thank you, <strong>CDT {cadetClass} {name}</strong>. Your special diet request has been forwarded to the Regimental Mess Officer. 
              The database will be updated upon medical certificate validation.
            </p>

            <div style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
              <button className="btn btn-primary" onClick={resetForm}>
                Submit Another Request
              </button>
              <Link href="/" className="btn btn-outline">
                Back to Dashboard
              </Link>
            </div>
          </div>
        ) : (
          /* Multi-step Form Wizard */
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            
            {/* Step indicators */}
            <div className="wizard-steps">
              <div className={`wizard-step ${step >= 1 ? "active" : ""} ${step > 1 ? "completed" : ""}`}>
                {step > 1 ? "✓" : "1"}
              </div>
              <div className={`wizard-step ${step >= 2 ? "active" : ""} ${step > 2 ? "completed" : ""}`}>
                {step > 2 ? "✓" : "2"}
              </div>
              <div className={`wizard-step ${step >= 3 ? "active" : ""}`}>
                3
              </div>
            </div>

            {/* Step 1: Cadet Identity */}
            {step === 1 && (
              <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                <div style={{ borderBottom: "1px solid var(--border-color)", paddingBottom: "0.5rem", marginBottom: "0.5rem" }}>
                  <h3 style={{ fontSize: "1.1rem" }}>Step 1: Cadet Identity</h3>
                  <p style={{ fontSize: "0.8rem", color: "var(--muted)" }}>Enter your official registration credentials.</p>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem" }}>
                  <div className="form-group">
                    <label htmlFor="name-input">Cadet Last Name</label>
                    <input
                      id="name-input"
                      type="text"
                      className="input-field"
                      placeholder="e.g. ADTOON"
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
                      placeholder="e.g. C-27002"
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

                <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "1rem" }}>
                  <button type="button" className="btn btn-primary" onClick={nextStep}>
                    Next Step
                  </button>
                </div>
              </div>
            )}

            {/* Step 2: Dietary Restriction */}
            {step === 2 && (
              <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                <div style={{ borderBottom: "1px solid var(--border-color)", paddingBottom: "0.5rem", marginBottom: "0.5rem" }}>
                  <h3 style={{ fontSize: "1.1rem" }}>Step 2: Dietary Restriction</h3>
                  <p style={{ fontSize: "0.8rem", color: "var(--muted)" }}>Indicate your allergy or preference restriction.</p>
                </div>

                <div className="form-group">
                  <label htmlFor="diet-select">Dietary Category</label>
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
                    <option value="Other">Other (Specify details)</option>
                  </select>
                </div>

                {diet === "Other" && (
                  <div className="form-group animate-fade-in">
                    <label htmlFor="other-diet-input">Specify Restrictions</label>
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

                <div style={{ display: "flex", justifyContent: "space-between", marginTop: "1rem" }}>
                  <button type="button" className="btn btn-outline" onClick={prevStep}>
                    Back
                  </button>
                  <button type="button" className="btn btn-primary" onClick={nextStep}>
                    Next Step
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Medical Verification */}
            {step === 3 && (
              <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                <div style={{ borderBottom: "1px solid var(--border-color)", paddingBottom: "0.5rem", marginBottom: "0.5rem" }}>
                  <h3 style={{ fontSize: "1.1rem" }}>Step 3: Medical Verification</h3>
                  <p style={{ fontSize: "0.8rem", color: "var(--muted)" }}>Attach an official certificate to validate your claims.</p>
                </div>

                <div className="form-group">
                  <label>Medical Certificate Upload</label>
                  <div 
                    className={`file-upload-wrapper`}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                  >
                    <input
                      type="file"
                      className="file-upload-input"
                      accept=".pdf,.png,.jpg,.jpeg"
                      onChange={handleFileChange}
                      required={!medCert}
                    />
                    <div className={`file-upload-trigger ${isDragging ? "dragging" : ""}`}>
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
                      {medCert ? (
                        <div className="animate-fade-in">
                          <div style={{ fontWeight: 700, fontSize: "0.95rem", color: "var(--success)" }}>
                            ✓ {medCert.name}
                          </div>
                          <div style={{ fontSize: "0.75rem", color: "var(--muted)", marginTop: "4px" }}>
                            File size: {Math.round(medCert.size / 1024)} KB - Click to replace
                          </div>
                        </div>
                      ) : (
                        <div>
                          <div style={{ fontWeight: 600, fontSize: "0.9rem" }}>
                            Drag and drop or click to select file
                          </div>
                          <div style={{ fontSize: "0.75rem", color: "var(--muted)", marginTop: "4px" }}>
                            Accepts PDF, PNG, or JPG (Max 10MB)
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", marginTop: "1rem" }}>
                  <button type="button" className="btn btn-outline" onClick={prevStep} disabled={isSubmitting}>
                    Back
                  </button>
                  <button type="submit" className="btn btn-primary animate-pulse" disabled={isSubmitting || !medCert}>
                    {isSubmitting ? (
                      <>
                        <svg className="animate-spin" style={{ width: "16px", height: "16px", marginRight: "6px" }} fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Submitting...
                      </>
                    ) : "Submit Application"}
                  </button>
                </div>
              </div>
            )}

          </form>
        )}
      </div>

      {/* Advisory card */}
      <div className="card animate-fade-in animate-stagger-2" style={{ borderLeft: "4px solid var(--accent)" }}>
        <h4 style={{ fontSize: "0.95rem", marginBottom: "0.5rem" }}>Regulatory Compliance Advisory</h4>
        <p style={{ fontSize: "0.8rem", color: "var(--secondary-light)", lineHeight: "1.5" }}>
          In accordance with the Regimental Mess Code, falsification of medical credentials or dietary claims constitutes a major honor code violation. All uploads undergo verification with the PMA dispensary records.
        </p>
      </div>
    </div>
  );
}
