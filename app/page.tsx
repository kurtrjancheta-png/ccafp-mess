"use client";

import React, { useState, useEffect } from "react";

// interface for a Cadet
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
  diets: { [dietName: string]: boolean }; // Map of diet column names to boolean (if cell was "1")
}

// Fallback Mock Data mirroring the real DATABASE sheet columns & values
const MOCK_CADETS: Cadet[] = [
  { no: "1", class: "1CL", name: "ADTOON", serialNo: "C-27002", gender: "M", company: "ALFA", battalion: "1ST BATTALION", bos: "PN", status: "FULL DUTY", diets: { "NO FISH": false, "NO PORK": true, "NO SEAFOOD": false, "NO EGG": false, "NO CHICKEN": false, "NO BLOOD": false, "NO FOOD PROCESSED FOOD": false, "NO BEANS": false, "NO NUTS": false, "NO TOFU": false, "NO COFFEE": false, "NO CHOCOLATE": false, "NO TOMATOES": false, "NO SPICY": false, "NO BEEF": false } },
  { no: "2", class: "1CL", name: "AMANGAN", serialNo: "C-25020", gender: "M", company: "ALFA", battalion: "1ST BATTALION", bos: "PAF", status: "FULL DUTY", diets: { "NO FISH": false, "NO PORK": false, "NO SEAFOOD": false, "NO EGG": false, "NO CHICKEN": false, "NO BLOOD": false, "NO FOOD PROCESSED FOOD": false, "NO BEANS": false, "NO NUTS": false, "NO TOFU": false, "NO COFFEE": false, "NO CHOCOLATE": false, "NO TOMATOES": false, "NO SPICY": false, "NO BEEF": false } },
  { no: "3", class: "1CL", name: "ATIWEN", serialNo: "C-26027", gender: "F", company: "ALFA", battalion: "1ST BATTALION", bos: "PA", status: "FULL DUTY", diets: { "NO FISH": false, "NO PORK": false, "NO SEAFOOD": false, "NO EGG": false, "NO CHICKEN": false, "NO BLOOD": false, "NO FOOD PROCESSED FOOD": false, "NO BEANS": false, "NO NUTS": false, "NO TOFU": false, "NO COFFEE": false, "NO CHOCOLATE": false, "NO TOMATOES": false, "NO SPICY": false, "NO BEEF": true } },
  { no: "4", class: "1CL", name: "DE MESA", serialNo: "C-27075", gender: "F", company: "ALFA", battalion: "1ST BATTALION", bos: "PN", status: "FULL DUTY", diets: { "NO FISH": false, "NO PORK": true, "NO SEAFOOD": true, "NO EGG": false, "NO CHICKEN": false, "NO BLOOD": false, "NO FOOD PROCESSED FOOD": false, "NO BEANS": false, "NO NUTS": false, "NO TOFU": false, "NO COFFEE": false, "NO CHOCOLATE": false, "NO TOMATOES": false, "NO SPICY": false, "NO BEEF": false } },
  { no: "5", class: "1CL", name: "FELIPE", serialNo: "C-26151", gender: "F", company: "ALFA", battalion: "1ST BATTALION", bos: "PA", status: "FULL DUTY", diets: { "NO FISH": false, "NO PORK": false, "NO SEAFOOD": false, "NO EGG": true, "NO CHICKEN": false, "NO BLOOD": false, "NO FOOD PROCESSED FOOD": false, "NO BEANS": false, "NO NUTS": false, "NO TOFU": false, "NO COFFEE": false, "NO CHOCOLATE": false, "NO TOMATOES": false, "NO SPICY": false, "NO BEEF": false } },
  { no: "6", class: "2CL", name: "ABBAS", serialNo: "C-28001", gender: "M", company: "BRAVO", battalion: "1ST BATTALION", bos: "PAF", status: "FULL DUTY", diets: { "NO FISH": false, "NO PORK": true, "NO SEAFOOD": false, "NO EGG": false, "NO CHICKEN": false, "NO BLOOD": false, "NO FOOD PROCESSED FOOD": false, "NO BEANS": false, "NO NUTS": false, "NO TOFU": false, "NO COFFEE": false, "NO CHOCOLATE": false, "NO TOMATOES": false, "NO SPICY": false, "NO BEEF": false } },
  { no: "7", class: "2CL", name: "ALIVEN", serialNo: "C-28018", gender: "M", company: "BRAVO", battalion: "1ST BATTALION", bos: "PN", status: "FULL DUTY", diets: { "NO FISH": false, "NO PORK": false, "NO SEAFOOD": false, "NO EGG": false, "NO CHICKEN": false, "NO BLOOD": false, "NO FOOD PROCESSED FOOD": false, "NO BEANS": false, "NO NUTS": false, "NO TOFU": false, "NO COFFEE": false, "NO CHOCOLATE": false, "NO TOMATOES": false, "NO SPICY": false, "NO BEEF": false } },
  { no: "8", class: "3CL", name: "ACOP", serialNo: "C-28353", gender: "M", company: "CHARLIE", battalion: "2ND BATTALION", bos: "N/A", status: "FULL DUTY", diets: { "NO FISH": true, "NO PORK": false, "NO SEAFOOD": true, "NO EGG": false, "NO CHICKEN": false, "NO BLOOD": false, "NO FOOD PROCESSED FOOD": false, "NO BEANS": false, "NO NUTS": false, "NO TOFU": false, "NO COFFEE": false, "NO CHOCOLATE": false, "NO TOMATOES": false, "NO SPICY": false, "NO BEEF": false } },
  { no: "9", class: "3CL", name: "ARIG", serialNo: "C-29024", gender: "M", company: "DELTA", battalion: "2ND BATTALION", bos: "N/A", status: "HC", diets: { "NO FISH": false, "NO PORK": false, "NO SEAFOOD": false, "NO EGG": false, "NO CHICKEN": false, "NO BLOOD": false, "NO FOOD PROCESSED FOOD": false, "NO BEANS": false, "NO NUTS": false, "NO TOFU": false, "NO COFFEE": false, "NO CHOCOLATE": false, "NO TOMATOES": false, "NO SPICY": false, "NO BEEF": false } },
  { no: "10", class: "4CL", name: "ANGOLUAN", serialNo: "C-30005", gender: "F", company: "ECHO", battalion: "3RD BATTALION", bos: "PA", status: "FULL DUTY", diets: { "NO FISH": false, "NO PORK": false, "NO SEAFOOD": false, "NO EGG": false, "NO CHICKEN": false, "NO BLOOD": false, "NO FOOD PROCESSED FOOD": false, "NO BEANS": false, "NO NUTS": false, "NO TOFU": false, "NO COFFEE": false, "NO CHOCOLATE": false, "NO TOMATOES": false, "NO SPICY": false, "NO BEEF": false } },
  { no: "11", class: "4CL", name: "AGNES", serialNo: "C-30012", gender: "M", company: "FOXTROT", battalion: "3RD BATTALION", bos: "PAF", status: "FULL DUTY", diets: { "NO FISH": false, "NO PORK": true, "NO SEAFOOD": false, "NO EGG": false, "NO CHICKEN": false, "NO BLOOD": false, "NO FOOD PROCESSED FOOD": false, "NO BEANS": false, "NO NUTS": false, "NO TOFU": false, "NO COFFEE": false, "NO CHOCOLATE": false, "NO TOMATOES": false, "NO SPICY": false, "NO BEEF": false } },
  { no: "12", class: "1CL", name: "GRATIL", serialNo: "C-25154", gender: "M", company: "GOLF", battalion: "4TH BATTALION", bos: "PAF", status: "FULL DUTY", diets: { "NO FISH": false, "NO PORK": false, "NO SEAFOOD": false, "NO EGG": false, "NO CHICKEN": false, "NO BLOOD": false, "NO FOOD PROCESSED FOOD": false, "NO BEANS": false, "NO NUTS": false, "NO TOFU": false, "NO COFFEE": false, "NO CHOCOLATE": false, "NO TOMATOES": false, "NO SPICY": false, "NO BEEF": false } },
  { no: "13", class: "2CL", name: "AMBUCAY", serialNo: "C-27279", gender: "M", company: "HAWK", battalion: "4TH BATTALION", bos: "PAF", status: "HC", diets: { "NO FISH": false, "NO PORK": false, "NO SEAFOOD": false, "NO EGG": false, "NO CHICKEN": false, "NO BLOOD": false, "NO FOOD PROCESSED FOOD": false, "NO BEANS": false, "NO NUTS": false, "NO TOFU": false, "NO COFFEE": false, "NO CHOCOLATE": false, "NO TOMATOES": false, "NO SPICY": false, "NO BEEF": true } },
  { no: "14", class: "3CL", name: "BAEL", serialNo: "C-29034", gender: "M", company: "ECHO", battalion: "3RD BATTALION", bos: "N/A", status: "FULL DUTY", diets: { "NO FISH": false, "NO PORK": true, "NO SEAFOOD": false, "NO EGG": false, "NO CHICKEN": false, "NO BLOOD": false, "NO FOOD PROCESSED FOOD": false, "NO BEANS": false, "NO NUTS": false, "NO TOFU": false, "NO COFFEE": false, "NO CHOCOLATE": false, "NO TOMATOES": false, "NO SPICY": false, "NO BEEF": false } },
  { no: "15", class: "4CL", name: "BALILI", serialNo: "C-30045", gender: "F", company: "FOXTROT", battalion: "3RD BATTALION", bos: "PN", status: "FULL DUTY", diets: { "NO FISH": false, "NO PORK": false, "NO SEAFOOD": false, "NO EGG": false, "NO CHICKEN": false, "NO BLOOD": false, "NO FOOD PROCESSED FOOD": false, "NO BEANS": false, "NO NUTS": false, "NO TOFU": false, "NO COFFEE": false, "NO CHOCOLATE": false, "NO TOMATOES": false, "NO SPICY": false, "NO BEEF": false } },
  { no: "16", class: "1CL", name: "TORRES", serialNo: "C-26332", gender: "M", company: "GOLF", battalion: "4TH BATTALION", bos: "PA", status: "FULL DUTY", diets: { "NO FISH": false, "NO PORK": true, "NO SEAFOOD": false, "NO EGG": false, "NO CHICKEN": false, "NO BLOOD": false, "NO FOOD PROCESSED FOOD": false, "NO BEANS": false, "NO NUTS": false, "NO TOFU": false, "NO COFFEE": false, "NO CHOCOLATE": false, "NO TOMATOES": false, "NO SPICY": false, "NO BEEF": true } }
];

