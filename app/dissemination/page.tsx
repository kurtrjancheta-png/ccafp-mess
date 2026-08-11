"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";

// Types matching the project structure
interface Cadet {
  no: string;
  class: string;
  name: string;
  serialNo: string;
  gender: string;
  company: string;
  battalion: string;
  bos: string;
  status: string;
  diets: { [dietName: string]: boolean };
}

interface DisseminationRecord {
  date: string;
  meal: string;
  company: string;
  battalion: string;
  totalStrength: number;
  present: number;
  excused: number;
  hc: number;
  sickBay: number;
  hospital: number;
  duty: number;
  leave: number;
  otherExcused: number;
  dietsTotal: number;
  diets: { [dietName: string]: number };
  timestamp: string;
}

interface CompanyFormRow {
  company: string;
  battalion: string;
  totalStrength: number;
  present: number;
  excused: number;
  hc: number;
  sickBay: number;
  hospital: number;
  duty: number;
  leave: number;
  otherExcused: number;
  dietsTotal: number;
  diets: { [dietName: string]: number };
  showDietEdit: boolean;
}

export default function DisseminationsPage() {
  const { user } = useAuth();
  const isAuthorized = user && (user.role === "RMESSO" || user.role === "MESS_OFFICER");

  const [records, setRecords] = useState<DisseminationRecord[]>([]);
  const [cadets, setCadets] = useState<Cadet[]>([]);
  const [dietColumns, setDietColumns] = useState<string[]>([
    "NO FISH", "NO PORK", "NO SEAFOOD", "NO EGG", "NO CHICKEN", "NO BLOOD", 
    "NO FOOD PROCESSED FOOD", "NO BEANS", "NO NUTS", "NO TOFU", "NO COFFEE", 
    "NO CHOCOLATE", "NO TOMATOES", "NO SPICY", "NO BEEF"
  ]);
  const [loading, setLoading] = useState(false);
  const [recording, setRecording] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [recordSuccess, setRecordSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // View States
  const [selectedDate, setSelectedDate] = useState<string>("2026-07-26");
  const [selectedMeal, setSelectedMeal] = useState<string>("LUNCH");
  const [activeCompanyDetail, setActiveCompanyDetail] = useState<string | null>(null);
  const [showAllDiets, setShowAllDiets] = useState(false);

  // Form Mode States
  const [isFormMode, setIsFormMode] = useState(false);
  const [formDate, setFormDate] = useState<string>("2026-07-26");
  const [formMeal, setFormMeal] = useState<string>("LUNCH");
  const [formRows, setFormRows] = useState<CompanyFormRow[]>([]);

  // Determine current meal based on time of day
  const getAutoMeal = (): string => {
    const hour = new Date().getHours();
    if (hour < 9) return "BREAKFAST";
    if (hour < 14) return "LUNCH";
    return "DINNER";
  };

  // Set default filters on mount
  useEffect(() => {
    const today = new Date();
    const dd = String(today.getDate()).padStart(2, "0");
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const yyyy = today.getFullYear();
    const dateStr = `${yyyy}-${mm}-${dd}`;
    
    setSelectedDate(dateStr);
    setSelectedMeal(getAutoMeal());
    
    setFormDate(dateStr);
    setFormMeal(getAutoMeal());
    
    fetchData();
  }, []);

  // Helper to parse CSV properly handling quotes and commas
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
          i++; // skip
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

  // Main fetch function
  const fetchData = async () => {
    setLoading(true);
    setError(null);

    const sheetId = process.env.NEXT_PUBLIC_SPREADSHEET_ID || "14dSYE1ntxNrnBdgSn-mWU5z-GMHK7qdMcKFchgh0pAQ";
    const dbGid = process.env.NEXT_PUBLIC_DATABASE_GID || "482780671";
    const disGid = "1204067800"; // Disseminations tab GID
    const appsScriptUrl = process.env.NEXT_PUBLIC_APPS_SCRIPT_URL;

    const dbUrl = appsScriptUrl 
      ? `${appsScriptUrl}?action=getDatabase` 
      : `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${dbGid}&t=${Date.now()}`;
      
    const disUrl = appsScriptUrl 
      ? `${appsScriptUrl}?action=getDisseminations` 
      : `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${disGid}&t=${Date.now()}`;

    try {
      // 1. Fetch live roster database for cadet details cross-referencing
      const dbResponse = await fetch(dbUrl);
      let parsedCadets: Cadet[] = [];
      let parsedDietCols: string[] = dietColumns;

      if (dbResponse.ok) {
        if (appsScriptUrl) {
          const json = await dbResponse.json();
          if (json.success && Array.isArray(json.data)) {
            const rawData = json.data;
            if (rawData.length > 0) {
              const sampleRow = rawData[0];
              const dietsList = Object.keys(sampleRow).filter((k) => k.toUpperCase().startsWith("NO "));
              if (dietsList.length > 0) {
                parsedDietCols = dietsList;
                setDietColumns(dietsList);
              }

              parsedCadets = rawData.map((row: any, i: number) => {
                const cadetDiets: { [dietName: string]: boolean } = {};
                parsedDietCols.forEach((col) => {
                  cadetDiets[col] = row[col] === "1" || row[col] === 1 || row[col] === true;
                });
                return {
                  no: (i + 1).toString(),
                  class: row["CLASS"] ? row["CLASS"].toString().trim().toUpperCase() : "4CL",
                  name: row["NAME"] ? row["NAME"].toString().trim().toUpperCase() : "UNNAMED CADET",
                  serialNo: "N/A",
                  gender: "M",
                  company: row["COMPANY"] ? row["COMPANY"].toString().trim().toUpperCase() : "",
                  battalion: row["BATTALION"] ? row["BATTALION"].toString().trim().toUpperCase() : "",
                  bos: row["BOS"] ? row["BOS"].toString().trim().toUpperCase() : "N/A",
                  status: row["STATUS"] ? row["STATUS"].toString().trim().toUpperCase() : "FULL DUTY",
                  diets: cadetDiets
                };
              });
              setCadets(parsedCadets);
            }
          }
        } else {
          // Fallback to CSV parse
          const dbCsv = await dbResponse.text();
          const dbRows = parseCSV(dbCsv);

          if (dbRows.length >= 2) {
            const headers = dbRows[0].map((h) => h.trim());
            const colIndices = {
              company: headers.findIndex((h) => h.toUpperCase() === "COMPANY"),
              name: headers.findIndex((h) => h.toUpperCase() === "NAME"),
              bos: headers.findIndex((h) => h.toUpperCase() === "BOS"),
              class: headers.findIndex((h) => h.toUpperCase() === "CLASS"),
              battalion: headers.findIndex((h) => h.toUpperCase() === "BATTALION"),
              status: headers.findIndex((h) => h.toUpperCase() === "STATUS")
            };

            // Find diets
            const dietsList: string[] = [];
            const dietColIndices: { [name: string]: number } = {};
            headers.forEach((header, idx) => {
              if (header && header.toUpperCase().startsWith("NO ")) {
                dietsList.push(header);
                dietColIndices[header] = idx;
              }
            });
            if (dietsList.length > 0) {
              parsedDietCols = dietsList;
              setDietColumns(dietsList);
            }

            for (let i = 1; i < dbRows.length; i++) {
              const row = dbRows[i];
              if (!row || row.length === 0 || !row[colIndices.name]) continue;

              const cadetDiets: { [dietName: string]: boolean } = {};
              parsedDietCols.forEach((col) => {
                const idx = dietColIndices[col];
                cadetDiets[col] = row[idx] ? row[idx].trim() === "1" : false;
              });

              const companyStr = row[colIndices.company] ? row[colIndices.company].trim().toUpperCase() : "";
              
              parsedCadets.push({
                no: i.toString(),
                class: row[colIndices.class] ? row[colIndices.class].trim().toUpperCase() : "4CL",
                name: row[colIndices.name].trim().toUpperCase(),
                serialNo: "N/A",
                gender: "M",
                company: companyStr,
                battalion: row[colIndices.battalion] ? row[colIndices.battalion].trim().toUpperCase() : "",
                bos: row[colIndices.bos] ? row[colIndices.bos].trim().toUpperCase() : "N/A",
                status: row[colIndices.status] ? row[colIndices.status].trim().toUpperCase() : "FULL DUTY",
                diets: cadetDiets
              });
            }
            setCadets(parsedCadets);
          }
        }
      }

      // 2. Fetch live Disseminations reports
      const disResponse = await fetch(disUrl);
      if (!disResponse.ok) {
        throw new Error(`Failed to load disseminations log: Status ${disResponse.status}`);
      }

      if (appsScriptUrl) {
        const json = await disResponse.json();
        if (json.success && Array.isArray(json.data)) {
          const rawData = json.data;
          const parsedRecords: DisseminationRecord[] = rawData.map((row: any) => {
            let dateVal = row["Date"] ? row["Date"].toString().trim() : "";
            if (dateVal.includes("T")) {
              dateVal = dateVal.split("T")[0];
            }
            
            const dietsMap: { [dietName: string]: number } = {};
            parsedDietCols.forEach((dCol) => {
              dietsMap[dCol] = parseInt(row[dCol], 10) || 0;
            });

            return {
              date: dateVal,
              meal: row["Meal"] ? row["Meal"].toString().trim().toUpperCase() : "LUNCH",
              company: row["Company"] ? row["Company"].toString().trim().toUpperCase() : "",
              battalion: row["Battalion"] ? row["Battalion"].toString().trim().toUpperCase() : "",
              totalStrength: parseInt(row["Total Strength"], 10) || 0,
              present: parseInt(row["Present"], 10) || 0,
              excused: parseInt(row["Excused"], 10) || 0,
              hc: parseInt(row["Excused (HC)"], 10) || 0,
              sickBay: parseInt(row["Excused (Sick Bay)"], 10) || 0,
              hospital: parseInt(row["Excused (Hospital)"], 10) || 0,
              duty: parseInt(row["Excused (Duty)"], 10) || 0,
              leave: parseInt(row["Excused (Leave)"], 10) || 0,
              otherExcused: parseInt(row["Excused (Other)"], 10) || 0,
              dietsTotal: parseInt(row["Special Diets Total"], 10) || 0,
              diets: dietsMap,
              timestamp: row["Timestamp"] ? row["Timestamp"].toString().trim() : ""
            };
          });

          if (parsedRecords.length > 0) {
            setRecords(parsedRecords);
          } else {
            setRecords([]);
          }
        } else {
          throw new Error(json.error || "Google Apps Script API returned an error response.");
        }
      } else {
        // Fallback to CSV parse
        const disCsv = await disResponse.text();
        const disRows = parseCSV(disCsv);

        if (disRows.length < 2) {
          setRecords([]);
        } else {
          const headers = disRows[0].map((h) => h.trim());
          
          const colIndices = {
            date: headers.indexOf("Date"),
            meal: headers.indexOf("Meal"),
            company: headers.indexOf("Company"),
            battalion: headers.indexOf("Battalion"),
            totalStrength: headers.indexOf("Total Strength"),
            present: headers.indexOf("Present"),
            excused: headers.indexOf("Excused"),
            hc: headers.indexOf("Excused (HC)"),
            sickBay: headers.indexOf("Excused (Sick Bay)"),
            hospital: headers.indexOf("Excused (Hospital)"),
            duty: headers.indexOf("Excused (Duty)"),
            leave: headers.indexOf("Excused (Leave)"),
            otherExcused: headers.indexOf("Excused (Other)"),
            dietsTotal: headers.indexOf("Special Diets Total"),
            timestamp: headers.indexOf("Timestamp")
          };

          const parsedRecords: DisseminationRecord[] = [];
          for (let i = 1; i < disRows.length; i++) {
            const row = disRows[i];
            if (!row || row.length === 0 || !row[colIndices.company]) continue;

            let dateVal = row[colIndices.date] ? row[colIndices.date].trim() : "";
            if (dateVal.includes("T")) {
              dateVal = dateVal.split("T")[0];
            }

            const dietsMap: { [dietName: string]: number } = {};
            parsedDietCols.forEach((dCol) => {
              const colIdx = headers.indexOf(dCol);
              dietsMap[dCol] = colIdx !== -1 && row[colIdx] ? parseInt(row[colIdx].trim(), 10) || 0 : 0;
            });

            parsedRecords.push({
              date: dateVal,
              meal: row[colIndices.meal] ? row[colIndices.meal].trim().toUpperCase() : "LUNCH",
              company: row[colIndices.company].trim().toUpperCase(),
              battalion: row[colIndices.battalion] ? row[colIndices.battalion].trim().toUpperCase() : "",
              totalStrength: parseInt(row[colIndices.totalStrength], 10) || 0,
              present: parseInt(row[colIndices.present], 10) || 0,
              excused: parseInt(row[colIndices.excused], 10) || 0,
              hc: parseInt(row[colIndices.hc], 10) || 0,
              sickBay: parseInt(row[colIndices.sickBay], 10) || 0,
              hospital: parseInt(row[colIndices.hospital], 10) || 0,
              duty: parseInt(row[colIndices.duty], 10) || 0,
              leave: parseInt(row[colIndices.leave], 10) || 0,
              otherExcused: parseInt(row[colIndices.otherExcused], 10) || 0,
              dietsTotal: parseInt(row[colIndices.dietsTotal], 10) || 0,
              diets: dietsMap,
              timestamp: row[colIndices.timestamp] ? row[colIndices.timestamp].trim() : ""
            });
          }

          if (parsedRecords.length > 0) {
            setRecords(parsedRecords);
          } else {
            setRecords([]);
          }
        }
      }
    } catch (err: any) {
      console.error("Spreadsheet fetch failed:", err.message);
      setError(`Could not connect to live Google Sheet. Error: ${err.message}`);
      setRecords([]);
    } finally {
      setLoading(false);
    }
  };

  // Triggers Google Apps Script Web App to record a snapshot of the current database (automated)
  const handleRecordSnapshot = async () => {
    const appsScriptUrl = process.env.NEXT_PUBLIC_APPS_SCRIPT_URL;
    if (!appsScriptUrl) {
      alert("Apps Script Web App URL is not configured. Please use Google Sheets directly to record snapshots.");
      return;
    }

    const confirmMsg = `Are you sure you want to record the dissemination snapshot for ${selectedDate} (${selectedMeal})?\n\nThis will snapshot the current cadet statuses (present/excused) and special diets from the database and write it to the sheet.`;
    if (!window.confirm(confirmMsg)) {
      return;
    }

    setRecording(true);
    setRecordSuccess(null);
    setError(null);

    try {
      const url = `${appsScriptUrl}?action=record&date=${selectedDate}&meal=${selectedMeal.toUpperCase()}`;
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Google Script returned HTTP Status ${response.status}`);
      }

      const json = await response.json();
      if (json.success) {
        setRecordSuccess(json.message || "Snapshot recorded successfully!");
        await fetchData();
        setTimeout(() => setRecordSuccess(null), 5000);
      } else {
        throw new Error(json.error || "Apps Script failed to process request.");
      }
    } catch (err: any) {
      console.error("Recording snapshot failed:", err);
      setError(`Failed to trigger snapshot: ${err.message}`);
    } finally {
      setRecording(false);
    }
  };

  // Pre-fills and opens the custom posting form
  const handleOpenPostingForm = () => {
    const targetCompanies = ["ALFA", "BRAVO", "CHARLIE", "DELTA", "ECHO", "FOXTROT", "GOLF", "HAWK"];
    
    // Set form parameters to active view parameters
    setFormDate(selectedDate);
    setFormMeal(selectedMeal);

    // Compute defaults for each company from the live database
    const initialRows = targetCompanies.map((coy) => {
      const coyCadets = cadets.filter((c) => c.company === coy);
      const totalStrength = coyCadets.length || 100; // fallback if database is empty

      // Count status
      const present = coyCadets.filter((c) => c.status === "FULL DUTY" || c.status === "" || c.status === "FD").length || totalStrength;
      const excused = totalStrength - present;

      // Excused categories
      const hc = coyCadets.filter((c) => c.status === "HC" || c.status.includes("HOLDING")).length;
      const sickBay = coyCadets.filter((c) => c.status === "SICK BAY" || c.status === "SB").length;
      const hospital = coyCadets.filter((c) => c.status === "HOSPITAL" || c.status === "PMAH" || c.status === "HOSP").length;
      const duty = coyCadets.filter((c) => c.status === "DUTY" || c.status === "GUARD").length;
      const leave = coyCadets.filter((c) => c.status === "LEAVE" || c.status === "PASS").length;
      const otherExcused = Math.max(0, excused - (hc + sickBay + hospital + duty + leave));

      // Diets count
      const dietsTotal = coyCadets.filter((c) => Object.values(c.diets).some((v) => v === true)).length;

      // Diets detailed map
      const diets: { [dietName: string]: number } = {};
      dietColumns.forEach((dName) => {
        diets[dName] = coyCadets.filter((c) => c.diets[dName] === true).length;
      });

      return {
        company: coy,
        battalion: getFallbackBattalion(coy),
        totalStrength,
        present,
        excused,
        hc,
        sickBay,
        hospital,
        duty,
        leave,
        otherExcused,
        dietsTotal,
        diets,
        showDietEdit: false
      };
    });

    setFormRows(initialRows);
    setIsFormMode(true);
  };

  // Helper to resolve battalion names
  const getFallbackBattalion = (coy: string): string => {
    const clean = coy.toUpperCase().trim();
    if (clean === "ALFA" || clean === "BRAVO") return "1ST BATTALION";
    if (clean === "CHARLIE" || clean === "DELTA") return "2ND BATTALION";
    if (clean === "ECHO" || clean === "FOXTROT") return "3RD BATTALION";
    if (clean === "GOLF" || clean === "HAWK") return "4TH BATTALION";
    return "OTHER";
  };

  // Bidirectional form value change handler (maintains Present + Excused = Total)
  const handleFormNumberChange = (companyName: string, field: string, value: number) => {
    setFormRows((prev) =>
      prev.map((row) => {
        if (row.company !== companyName) return row;

        const updated = { ...row };
        const val = Math.max(0, value);

        if (field === "totalStrength") {
          updated.totalStrength = val;
          updated.excused = Math.max(0, updated.totalStrength - updated.present);
          updated.otherExcused = Math.max(0, updated.excused - (updated.hc + updated.sickBay + updated.hospital + updated.duty + updated.leave));
        } else if (field === "present") {
          updated.present = Math.min(updated.totalStrength, val);
          updated.excused = updated.totalStrength - updated.present;
          updated.otherExcused = Math.max(0, updated.excused - (updated.hc + updated.sickBay + updated.hospital + updated.duty + updated.leave));
        } else {
          // Adjust specific category
          if (field === "hc") updated.hc = val;
          else if (field === "sickBay") updated.sickBay = val;
          else if (field === "hospital") updated.hospital = val;
          else if (field === "duty") updated.duty = val;
          else if (field === "leave") updated.leave = val;
          else if (field === "otherExcused") updated.otherExcused = val;
          else if (field === "dietsTotal") updated.dietsTotal = val;

          // Re-calculate sum of excused categories
          updated.excused = updated.hc + updated.sickBay + updated.hospital + updated.duty + updated.leave + updated.otherExcused;
          
          // Re-adjust present counts
          if (updated.excused > updated.totalStrength) {
            updated.totalStrength = updated.excused;
            updated.present = 0;
          } else {
            updated.present = updated.totalStrength - updated.excused;
          }
        }

        return updated;
      })
    );
  };

  // Handles updating individual diet counts in the sub-form
  const handleFormDietChange = (companyName: string, dietName: string, value: number) => {
    setFormRows((prev) =>
      prev.map((row) => {
        if (row.company !== companyName) return row;

        const updated = { ...row };
        const updatedDiets = { ...updated.diets };
        updatedDiets[dietName] = Math.max(0, value);
        updated.diets = updatedDiets;

        // Auto-recalculate special diets total based on the sum of values (optional helper, but user can override)
        const total = Object.values(updatedDiets).reduce((sum, v) => sum + v, 0);
        // We set the dietsTotal if it's currently 0 or smaller than individual sums
        if (updated.dietsTotal < total) {
          updated.dietsTotal = total;
        }

        return updated;
      })
    );
  };

  // Submit customization values to Google Sheets
  const handleSubmitDisseminationForm = async (e: React.FormEvent) => {
    e.preventDefault();
    const appsScriptUrl = process.env.NEXT_PUBLIC_APPS_SCRIPT_URL;

    if (!appsScriptUrl) {
      alert("Apps Script URL is not set. Cannot submit custom values from website.");
      return;
    }

    setSubmitting(true);
    setError(null);
    setRecordSuccess(null);

    const payload = {
      action: "saveDissemination",
      date: formDate,
      meal: formMeal.toUpperCase(),
      rows: formRows
    };

    try {
      // Send as text/plain to bypass CORS preflight check
      const response = await fetch(appsScriptUrl, {
        method: "POST",
        headers: {
          "Content-Type": "text/plain"
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`Google Web App returned HTTP Status ${response.status}`);
      }

      const json = await response.json();
      if (json.success) {
        setRecordSuccess(`Custom dissemination report submitted successfully!`);
        setIsFormMode(false);
        
        // Refresh dashboard metrics
        setSelectedDate(formDate);
        setSelectedMeal(formMeal);
        await fetchData();

        setTimeout(() => setRecordSuccess(null), 5000);
      } else {
        throw new Error(json.error || "Failed to post dissemination report.");
      }
    } catch (err: any) {
      console.error("Custom posting failed:", err);
      setError(`Failed to post dissemination: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  // Filter records for the selected Date and Meal
  const activeRecords = records.filter(
    (r) => r.date === selectedDate && r.meal.toUpperCase() === selectedMeal.toUpperCase()
  );

  // Available unique dates and meals in logs for the filter dropdown
  const uniqueDates = Array.from(new Set(records.map((r) => r.date))).sort(
    (a, b) => new Date(b).getTime() - new Date(a).getTime()
  );
  
  const availableMeals = ["BREAKFAST", "LUNCH", "DINNER"];

  // Aggregate metrics for active selection
  const totalRoster = activeRecords.reduce((sum, r) => sum + r.totalStrength, 0);
  const totalPresent = activeRecords.reduce((sum, r) => sum + r.present, 0);
  const totalExcused = activeRecords.reduce((sum, r) => sum + r.excused, 0);
  const totalHC = activeRecords.reduce((sum, r) => sum + r.hc, 0);
  const totalSickBay = activeRecords.reduce((sum, r) => sum + r.sickBay, 0);
  const totalHospital = activeRecords.reduce((sum, r) => sum + r.hospital, 0);
  const totalDuty = activeRecords.reduce((sum, r) => sum + r.duty, 0);
  const totalLeave = activeRecords.reduce((sum, r) => sum + r.leave, 0);
  const totalOtherExcused = activeRecords.reduce((sum, r) => sum + r.otherExcused, 0);
  const totalDiets = activeRecords.reduce((sum, r) => sum + r.dietsTotal, 0);

  // Aggregate dietary restrictions counts
  const dietTotals: { [dietName: string]: number } = {};
  dietColumns.forEach((dCol) => {
    dietTotals[dCol] = activeRecords.reduce((sum, r) => sum + (r.diets[dCol] || 0), 0);
  });

  const presentPercentage = totalRoster > 0 ? Math.round((totalPresent / totalRoster) * 100) : 0;
  const excusedPercentage = totalRoster > 0 ? Math.round((totalExcused / totalRoster) * 100) : 0;
  const dietPercentage = totalRoster > 0 ? Math.round((totalDiets / totalRoster) * 100) : 0;

  // Retrieve matching cadets list from live database for details panel
  const getExcusedCadetsForCompany = (company: string) => {
    return cadets.filter(
      (c) => c.company === company && c.status !== "FULL DUTY" && c.status !== "" && c.status !== "FD"
    );
  };

  const getDietCadetsForCompany = (company: string) => {
    return cadets.filter((c) => {
      if (c.company !== company) return false;
      return Object.values(c.diets).some((hasDiet) => hasDiet === true);
    });
  };

  // Quick print handler
  const handlePrint = () => {
    window.print();
  };

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
      {/* CSS style block for printing official report */}
      <style>{`
        @media print {
          body {
            background-color: white !important;
            color: #000000 !important;
            font-family: "Courier New", Courier, monospace !important;
          }
          .no-print, aside, header, .header-actions, .filter-section, button, .tabs, .nav-menu {
            display: none !important;
          }
          .main-content {
            margin: 0 !important;
            padding: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            position: absolute;
            left: 0;
            top: 0;
          }
          .print-header {
            display: block !important;
            text-align: center;
            margin-bottom: 2rem;
            border-bottom: 2px double #000000;
            padding-bottom: 10px;
          }
          .print-header h1 {
            font-size: 1.6rem;
            margin: 0 0 5px 0;
            color: #000000 !important;
          }
          .print-header h2 {
            font-size: 1.1rem;
            margin: 0 0 5px 0;
            font-weight: normal;
          }
          .print-header p {
            margin: 2px 0;
            font-size: 0.9rem;
          }
          .print-title {
            text-align: center;
            font-size: 1.3rem;
            font-weight: bold;
            text-transform: uppercase;
            margin: 20px 0;
            letter-spacing: 1px;
          }
          .print-table {
            width: 100% !important;
            border-collapse: collapse !important;
            margin-bottom: 2rem !important;
          }
          .print-table th {
            background-color: #f3f4f6 !important;
            color: #000000 !important;
            border: 1px solid #000000 !important;
            padding: 8px !important;
            font-size: 0.85rem !important;
            font-weight: bold !important;
            text-align: center !important;
          }
          .print-table td {
            border: 1px solid #000000 !important;
            padding: 6px 8px !important;
            font-size: 0.85rem !important;
            color: #000000 !important;
          }
          .print-table tr:hover td {
            background-color: transparent !important;
          }
          .print-summary-grid {
            display: grid !important;
            grid-template-columns: 1fr 1fr !important;
            gap: 2rem !important;
            margin-top: 1.5rem !important;
            page-break-inside: avoid;
          }
          .print-section-title {
            font-size: 1rem;
            font-weight: bold;
            border-bottom: 1px solid #000;
            padding-bottom: 4px;
            margin-bottom: 10px;
            text-transform: uppercase;
          }
          .print-signature-row {
            display: flex !important;
            justify-content: space-between !important;
            margin-top: 4rem !important;
            page-break-inside: avoid;
          }
          .signature-box {
            text-align: center;
            width: 45%;
          }
          .signature-line {
            border-bottom: 1px solid #000;
            margin-bottom: 8px;
            height: 40px;
          }
          .card, .table-container {
            border: 1px solid #000 !important;
            box-shadow: none !important;
            background: white !important;
          }
        }
        .print-header {
          display: none;
        }
      `}</style>

      {/* Record Success message */}
      {recordSuccess && (
        <div className="alert-success no-print" style={{ marginBottom: "2rem" }}>
          <strong>Success:</strong> {recordSuccess}
        </div>
      )}

      {/* Connection Notice / Error alert */}
      {error && (
        <div className="alert-success no-print" style={{ backgroundColor: "#FEF2F2", border: "1px solid #FECACA", color: "#991B1B", marginBottom: "2rem" }}>
          <strong>Notice:</strong> {error}
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 1. INPUT FORM MODE */}
      {/* ------------------------------------------------------------- */}
      {isFormMode ? (
        <div className="no-print">
          <header className="page-header">
            <div className="page-title">
              <h2>Post Dissemination Report</h2>
              <p>Review, customize, and post the cadet counts for this meal. Numbers default to the live database.</p>
            </div>
            <div className="header-actions">
              <button 
                type="button" 
                className="btn btn-outline" 
                onClick={() => setIsFormMode(false)}
                disabled={submitting}
              >
                Back to Dashboard
              </button>
            </div>
          </header>

          <form onSubmit={handleSubmitDisseminationForm}>
            {/* Form selectors */}
            <div className="card" style={{ marginBottom: "2rem" }}>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "1.5rem" }}>
                <div className="form-group" style={{ margin: 0, minWidth: "200px" }}>
                  <label htmlFor="form-date-input">Report Date</label>
                  <input
                    id="form-date-input"
                    type="date"
                    className="input-field"
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group" style={{ margin: 0, minWidth: "150px" }}>
                  <label htmlFor="form-meal-input">Report Meal</label>
                  <select
                    id="form-meal-input"
                    className="input-field"
                    value={formMeal}
                    onChange={(e) => setFormMeal(e.target.value)}
                    required
                  >
                    <option value="BREAKFAST">Breakfast</option>
                    <option value="LUNCH">Lunch</option>
                    <option value="DINNER">Dinner</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Grid of Company editors */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(350px, 1fr))", gap: "2rem", marginBottom: "2rem" }}>
              {formRows.map((row) => (
                <div key={row.company} className="card" style={{ padding: "1.5rem" }}>
                  {/* Company Header */}
                  <div style={{ borderBottom: "2px solid var(--border-color)", paddingBottom: "0.5rem", marginBottom: "1rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <h3 style={{ fontSize: "1.2rem", color: "var(--primary)" }}>{row.company} COMPANY</h3>
                      <span style={{ fontSize: "0.75rem", color: "var(--muted)", fontWeight: "bold" }}>{row.battalion}</span>
                    </div>
                    <span className="badge" style={{ backgroundColor: "var(--primary-light)", color: "var(--primary)", fontWeight: "bold" }}>
                      Excused: {row.excused}
                    </span>
                  </div>

                  {/* Primary Counts */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px", marginBottom: "1.25rem" }}>
                    <div className="form-group">
                      <label style={{ fontSize: "0.75rem" }}>Total Strength</label>
                      <input
                        type="number"
                        className="input-field"
                        value={row.totalStrength}
                        onChange={(e) => handleFormNumberChange(row.company, "totalStrength", parseInt(e.target.value, 10) || 0)}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label style={{ fontSize: "0.75rem" }}>Present/Eating</label>
                      <input
                        type="number"
                        className="input-field"
                        value={row.present}
                        onChange={(e) => handleFormNumberChange(row.company, "present", parseInt(e.target.value, 10) || 0)}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label style={{ fontSize: "0.75rem" }}>Diets Total</label>
                      <input
                        type="number"
                        className="input-field"
                        value={row.dietsTotal}
                        onChange={(e) => handleFormNumberChange(row.company, "dietsTotal", parseInt(e.target.value, 10) || 0)}
                        required
                      />
                    </div>
                  </div>

                  {/* Excused Breakdown */}
                  <div style={{ backgroundColor: "var(--background)", padding: "1rem", borderRadius: "8px", marginBottom: "1rem" }}>
                    <span style={{ display: "block", fontSize: "0.75rem", fontWeight: "bold", textTransform: "uppercase", color: "var(--secondary-light)", marginBottom: "8px", borderBottom: "1px solid var(--border-color)", paddingBottom: "4px" }}>
                      Excused Breakdown (Sum: {row.excused})
                    </span>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px" }}>
                      <div className="form-group" style={{ margin: 0 }}>
                        <label style={{ fontSize: "0.7rem", fontWeight: "normal" }}>HC (Clinic)</label>
                        <input
                          type="number"
                          className="input-field"
                          style={{ padding: "6px" }}
                          value={row.hc}
                          onChange={(e) => handleFormNumberChange(row.company, "hc", parseInt(e.target.value, 10) || 0)}
                        />
                      </div>
                      <div className="form-group" style={{ margin: 0 }}>
                        <label style={{ fontSize: "0.7rem", fontWeight: "normal" }}>Sick Bay</label>
                        <input
                          type="number"
                          className="input-field"
                          style={{ padding: "6px" }}
                          value={row.sickBay}
                          onChange={(e) => handleFormNumberChange(row.company, "sickBay", parseInt(e.target.value, 10) || 0)}
                        />
                      </div>
                      <div className="form-group" style={{ margin: 0 }}>
                        <label style={{ fontSize: "0.7rem", fontWeight: "normal" }}>Hospital</label>
                        <input
                          type="number"
                          className="input-field"
                          style={{ padding: "6px" }}
                          value={row.hospital}
                          onChange={(e) => handleFormNumberChange(row.company, "hospital", parseInt(e.target.value, 10) || 0)}
                        />
                      </div>
                      <div className="form-group" style={{ margin: 0 }}>
                        <label style={{ fontSize: "0.7rem", fontWeight: "normal" }}>Duty</label>
                        <input
                          type="number"
                          className="input-field"
                          style={{ padding: "6px" }}
                          value={row.duty}
                          onChange={(e) => handleFormNumberChange(row.company, "duty", parseInt(e.target.value, 10) || 0)}
                        />
                      </div>
                      <div className="form-group" style={{ margin: 0 }}>
                        <label style={{ fontSize: "0.7rem", fontWeight: "normal" }}>Leave/Pass</label>
                        <input
                          type="number"
                          className="input-field"
                          style={{ padding: "6px" }}
                          value={row.leave}
                          onChange={(e) => handleFormNumberChange(row.company, "leave", parseInt(e.target.value, 10) || 0)}
                        />
                      </div>
                      <div className="form-group" style={{ margin: 0 }}>
                        <label style={{ fontSize: "0.7rem", fontWeight: "normal" }}>Other</label>
                        <input
                          type="number"
                          className="input-field"
                          style={{ padding: "6px" }}
                          value={row.otherExcused}
                          onChange={(e) => handleFormNumberChange(row.company, "otherExcused", parseInt(e.target.value, 10) || 0)}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Dietary Detail Expandable Box */}
                  <div>
                    <button
                      type="button"
                      className="btn btn-outline"
                      style={{ width: "100%", padding: "6px", fontSize: "0.8rem", margin: 0 }}
                      onClick={() => {
                        setFormRows((prev) =>
                          prev.map((r) => r.company === row.company ? { ...r, showDietEdit: !r.showDietEdit } : r)
                        );
                      }}
                    >
                      {row.showDietEdit ? "▲ Hide Dietary Restrictions details" : "▼ Show Dietary Restrictions details"}
                    </button>

                    {row.showDietEdit && (
                      <div style={{ padding: "10px", border: "1px solid var(--border-color)", borderTop: "none", borderRadius: "0 0 8px 8px", backgroundColor: "#FAF5F6" }}>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", maxHeight: "150px", overflowY: "auto" }}>
                          {dietColumns.map((dCol) => (
                            <div key={dCol} className="form-group" style={{ margin: 0, display: "flex", alignItems: "center", justifyContent: "space-between", gap: "5px" }}>
                              <label style={{ fontSize: "0.7rem", fontWeight: "bold", margin: 0 }}>{dCol}</label>
                              <input
                                type="number"
                                className="input-field"
                                style={{ width: "50px", padding: "3px 6px", fontSize: "0.8rem", margin: 0, textAlign: "right" }}
                                value={row.diets[dCol] || 0}
                                onChange={(e) => handleFormDietChange(row.company, dCol, parseInt(e.target.value, 10) || 0)}
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Submission Action bar */}
            <div className="card" style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
              <button 
                type="button" 
                className="btn btn-outline" 
                style={{ width: "auto" }} 
                onClick={() => setIsFormMode(false)}
                disabled={submitting}
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="btn" 
                style={{ width: "auto" }}
                disabled={submitting}
              >
                {submitting ? "Submitting Custom Report..." : "Submit Dissemination Report"}
              </button>
            </div>
          </form>
        </div>
      ) : (
        /* ------------------------------------------------------------- */
        /* 2. DASHBOARD VIEW MODE */
        /* ------------------------------------------------------------- */
        <>
          {/* Page Header */}
          <header className="page-header no-print">
            <div className="page-title">
              <h2>Mess Dissemination Reports</h2>
              <p>
                Generated summaries of cadet messing strength, excused lists, and special diets.
                Connection:{" "}
                <span style={{ fontWeight: 700, color: error ? "var(--primary)" : "var(--success)" }}>
                  {error ? "Offline" : "Connected to Google Sheet"}
                </span>
              </p>
            </div>
            <div className="header-actions" style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
              {isAuthorized && process.env.NEXT_PUBLIC_APPS_SCRIPT_URL && (
                <>
                  <button 
                    className="btn" 
                    onClick={handleOpenPostingForm} 
                    disabled={loading || recording}
                  >
                    Post Dissemination Report
                  </button>
                  <button 
                    className="btn btn-outline" 
                    onClick={handleRecordSnapshot} 
                    disabled={recording || loading}
                    style={{ borderColor: "var(--accent)", color: "var(--accent)" }}
                  >
                    {recording ? "Recording Snapshot..." : "Record Current Snapshot"}
                  </button>
                </>
              )}
              <button className="btn btn-outline" onClick={handlePrint} disabled={loading}>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  style={{ width: "16px", height: "16px", marginRight: "6px" }}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2.2}
                    d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
                  />
                </svg>
                Print Report
              </button>
              <button className="btn btn-outline" onClick={fetchData} disabled={loading || recording}>
                {loading ? "Syncing..." : "Sync Reports"}
              </button>
            </div>
          </header>

          {/* OFFICIAL MILITARY REPORT HEADER FOR PRINTING */}
          <div className="print-header">
            <h1>CADET CORPS ARMED FORCES OF THE PHILIPPINES</h1>
            <h2>REGIMENTAL MESS HALL</h2>
            <p>Fort General Gregorio H. Del Pilar, Baguio City</p>
            <p style={{ marginTop: "8px", fontWeight: "bold" }}>MESS HALL DISSEMINATION SHEET</p>
            <p>Report Period: {selectedDate} | Meal: {selectedMeal}</p>
          </div>

          {/* Control Filters Section */}
          <div className="card no-print" style={{ marginBottom: "2rem" }}>
            <div className="card-title">Filter Recorded Meals</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "1.5rem", alignItems: "flex-end" }}>
              
              <div className="form-group" style={{ margin: 0, minWidth: "180px" }}>
                <label htmlFor="date-select">Select Date</label>
                <select
                  id="date-select"
                  className="input-field"
                  value={selectedDate}
                  onChange={(e) => {
                    setSelectedDate(e.target.value);
                    setActiveCompanyDetail(null);
                  }}
                >
                  {uniqueDates.length > 0 ? (
                    uniqueDates.map((date) => (
                      <option key={date} value={date}>
                        {new Date(date).toLocaleDateString("en-US", {
                          weekday: "short",
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </option>
                    ))
                  ) : (
                    <option value={selectedDate}>{selectedDate}</option>
                  )}
                </select>
              </div>

              <div className="form-group" style={{ margin: 0, minWidth: "150px" }}>
                <label htmlFor="meal-select">Select Meal</label>
                <select
                  id="meal-select"
                  className="input-field"
                  value={selectedMeal}
                  onChange={(e) => {
                    setSelectedMeal(e.target.value);
                    setActiveCompanyDetail(null);
                  }}
                >
                  {availableMeals.map((meal) => (
                    <option key={meal} value={meal}>
                      {meal}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ flexGrow: 1, display: "flex", justifyContent: "flex-end", alignSelf: "center" }}>
                <span style={{ fontSize: "0.85rem", color: "var(--muted)" }}>
                  {activeRecords.length > 0 ? (
                    <span>Recorded: <strong>{activeRecords[0].timestamp || "N/A"}</strong></span>
                  ) : (
                    <span style={{ color: "var(--primary)" }}>⚠️ No snapshot recorded for this date & meal.</span>
                  )}
                </span>
              </div>
            </div>
          </div>

          {activeRecords.length === 0 ? (
            <div className="card" style={{ textAlign: "center", padding: "3rem 1.5rem" }}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                style={{ width: "64px", height: "64px", color: "var(--muted)", margin: "0 auto 1.5rem" }}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              <h3 style={{ fontSize: "1.3rem", marginBottom: "8px" }}>No Dissemination Record Found</h3>
              <p style={{ color: "var(--secondary-light)", maxWidth: "500px", margin: "0 auto 1.5rem" }}>
                There is no recorded dissemination snapshot in Google Sheets for <strong>{selectedDate}</strong> ({selectedMeal}).
              </p>
              {isAuthorized && (
                <div style={{ display: "flex", gap: "12px", justifyContent: "center" }} className="no-print">
                  {process.env.NEXT_PUBLIC_APPS_SCRIPT_URL ? (
                    <button className="btn" onClick={handleOpenPostingForm}>
                      Post Custom Report
                    </button>
                  ) : (
                    <a 
                      href="https://docs.google.com/spreadsheets/d/14dSYE1ntxNrnBdgSn-mWU5z-GMHK7qdMcKFchgh0pAQ/edit#gid=1204067800" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="btn"
                    >
                      Open Google Sheet to Record
                    </a>
                  )}
                </div>
              )}
            </div>
          ) : (
            <>
              {/* Summary Metrics Cards */}
              <div className="stats-grid" style={{ marginBottom: "2rem" }}>
                <div className="stat-card">
                  <h3>Total Strength</h3>
                  <div className="value">{totalRoster}</div>
                  <div className="subtext">Ration strength</div>
                </div>
                
                <div className="stat-card">
                  <h3>Present / Eating</h3>
                  <div className="value" style={{ color: "var(--success)" }}>
                    {totalPresent}
                  </div>
                  <div className="subtext">
                    {presentPercentage}% of total
                  </div>
                  <div className="progress-bar-container" style={{ width: "100%", height: "6px", backgroundColor: "#E5E7EB", borderRadius: "3px", marginTop: "8px", overflow: "hidden" }}>
                    <div style={{ width: `${presentPercentage}%`, height: "100%", backgroundColor: "var(--success)" }} />
                  </div>
                </div>

                <div className="stat-card">
                  <h3>Excused / Absent</h3>
                  <div className="value" style={{ color: "var(--primary)" }}>
                    {totalExcused}
                  </div>
                  <div className="subtext">
                    {excusedPercentage}% of total
                  </div>
                  <div className="progress-bar-container" style={{ width: "100%", height: "6px", backgroundColor: "#E5E7EB", borderRadius: "3px", marginTop: "8px", overflow: "hidden" }}>
                    <div style={{ width: `${excusedPercentage}%`, height: "100%", backgroundColor: "var(--primary)" }} />
                  </div>
                </div>

                <div className="stat-card">
                  <h3>Special Diets</h3>
                  <div className="value" style={{ color: "var(--accent)" }}>
                    {totalDiets}
                  </div>
                  <div className="subtext">
                    {dietPercentage}% of total
                  </div>
                  <div className="progress-bar-container" style={{ width: "100%", height: "6px", backgroundColor: "#E5E7EB", borderRadius: "3px", marginTop: "8px", overflow: "hidden" }}>
                    <div style={{ width: `${dietPercentage}%`, height: "100%", backgroundColor: "var(--accent)" }} />
                  </div>
                </div>
              </div>

              {/* Grid Layout for Main Breakdown Table and Secondary Panels */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "2rem", marginBottom: "2rem" }}>
                
                {/* Main Company Breakdown Card */}
                <div className="card">
                  <div className="card-title">Company Dissemination Breakdown</div>
                  <p className="no-print" style={{ fontSize: "0.85rem", color: "var(--muted)", marginBottom: "1rem" }}>
                    💡 Click on any company row to view the list of excused cadet names and their special diet details.
                  </p>
                  
                  <div className="table-container">
                    <table className="print-table">
                      <thead>
                        <tr>
                          <th>Company</th>
                          <th>Battalion</th>
                          <th style={{ textAlign: "right" }}>Total</th>
                          <th style={{ textAlign: "right" }}>Present</th>
                          <th style={{ textAlign: "right" }}>Excused</th>
                          <th style={{ textAlign: "center" }}>HC</th>
                          <th style={{ textAlign: "center" }}>SB</th>
                          <th style={{ textAlign: "center" }}>Hosp</th>
                          <th style={{ textAlign: "center" }}>Duty</th>
                          <th style={{ textAlign: "center" }}>Leave</th>
                          <th style={{ textAlign: "right" }}>Diets</th>
                        </tr>
                      </thead>
                      <tbody>
                        {activeRecords.map((r) => (
                          <tr 
                            key={r.company} 
                            onClick={() => setActiveCompanyDetail(r.company === activeCompanyDetail ? null : r.company)}
                            style={{ cursor: "pointer", backgroundColor: activeCompanyDetail === r.company ? "#FFF5F6" : "transparent" }}
                          >
                            <td style={{ fontWeight: "700" }}>{r.company}</td>
                            <td>{r.battalion}</td>
                            <td style={{ textAlign: "right", fontWeight: "600" }}>{r.totalStrength}</td>
                            <td style={{ textAlign: "right", color: "var(--success)", fontWeight: "600" }}>{r.present}</td>
                            <td style={{ textAlign: "right", color: "var(--primary)", fontWeight: "600" }}>{r.excused}</td>
                            <td style={{ textAlign: "center" }}>{r.hc > 0 ? <span className="badge" style={{ backgroundColor: "#FEF3C7", color: "#D97706", padding: "2px 6px" }}>{r.hc}</span> : "-"}</td>
                            <td style={{ textAlign: "center" }}>{r.sickBay > 0 ? <span className="badge" style={{ backgroundColor: "#E0F2FE", color: "#0284C7", padding: "2px 6px" }}>{r.sickBay}</span> : "-"}</td>
                            <td style={{ textAlign: "center" }}>{r.hospital > 0 ? <span className="badge" style={{ backgroundColor: "#FEE2E2", color: "#EF4444", padding: "2px 6px" }}>{r.hospital}</span> : "-"}</td>
                            <td style={{ textAlign: "center" }}>{r.duty > 0 ? <span className="badge" style={{ backgroundColor: "#F3F4F6", color: "#374151", padding: "2px 6px" }}>{r.duty}</span> : "-"}</td>
                            <td style={{ textAlign: "center" }}>{r.leave > 0 ? <span className="badge" style={{ backgroundColor: "#ECFDF5", color: "#059669", padding: "2px 6px" }}>{r.leave}</span> : "-"}</td>
                            <td style={{ textAlign: "right", color: "var(--accent)", fontWeight: "600" }}>{r.dietsTotal}</td>
                          </tr>
                        ))}
                        {/* Summation Row */}
                        <tr style={{ backgroundColor: "#FFF1F2", fontWeight: "bold" }}>
                          <td>TOTAL CORPS</td>
                          <td>-</td>
                          <td style={{ textAlign: "right" }}>{totalRoster}</td>
                          <td style={{ textAlign: "right", color: "var(--success)" }}>{totalPresent}</td>
                          <td style={{ textAlign: "right", color: "var(--primary)" }}>{totalExcused}</td>
                          <td style={{ textAlign: "center" }}>{totalHC > 0 ? totalHC : "-"}</td>
                          <td style={{ textAlign: "center" }}>{totalSickBay > 0 ? totalSickBay : "-"}</td>
                          <td style={{ textAlign: "center" }}>{totalHospital > 0 ? totalHospital : "-"}</td>
                          <td style={{ textAlign: "center" }}>{totalDuty > 0 ? totalDuty : "-"}</td>
                          <td style={{ textAlign: "center" }}>{totalLeave > 0 ? totalLeave : "-"}</td>
                          <td style={{ textAlign: "right", color: "var(--accent)" }}>{totalDiets}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Sub-Layout: Two columns for details (Special Diets and Cadet Roster details) */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "2rem" }}>
                  
                  {/* Special Diets Summary Panel */}
                  <div className="card">
                    <div className="card-title">Special Diets Kitchen Summary</div>
                    <div style={{ marginBottom: "1rem" }} className="no-print">
                      <button 
                        className="btn btn-outline" 
                        style={{ padding: "6px 12px", fontSize: "0.8rem" }}
                        onClick={() => setShowAllDiets(!showAllDiets)}
                      >
                        {showAllDiets ? "Hide Zero Counts" : "Show All Diet Columns"}
                      </button>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                      {dietColumns
                        .filter((diet) => showAllDiets || (dietTotals[diet] || 0) > 0)
                        .map((diet) => (
                          <div 
                            key={diet} 
                            style={{ 
                              display: "flex", 
                              justifyContent: "space-between", 
                              padding: "10px 14px", 
                              backgroundColor: (dietTotals[diet] || 0) > 0 ? "var(--primary-light)" : "var(--background)", 
                              borderRadius: "8px",
                              borderLeft: `4px solid ${(dietTotals[diet] || 0) > 0 ? "var(--primary)" : "var(--border-color)"}` 
                            }}
                          >
                            <span style={{ fontSize: "0.85rem", fontWeight: "700" }}>{diet}</span>
                            <span style={{ fontSize: "0.95rem", fontWeight: "800", color: (dietTotals[diet] || 0) > 0 ? "var(--primary)" : "var(--secondary-light)" }}>
                              {dietTotals[diet] || 0}
                            </span>
                          </div>
                        ))}
                    </div>
                  </div>

                  {/* Company Details Side Drawer / Modal (if company is selected) */}
                  <div className="card">
                    <div className="card-title">
                      {activeCompanyDetail ? `${activeCompanyDetail} Company Details` : "Company Roster Inspector"}
                    </div>
                    
                    {!activeCompanyDetail ? (
                      <div style={{ textAlign: "center", color: "var(--muted)", padding: "2rem 0" }}>
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          style={{ width: "40px", height: "40px", margin: "0 auto 10px" }}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.5}
                            d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122"
                          />
                        </svg>
                        <p style={{ fontSize: "0.9rem" }}>Select a company in the table above to inspect active cadets.</p>
                      </div>
                    ) : (
                      <div>
                        {/* Excused Cadet List */}
                        <div style={{ marginBottom: "1.5rem" }}>
                          <h4 style={{ fontSize: "0.95rem", textTransform: "uppercase", color: "var(--primary)", borderBottom: "1px solid var(--border-color)", paddingBottom: "4px", marginBottom: "8px" }}>
                            Excused Cadets ({getExcusedCadetsForCompany(activeCompanyDetail).length})
                          </h4>
                          {getExcusedCadetsForCompany(activeCompanyDetail).length === 0 ? (
                            <p style={{ fontSize: "0.85rem", color: "var(--muted)", fontStyle: "italic" }}>No cadets currently excused in database.</p>
                          ) : (
                            <div style={{ display: "flex", flexDirection: "column", gap: "6px", maxHeight: "150px", overflowY: "auto" }}>
                              {getExcusedCadetsForCompany(activeCompanyDetail).map((c) => (
                                <div 
                                  key={c.name} 
                                  style={{ 
                                    display: "flex", 
                                    justifyContent: "space-between", 
                                    fontSize: "0.85rem", 
                                    padding: "6px 10px", 
                                    backgroundColor: "var(--background)", 
                                    borderRadius: "6px" 
                                  }}
                                >
                                  <span>CDT {c.class} {c.name}</span>
                                  <span className="badge" style={{ backgroundColor: "#FEE2E2", color: "#EF4444", fontWeight: "bold" }}>{c.status}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Special Diet Cadet List */}
                        <div>
                          <h4 style={{ fontSize: "0.95rem", textTransform: "uppercase", color: "var(--accent)", borderBottom: "1px solid var(--border-color)", paddingBottom: "4px", marginBottom: "8px" }}>
                            Special Diets ({getDietCadetsForCompany(activeCompanyDetail).length})
                          </h4>
                          {getDietCadetsForCompany(activeCompanyDetail).length === 0 ? (
                            <p style={{ fontSize: "0.85rem", color: "var(--muted)", fontStyle: "italic" }}>No cadets with special diets in database.</p>
                          ) : (
                            <div style={{ display: "flex", flexDirection: "column", gap: "6px", maxHeight: "150px", overflowY: "auto" }}>
                              {getDietCadetsForCompany(activeCompanyDetail).map((c) => {
                                // Extract true diets
                                const activeDiets = Object.keys(c.diets).filter((dName) => c.diets[dName] === true);
                                return (
                                  <div 
                                    key={c.name} 
                                    style={{ 
                                      fontSize: "0.85rem", 
                                      padding: "6px 10px", 
                                      backgroundColor: "var(--background)", 
                                      borderRadius: "6px",
                                      display: "flex",
                                      flexDirection: "column",
                                      gap: "4px"
                                    }}
                                  >
                                    <div style={{ display: "flex", justifyContent: "space-between", fontWeight: "600" }}>
                                      <span>CDT {c.class} {c.name}</span>
                                      <span style={{ fontSize: "0.75rem", color: "var(--muted)" }}>{c.class}</span>
                                    </div>
                                    <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
                                      {activeDiets.map((d) => (
                                        <span key={d} className="badge" style={{ backgroundColor: "var(--accent-light)", color: "var(--accent)", fontSize: "0.7rem", padding: "1px 4px", borderRadius: "4px" }}>
                                          {d}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Signature and Note Blocks for Printing */}
              <div className="print-signature-row" style={{ display: "none" }}>
                <div className="signature-box">
                  <div className="signature-line"></div>
                  <p style={{ fontSize: "0.85rem", margin: 0, fontWeight: "bold" }}>Prepared by:</p>
                  <p style={{ fontSize: "0.85rem", margin: 0 }}>Regimental Mess Officer / Representative</p>
                  <p style={{ fontSize: "0.75rem", margin: 0, color: "#666" }}>CCAFP Cadet Mess Council</p>
                </div>
                <div className="signature-box">
                  <div className="signature-line"></div>
                  <p style={{ fontSize: "0.85rem", margin: 0, fontWeight: "bold" }}>Noted by:</p>
                  <p style={{ fontSize: "0.85rem", margin: 0 }}>Mess Steward / Kitchen Supervisor</p>
                  <p style={{ fontSize: "0.75rem", margin: 0, color: "#666" }}>CCAFP Mess Hall Staff</p>
                </div>
              </div>

              {/* Historical Log Section */}
              <div className="card no-print">
                <div className="card-title">Recorded Meal Disseminations Log</div>
                <p style={{ fontSize: "0.85rem", color: "var(--muted)", marginBottom: "1rem" }}>
                  The log below shows historical records stored in your spreadsheet. Select a record to display.
                </p>
                
                <div className="table-container">
                  <table>
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Meal</th>
                        <th style={{ textAlign: "right" }}>Companies</th>
                        <th style={{ textAlign: "right" }}>Total Strength</th>
                        <th style={{ textAlign: "right" }}>Present</th>
                        <th style={{ textAlign: "right" }}>Excused</th>
                        <th style={{ textAlign: "right" }}>Special Diets</th>
                        <th style={{ textAlign: "center" }}>Recorded At</th>
                        <th style={{ textAlign: "center" }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {/* Group records by Date & Meal */}
                      {Array.from(new Set(records.map(r => `${r.date}#${r.meal}`))).map(groupKey => {
                        const [dateStr, mealStr] = groupKey.split("#");
                        const matching = records.filter(r => r.date === dateStr && r.meal === mealStr);
                        const strength = matching.reduce((sum, r) => sum + r.totalStrength, 0);
                        const present = matching.reduce((sum, r) => sum + r.present, 0);
                        const excused = matching.reduce((sum, r) => sum + r.excused, 0);
                        const diets = matching.reduce((sum, r) => sum + r.dietsTotal, 0);
                        const timestamp = matching[0].timestamp || "N/A";

                        return (
                          <tr key={groupKey}>
                            <td style={{ fontWeight: "700" }}>{dateStr}</td>
                            <td>
                              <span className="badge" style={{ 
                                backgroundColor: mealStr === "BREAKFAST" ? "#FEF3C7" : mealStr === "LUNCH" ? "#E0F2FE" : "#F3F4F6",
                                color: mealStr === "BREAKFAST" ? "#D97706" : mealStr === "LUNCH" ? "#0284C7" : "#374151"
                              }}>
                                {mealStr}
                              </span>
                            </td>
                            <td style={{ textAlign: "right" }}>{matching.length}</td>
                            <td style={{ textAlign: "right" }}>{strength}</td>
                            <td style={{ textAlign: "right", color: "var(--success)" }}>{present}</td>
                            <td style={{ textAlign: "right", color: "var(--primary)" }}>{excused}</td>
                            <td style={{ textAlign: "right", color: "var(--accent)" }}>{diets}</td>
                            <td style={{ textAlign: "center", fontSize: "0.8rem" }}>{timestamp}</td>
                            <td style={{ textAlign: "center" }}>
                              <button 
                                className="btn btn-outline" 
                                style={{ padding: "4px 8px", fontSize: "0.8rem", margin: 0 }}
                                onClick={() => {
                                  setSelectedDate(dateStr);
                                  setSelectedMeal(mealStr);
                                  setActiveCompanyDetail(null);
                                  window.scrollTo({ top: 0, behavior: 'smooth' });
                                }}
                              >
                                Load Report
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