export default function DashboardPage() {
  const [cadets, setCadets] = useState<Cadet[]>(MOCK_CADETS);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dataSource, setDataSource] = useState<"MOCK" | "LIVE">("MOCK");
  
  // Default dietary column names from your database sheet
  const [dietColumns, setDietColumns] = useState<string[]>([
    "NO FISH", "NO PORK", "NO SEAFOOD", "NO EGG", "NO CHICKEN", "NO BLOOD", 
    "NO FOOD PROCESSED FOOD", "NO BEANS", "NO NUTS", "NO TOFU", "NO COFFEE", 
    "NO CHOCOLATE", "NO TOMATOES", "NO SPICY", "NO BEEF"
  ]);

  // Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCompany, setSelectedCompany] = useState("ALL");
  const [selectedBattalion, setSelectedBattalion] = useState("ALL");
  const [selectedClass, setSelectedClass] = useState("ALL");
  const [selectedBos, setSelectedBos] = useState("ALL");
  const [selectedStatus, setSelectedStatus] = useState("ALL");
  const [selectedDiet, setSelectedDiet] = useState("ALL");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  // Fetch Excel data on mount
  useEffect(() => {
    fetchSpreadsheetData();
  }, []);

  // Map company name to battalion (as requested)
  // Alfa, Bravo -> 1st Battalion
  // Charlie, Delta -> 2nd Battalion
  // Echo, Foxtrot -> 3rd Battalion
  // Golf, Hawk -> 4th Battalion
  const getBattalion = (co: string): string => {
    const cleanCo = co.trim().toUpperCase();
    if (cleanCo === "ALFA" || cleanCo === "BRAVO" || cleanCo === "A" || cleanCo === "B") {
      return "1ST BATTALION";
    } else if (cleanCo === "CHARLIE" || cleanCo === "DELTA" || cleanCo === "C" || cleanCo === "D") {
      return "2ND BATTALION";
    } else if (cleanCo === "ECHO" || cleanCo === "FOXTROT" || cleanCo === "E" || cleanCo === "F" || cleanCo === "1ST") {
      return "3RD BATTALION";
    } else if (cleanCo === "GOLF" || cleanCo === "HAWK" || cleanCo === "G" || cleanCo === "H" || cleanCo === "2ND") {
      return "4TH BATTALION";
    }
    return "OTHER / UNKNOWN";
  };

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

  const fetchSpreadsheetData = async () => {
    const sheetId = process.env.NEXT_PUBLIC_SPREADSHEET_ID || "14dSYE1ntxNrnBdgSn-mWU5z-GMHK7qdMcKFchgh0pAQ";
    const gid = process.env.NEXT_PUBLIC_DATABASE_GID || "482780671";
    // Add cache-busting timestamp to prevent browser cache
    const url = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${gid}&t=${Date.now()}`;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to retrieve sheet data: status ${response.status}`);
      }

      const csvText = await response.text();
      const rows = parseCSV(csvText);

      if (rows.length < 2) {
        throw new Error("Spreadsheet contains insufficient rows.");
      }

      // Headers should be in the very first row
      const headers = rows[0].map(h => h.trim());

      // Identify Standard Columns
      const colIndices = {
        company: headers.findIndex(h => h.toUpperCase() === "COMPANY"),
        name: headers.findIndex(h => h.toUpperCase() === "NAME"),
        bos: headers.findIndex(h => h.toUpperCase() === "BOS"),
        class: headers.findIndex(h => h.toUpperCase() === "CLASS"),
        battalion: headers.findIndex(h => h.toUpperCase() === "BATTALION"),
        status: headers.findIndex(h => h.toUpperCase() === "STATUS")
      };

      if (colIndices.name === -1 || colIndices.company === -1) {
        throw new Error("Required columns ('NAME' or 'COMPANY') were not found in the spreadsheet header.");
      }

      // Determine Dietary Columns: Any column header starting with "NO "
      const parsedDietCols: string[] = [];
      const dietColIndices: { [name: string]: number } = {};

      headers.forEach((header, idx) => {
        if (!header) return;
        const upper = header.toUpperCase();
        if (upper.startsWith("NO ")) {
          parsedDietCols.push(header);
          dietColIndices[header] = idx;
        }
      });

      // Parse Cadet Records
      const parsedCadets: Cadet[] = [];
      for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        if (row.length === 0 || !row[colIndices.name]) continue;

        const nameStr = row[colIndices.name].trim();
        const companyStr = row[colIndices.company].trim().toUpperCase();
        const bosStr = colIndices.bos !== -1 && row[colIndices.bos] ? row[colIndices.bos].trim().toUpperCase() : "N/A";
        const classStr = colIndices.class !== -1 && row[colIndices.class] ? row[colIndices.class].trim().toUpperCase() : "4CL";
        const statusStr = colIndices.status !== -1 && row[colIndices.status] ? row[colIndices.status].trim().toUpperCase() : "FULL DUTY";

        // Diets map: check if column contains exactly "1"
        const cadetDiets: { [dietName: string]: boolean } = {};
        parsedDietCols.forEach((dCol) => {
          const colIdx = dietColIndices[dCol];
          const val = row[colIdx] ? row[colIdx].trim() : "";
          // User request: if the cell has "1", they qualify for that dietary restriction
          cadetDiets[dCol] = val === "1";
        });

        parsedCadets.push({
          no: i.toString(),
          class: classStr,
          name: nameStr.toUpperCase(),
          serialNo: "N/A", // Serial number not in new database columns
          gender: "M", // Gender not in new database columns
          company: companyStr,
          battalion: getBattalion(companyStr),
          bos: classStr === "3CL" || classStr === "4CL" ? "N/A" : bosStr,
          status: statusStr || "FULL DUTY",
          diets: cadetDiets,
        });
      }

      setDietColumns(parsedDietCols);
      setCadets(parsedCadets);
      setDataSource("LIVE");
    } catch (err: any) {
      console.warn("Fetch failed, falling back to mock dataset:", err.message);
      setError(`Google Sheet fetch failed. Displaying fallback mock database. Error details: ${err.message}`);
      setDataSource("MOCK");
      setDietColumns([
        "NO FISH", "NO PORK", "NO SEAFOOD", "NO EGG", "NO CHICKEN", "NO BLOOD", 
        "NO FOOD PROCESSED FOOD", "NO BEANS", "NO NUTS", "NO TOFU", "NO COFFEE", 
        "NO CHOCOLATE", "NO TOMATOES", "NO SPICY", "NO BEEF"
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Filter Logic
  const filteredCadets = cadets.filter((cadet) => {
    // Name Search
    const matchesSearch = cadet.name.toLowerCase().includes(searchQuery.toLowerCase());

    // Company filter
    const matchesCoy = selectedCompany === "ALL" || cadet.company === selectedCompany;

    // Battalion filter
    const matchesBn = selectedBattalion === "ALL" || cadet.battalion === selectedBattalion;

    // Class filter
    const matchesClass = selectedClass === "ALL" || cadet.class === selectedClass;

    // BOS filter
    const matchesBos = selectedBos === "ALL" || cadet.bos === selectedBos;

    // Status filter
    const matchesStatus =
      selectedStatus === "ALL" ||
      (selectedStatus === "HC" && (cadet.status === "HC" || cadet.status.includes("HOLDING"))) ||
      (selectedStatus === "FULL DUTY" && cadet.status === "FULL DUTY");

    // Diet filter
    const matchesDiet = selectedDiet === "ALL" || cadet.diets[selectedDiet] === true;

    return matchesSearch && matchesCoy && matchesBn && matchesClass && matchesBos && matchesStatus && matchesDiet;
  });

  // Calculate stats based on FILTERED cadets
  const totalCadetsCount = filteredCadets.length;
  const bn1Count = filteredCadets.filter((c) => c.battalion === "1ST BATTALION").length;
  const bn2Count = filteredCadets.filter((c) => c.battalion === "2ND BATTALION").length;
  const bn3Count = filteredCadets.filter((c) => c.battalion === "3RD BATTALION").length;
  const bn4Count = filteredCadets.filter((c) => c.battalion === "4TH BATTALION").length;
  const hcCount = filteredCadets.filter((c) => c.status === "HC" || c.status.includes("HOLDING")).length;

  // Calculate counts for each dietary restriction (where cell is "1")
  const dietCounts: { [dietName: string]: number } = {};
  dietColumns.forEach((dietName) => {
    dietCounts[dietName] = filteredCadets.filter((c) => c.diets[dietName] === true).length;
  });

  // Pagination Logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredCadets.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredCadets.length / itemsPerPage);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  return (
    <div>
      {/* Page Header */}
      <header className="page-header">
        <div className="page-title">
          <h2>Mess Disposition Dashboard</h2>
          <p>
            Roster database is loaded from your Google Sheet (
            <span style={{ fontWeight: 700, color: dataSource === "LIVE" ? "var(--success)" : "var(--primary)" }}>
              {dataSource === "LIVE" ? "Live Database Connection" : "Demo Mode / Fallback Database"}
            </span>
            ).
          </p>
        </div>
        <div className="header-actions">
          <button className="btn btn-outline" onClick={fetchSpreadsheetData} disabled={loading}>
            {loading ? "Syncing..." : "Sync Database"}
          </button>
        </div>
      </header>

      {/* Error alert */}
      {error && (
        <div className="alert-success" style={{ backgroundColor: "#FEF2F2", border: "1px solid #FECACA", color: "#991B1B", marginBottom: "2rem" }}>
          <strong>Notice:</strong> {error}
        </div>
      )}

      {/* Stats Summary Panel */}
      <div className="stats-grid">
        <div className="stat-card">
          <h3>Total Roster</h3>
          <div className="value">{totalCadetsCount}</div>
          <div className="subtext">Active Filters matched</div>
        </div>
        <div className="stat-card">
          <h3>1st Battalion</h3>
          <div className="value">{bn1Count}</div>
          <div className="subtext">Alfa, Bravo</div>
        </div>
        <div className="stat-card">
          <h3>2nd Battalion</h3>
          <div className="value">{bn2Count}</div>
          <div className="subtext">Charlie, Delta</div>
        </div>
        <div className="stat-card">
          <h3>3rd Battalion</h3>
          <div className="value">{bn3Count}</div>
          <div className="subtext">Echo, Foxtrot</div>
        </div>
        <div className="stat-card">
          <h3>4th Battalion</h3>
          <div className="value">{bn4Count}</div>
          <div className="subtext">Golf, Hawk</div>
        </div>
        <div className="stat-card">
          <h3>HC Status</h3>
          <div className="value">{hcCount}</div>
          <div className="subtext">Holding Center</div>
        </div>
      </div>

      {/* Dynamic Search & Filters Section */}
      <div className="card">
        <div className="card-title">Roster Filters</div>
        <div className="filter-section">
          {/* Name Search */}
          <div className="form-group">
            <label htmlFor="search-input">Search Cadet</label>
            <input
              id="search-input"
              type="text"
              className="input-field"
              placeholder="Search by last name..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>

          {/* Battalion */}
          <div className="form-group">
            <label htmlFor="bn-select">Battalion</label>
            <select
              id="bn-select"
              className="input-field"
              value={selectedBattalion}
              onChange={(e) => {
                setSelectedBattalion(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="ALL">All Battalions</option>
              <option value="1ST BATTALION">1st Battalion (Alfa/Bravo)</option>
              <option value="2ND BATTALION">2nd Battalion (Charlie/Delta)</option>
              <option value="3RD BATTALION">3rd Battalion (Echo/Foxtrot)</option>
              <option value="4TH BATTALION">4th Battalion (Golf/Hawk)</option>
            </select>
          </div>

          {/* Company */}
          <div className="form-group">
            <label htmlFor="coy-select">Company</label>
            <select
              id="coy-select"
              className="input-field"
              value={selectedCompany}
              onChange={(e) => {
                setSelectedCompany(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="ALL">All Companies</option>
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

          {/* Class */}
          <div className="form-group">
            <label htmlFor="class-select">Class</label>
            <select
              id="class-select"
              className="input-field"
              value={selectedClass}
              onChange={(e) => {
                setSelectedClass(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="ALL">All Classes</option>
              <option value="1CL">1CL (First Class)</option>
              <option value="2CL">2CL (Second Class)</option>
              <option value="3CL">3CL (Third Class)</option>
              <option value="4CL">4CL (Fourth Class)</option>
            </select>
          </div>

          {/* BOS */}
          <div className="form-group">
            <label htmlFor="bos-select">Branch of Service</label>
            <select
              id="bos-select"
              className="input-field"
              value={selectedBos}
              onChange={(e) => {
                setSelectedBos(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="ALL">All Branches</option>
              <option value="PA">PA (Army)</option>
              <option value="PAF">PAF (Airforce)</option>
              <option value="PN">PN (Navy)</option>
              <option value="N/A">N/A (3rd/4th Class)</option>
            </select>
          </div>

          {/* Status */}
          <div className="form-group">
            <label htmlFor="status-select">Status</label>
            <select
              id="status-select"
              className="input-field"
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="ALL">All Statuses</option>
              <option value="FULL DUTY">Full Duty</option>
              <option value="HC">Holding Center (HC)</option>
            </select>
          </div>

          {/* Dietary Restrictions filter */}
          <div className="form-group">
            <label htmlFor="diet-filter-select">Special Diet Filter</label>
            <select
              id="diet-filter-select"
              className="input-field"
              value={selectedDiet}
              onChange={(e) => {
                setSelectedDiet(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="ALL">All Diets</option>
              {dietColumns.map((dCol) => (
                <option key={dCol} value={dCol}>
                  {dCol}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Kitchen Summary Section */}
      <div className="card" style={{ borderColor: "var(--accent)" }}>
        <div className="card-title">
          <span>Kitchen Cooking Shares Summary</span>
          <span className="badge badge-diet">Kitchen Dispatch Copy</span>
        </div>
        <p style={{ fontSize: "0.85rem", color: "var(--secondary-light)", marginBottom: "1rem" }}>
          This summary calculates the exact dietary shares to prepare for the kitchen based on the active search filters.
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem" }}>
          {dietColumns.map((dietName) => {
            const count = dietCounts[dietName] || 0;
            return (
              <div
                key={dietName}
                style={{
                  border: "1px solid var(--accent-light)",
                  backgroundColor: "#FCF9F2",
                  borderRadius: "12px",
                  padding: "1rem",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div>
                  <span style={{ fontWeight: 700, fontSize: "0.95rem", color: "#7D5B18", display: "block" }}>
                    {dietName}
                  </span>
                  <span style={{ fontSize: "0.75rem", color: "var(--muted)" }}>Active shares</span>
                </div>
                <div style={{ fontSize: "1.75rem", fontWeight: 800, color: "var(--accent)" }}>
                  {count}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Cadet Roster Table */}
      <div className="card">
        <div className="card-title">Cadet Roster</div>

        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>No.</th>
                <th>Class</th>
                <th>Name</th>
                <th>Coy</th>
                <th>Battalion</th>
                <th>BOS</th>
                <th>Status</th>
                <th>Dietary Restrictions</th>
              </tr>
            </thead>
            <tbody>
              {currentItems.length > 0 ? (
                currentItems.map((c) => {
                  // Find diet columns that have "1" (true)
                  const activeDiets = dietColumns.filter((dName) => c.diets[dName] === true);

                  return (
                    <tr key={c.no + c.name}>
                      <td>{c.no}</td>
                      <td>{c.class}</td>
                      <td style={{ fontWeight: 600 }}>{c.name}</td>
                      <td>{c.company}</td>
                      <td style={{ fontSize: "0.8rem", textTransform: "uppercase" }}>{c.battalion}</td>
                      <td>
                        <span
                          className={`badge ${
                            c.bos === "PA"
                              ? "badge-army"
                              : c.bos === "PAF"
                              ? "badge-airforce"
                              : c.bos === "PN"
                              ? "badge-navy"
                              : ""
                          }`}
                        >
                          {c.bos === "N/A" ? "" : c.bos}
                        </span>
                      </td>
                      <td>
                        {c.status === "HC" || c.status.includes("HOLDING") ? (
                          <span className="badge badge-status">HC</span>
                        ) : (
                          c.status
                        )}
                      </td>
                      <td>
                        <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
                          {activeDiets.map((d) => (
                            <span key={d} className="badge badge-diet" style={{ fontSize: "0.7rem", padding: "1px 6px" }}>
                              {d}
                            </span>
                          ))}
                          {activeDiets.length === 0 && <span style={{ color: "var(--muted)", fontSize: "0.85rem" }}>None</span>}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} style={{ textAlign: "center", padding: "2rem", color: "var(--muted)" }}>
                    No matching cadets found in the roster database.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination controls */}
        {totalPages > 1 && (
          <div className="pagination">
            <span style={{ fontSize: "0.85rem", color: "var(--secondary-light)" }}>
              Page {currentPage} of {totalPages} (Total: {filteredCadets.length} entries)
            </span>
            <div style={{ display: "flex", gap: "6px" }}>
              <button
                className="btn btn-outline"
                style={{ padding: "6px 12px", fontSize: "0.8rem" }}
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                Previous
              </button>
              <button
                className="btn btn-outline"
                style={{ padding: "6px 12px", fontSize: "0.8rem" }}
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
