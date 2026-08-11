"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useAuth } from "./context/AuthContext";

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
  const { user } = useAuth();
  const [cadets, setCadets] = useState<Cadet[]>(MOCK_CADETS);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dataSource, setDataSource] = useState<"MOCK" | "LIVE">("MOCK");
  const [greeting, setGreeting] = useState("Good day, Officer");
  const [mounted, setMounted] = useState(false);
  
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

  // Modal States for Battalion summaries
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState("");
  const [modalCadets, setModalCadets] = useState<Cadet[]>([]);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  // Greeting Setup & Data Fetch on mount
  useEffect(() => {
    fetchSpreadsheetData();
    const hour = new Date().getHours();
    if (hour < 12) setGreeting("Good morning, Officer");
    else if (hour < 18) setGreeting("Good afternoon, Officer");
    else setGreeting("Good evening, Officer");
    setMounted(true);
  }, []);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isModalOpen) {
      document.body.classList.add("modal-open");
    } else {
      document.body.classList.remove("modal-open");
    }
    return () => {
      document.body.classList.remove("modal-open");
    };
  }, [isModalOpen]);

  // Map company name to battalion (as requested)
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

  // Helper to open modal populated with specific battalion & diet list
  const openDietModal = (battalionName: string, dietName: string) => {
    const list = cadets.filter(
      (c) => c.battalion === battalionName && c.diets[dietName] === true
    );
    setModalTitle(`${battalionName} - ${dietName} (${list.length} Cadets)`);
    setModalCadets(list);
    setIsModalOpen(true);
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

      const headers = rows[0].map(h => h.trim());

      const colIndices = {
        company: headers.findIndex(h => h.toUpperCase() === "COMPANY"),
        name: headers.findIndex(h => h.toUpperCase() === "NAME"),
        bos: headers.findIndex(h => h.toUpperCase() === "BOS"),
        class: headers.findIndex(h => h.toUpperCase() === "CLASS"),
        battalion: headers.findIndex(h => h.toUpperCase() === "BATTALION"),
        status: headers.findIndex(h => h.toUpperCase() === "STATUS")
      };

      if (colIndices.name === -1 || colIndices.company === -1) {
        throw new Error("Required columns ('NAME' or 'COMPANY') were not found.");
      }

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

      const parsedCadets: Cadet[] = [];
      for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        if (row.length === 0 || !row[colIndices.name]) continue;

        const nameStr = row[colIndices.name].trim();
        const companyStr = row[colIndices.company].trim().toUpperCase();
        const bosStr = colIndices.bos !== -1 && row[colIndices.bos] ? row[colIndices.bos].trim().toUpperCase() : "N/A";
        const classStr = colIndices.class !== -1 && row[colIndices.class] ? row[colIndices.class].trim().toUpperCase() : "4CL";
        const statusStr = colIndices.status !== -1 && row[colIndices.status] ? row[colIndices.status].trim().toUpperCase() : "FULL DUTY";

        const cadetDiets: { [dietName: string]: boolean } = {};
        parsedDietCols.forEach((dCol) => {
          const colIdx = dietColIndices[dCol];
          const val = row[colIdx] ? row[colIdx].trim() : "";
          cadetDiets[dCol] = val === "1";
        });

        parsedCadets.push({
          no: i.toString(),
          class: classStr,
          name: nameStr.toUpperCase(),
          serialNo: "N/A",
          gender: "M",
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
      setError(`Google Sheet connection unavailable. Displaying fallback mock database.`);
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
    const matchesSearch = cadet.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCoy = selectedCompany === "ALL" || cadet.company === selectedCompany;
    const matchesBn = selectedBattalion === "ALL" || cadet.battalion === selectedBattalion;
    const matchesClass = selectedClass === "ALL" || cadet.class === selectedClass;
    const matchesBos = selectedBos === "ALL" || cadet.bos === selectedBos;
    const matchesStatus =
      selectedStatus === "ALL" ||
      (selectedStatus === "HC" && (cadet.status === "HC" || cadet.status.includes("HOLDING"))) ||
      (selectedStatus === "FULL DUTY" && cadet.status === "FULL DUTY");
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

  // Calculate counts for each dietary restriction
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

  // Group diets into categories
  const allergenDiets = ["NO FISH", "NO SEAFOOD", "NO EGG", "NO CHICKEN", "NO BEANS", "NO NUTS", "NO TOFU", "NO TOMATOES", "NO SPICY"];
  const preferenceDiets = ["NO PORK", "NO BEEF", "NO BLOOD", "NO FOOD PROCESSED FOOD", "NO COFFEE", "NO CHOCOLATE"];

  const categorizedDiets = {
    allergens: dietColumns.filter(d => allergenDiets.includes(d.toUpperCase())),
    preferences: dietColumns.filter(d => preferenceDiets.includes(d.toUpperCase()) || !allergenDiets.includes(d.toUpperCase())),
  };

  const handlePrintSpecialDietReport = async () => {
    try {
      // Fetch the report data directly from the formatted Google Sheet GID 1721294419
      const REPORT_URL = "https://docs.google.com/spreadsheets/d/14dSYE1ntxNrnBdgSn-mWU5z-GMHK7qdMcKFchgh0pAQ/export?format=csv&gid=1721294419";
      const response = await fetch(REPORT_URL);
      if (!response.ok) throw new Error("Failed to fetch report data");
      const csvText = await response.text();
      const allRows = parseCSV(csvText);

      // Military datetime format
      const now = new Date();
      const day = String(now.getDate()).padStart(2, "0");
      const hours = String(now.getHours()).padStart(2, "0");
      const minutes = String(now.getMinutes()).padStart(2, "0");
      const monthNames = ["JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE", "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER"];
      const formattedDateTime = day + " " + hours + minutes + "H " + monthNames[now.getMonth()] + " " + now.getFullYear();

      const COMPANY_NAMES = new Set(["ALFA", "BRAVO", "CHARLIE", "DELTA", "ECHO", "FOXTROT", "GOLF", "HAWK"]);
      const FEMALE_SURNAMES = ["DE MESA", "MALANOT", "FELIPE", "LORICO", "PRACULLOS", "ATIWEN", "BALILI", "ANGOLUAN"];

      const isFemaleCell = (text: string): boolean => {
        const upper = text.toUpperCase().trim();
        if (!upper) return false;
        return FEMALE_SURNAMES.some(name => upper.includes(name));
      };

      const hasDietHeaders = (row: string[]): boolean => {
        return row.slice(1).some(c => c.trim().toUpperCase().startsWith("NO "));
      };

      // Pad all rows to consistent length and trim cells
      const maxCols = Math.max(...allRows.map(r => r.length));
      const rows: string[][] = allRows.map(r => {
        const padded = [...r];
        while (padded.length < maxCols) padded.push("");
        return padded.map(c => c.trim());
      });

      // Filter empty rows
      const nonEmptyRows = rows.filter(r => r.some(c => c !== ""));

      // Group rows into company sections
      interface Section {
        company: string;
        headerRows: string[][];
        dataRows: string[][];
        totalRows: string[][];
        numCols: number;
      }

      const sections: Section[] = [];
      let currentSection: Section | null = null;

      for (let i = 0; i < nonEmptyRows.length; i++) {
        const row = nonEmptyRows[i];
        const first = row[0].toUpperCase().trim();
        
        const isDietHdr = hasDietHeaders(row);
        const isCompany = COMPANY_NAMES.has(first);
        const isTotal = first.includes("TOTAL") || first.includes("BATT") || first.includes("OVERALL");
        const isLabelOnly = isCompany && row.slice(1).every(c => c.trim() === "");

        // Check if this row starts/adds to header of a company section
        if (isDietHdr) {
          const shouldStartNew = !currentSection || currentSection.dataRows.length > 0 || currentSection.totalRows.length > 0;
          if (shouldStartNew) {
            if (currentSection) sections.push(currentSection);
            
            let sectionCompany = isCompany ? first : "";
            if (!sectionCompany) {
              for (let j = i + 1; j < nonEmptyRows.length && j <= i + 5; j++) {
                const nextFirst = nonEmptyRows[j][0].toUpperCase().trim();
                if (COMPANY_NAMES.has(nextFirst)) {
                  sectionCompany = nextFirst;
                  break;
                }
              }
            }
            currentSection = {
              company: sectionCompany || "SPECIAL DIETS",
              headerRows: [row],
              dataRows: [],
              totalRows: [],
              numCols: 0
            };
          } else {
            currentSection.headerRows.push(row);
          }
          continue;
        }

        // If we don't have a section yet (e.g. at the very end for OVERALL TOTAL), create a dummy one
        if (!currentSection) {
          currentSection = {
            company: "OVERALL TOTAL",
            headerRows: [],
            dataRows: [],
            totalRows: [],
            numCols: 0
          };
        }

        // Classify the row inside the active section
        if (isLabelOnly) {
          // Skip company label rows (e.g. "FOXTROT" on its own row)
          continue;
        } else if (isTotal) {
          currentSection.totalRows.push(row);
        } else {
          // Data row!
          const cleanRow = [...row];
          if (isCompany) {
            cleanRow[0] = "";
          }
          currentSection.dataRows.push(cleanRow);
        }
      }
      
      if (currentSection) {
        sections.push(currentSection);
      }

      // Detect unlabeled total rows (numeric-only last rows without TOTAL label, e.g. ECHO)
      for (const section of sections) {
        if (section.totalRows.length === 0 && section.dataRows.length > 0) {
          const lastRow = section.dataRows[section.dataRows.length - 1];
          if (!lastRow[0]) {
            const filled = lastRow.slice(1).filter(c => c !== "");
            const allNumeric = filled.length > 0 && filled.every(c => /^\d+$/.test(c));
            if (allNumeric) {
              const popped = section.dataRows.pop()!;
              popped[0] = "TOTAL";
              section.totalRows.push(popped);
            }
          }
        }
      }

      // Calculate active column count per section
      for (const section of sections) {
        let mc = 0;
        const allSectionRows = [...section.headerRows, ...section.dataRows, ...section.totalRows];
        for (const r of allSectionRows) {
          for (let j = r.length - 1; j >= 0; j--) {
            if (r[j] && r[j].trim() !== "") {
              mc = Math.max(mc, j + 1);
              break;
            }
          }
        }
        section.numCols = mc;
      }

      // Separate companies from overall summary
      const companySections = sections.filter(s => s.company !== "OVERALL TOTAL" && COMPANY_NAMES.has(s.company));
      const overallSection = sections.find(s => s.company === "OVERALL TOTAL" || s.company.includes("OVERALL"));

      // Format Overall Summary HTML
      let overallHtml = "";
      if (overallSection && overallSection.totalRows.length > 0) {
        const firstCompanyHeaders = companySections[0]?.headerRows[0] || [];
        overallHtml += '<div class="overall-summary-card">';
        overallHtml += '<div class="overall-title">OVERALL SUMMARY</div>';
        
        overallSection.totalRows.forEach(tRow => {
          const label = tRow[0] || "OVERALL TOTAL";
          const totalsList: string[] = [];
          for (let j = 1; j < tRow.length; j++) {
            const val = tRow[j] || "";
            const dietName = firstCompanyHeaders[j] || "";
            if (val && val !== "0" && dietName && dietName.startsWith("NO ")) {
              totalsList.push("<strong>" + dietName + "</strong>: " + val);
            }
          }
          overallHtml += '<div class="overall-row">' +
            '<div class="overall-row-label">' + label + "</div>" +
            '<div class="overall-row-values">' + totalsList.join(" &nbsp;|&nbsp; ") + "</div>" +
            "</div>";
        });
        overallHtml += "</div>";
      }

      // Group companies into pairs (2 per page)
      interface DietColumnData {
        name: string;
        total: string;
        cadets: string[];
      }

      const pairs: Section[][] = [];
      for (let i = 0; i < companySections.length; i += 2) {
        pairs.push(companySections.slice(i, i + 2));
      }

      let pagesHtml = "";

      pairs.forEach((pair, pairIdx) => {
        let pairCompaniesHtml = "";

        pair.forEach(section => {
          const dietNamesRow = section.headerRows[0] || [];
          const totalRow = section.totalRows[0] || [];
          const activeDiets: DietColumnData[] = [];

          // Collect columns with data
          for (let j = 1; j < section.numCols; j++) {
            const dietName = dietNamesRow[j] || "";
            if (!dietName || !dietName.toUpperCase().startsWith("NO ")) continue;

            const cadetsList: string[] = [];
            for (const dRow of section.dataRows) {
              const cadetVal = dRow[j] || "";
              if (cadetVal && cadetVal.trim() !== "") {
                cadetsList.push(cadetVal.trim());
              }
            }

            const dietTotal = totalRow[j] || String(cadetsList.length);

            // Filter out empty columns
            if (cadetsList.length > 0 || (parseInt(dietTotal) > 0 && dietTotal !== "0")) {
              activeDiets.push({
                name: dietName,
                total: dietTotal,
                cadets: cadetsList
              });
            }
          }

          // Build columns layout
          let dietsHtml = "";
          activeDiets.forEach(diet => {
            let cadetItemsHtml = "";
            diet.cadets.forEach(cadet => {
              const isFemale = isFemaleCell(cadet);
              const className = isFemale ? 'class="female-cadet"' : "";
              cadetItemsHtml += "<li " + className + ">" + cadet + "</li>";
            });

            dietsHtml += '<div class="diet-column">' +
              '<div class="diet-column-header">' + diet.name + " (" + diet.total + ")</div>" +
              '<ul class="cadet-list">' + cadetItemsHtml + "</ul>" +
              "</div>";
          });

          // Build totals row
          let totalsSummaryHtml = "";
          section.totalRows.forEach(tRow => {
            const label = tRow[0] || "TOTAL";
            const totalsList: string[] = [];
            activeDiets.forEach(diet => {
              const origIdx = dietNamesRow.indexOf(diet.name);
              if (origIdx !== -1) {
                const val = tRow[origIdx] || "0";
                totalsList.push("<strong>" + diet.name + "</strong>: " + val);
              }
            });

            totalsSummaryHtml += '<div class="company-total-row">' +
              '<div class="total-row-label">' + label + "</div>" +
              '<div class="total-row-values">' + totalsList.join(" &nbsp;|&nbsp; ") + "</div>" +
              "</div>";
          });

          pairCompaniesHtml += '<div class="company-card">' +
            '<div class="company-name-banner">' + section.company + " COMPANY</div>" +
            '<div class="diets-flex-container">' + dietsHtml + "</div>" +
            '<div class="company-totals-section">' + totalsSummaryHtml + "</div>" +
            "</div>";
        });

        const isLastPage = pairIdx === pairs.length - 1;
        const pageContentHtml = pairCompaniesHtml + (isLastPage ? overallHtml : "");

        pagesHtml += '<div class="page-container">' +
          '<div class="print-header">' +
          '<div class="header-title-1">Cadet Corps Armed Forces of the Philippines</div>' +
          '<div class="header-title-2">Mess Council</div>' +
          '<div class="header-title-3">Fort General Gregorio H. del Pilar</div>' +
          '<div class="header-title-4">Baguio City</div>' +
          "</div>" +
          '<div class="print-datetime">' + formattedDateTime + "</div>" +
          '<div class="companies-wrapper">' + pageContentHtml + "</div>" +
          "</div>";
      });

      // Build the full print HTML document
      const printContent = "<!DOCTYPE html><html><head>" +
        "<title>Special Diet Report - CCAFP Mess Council</title>" +
        "<style>" +
        "@media print { @page { size: landscape; margin: 6mm 10mm; } body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }" +
        "body { font-family: Arial, sans-serif; margin: 0; padding: 0; color: #000; background: #fff; -webkit-print-color-adjust: exact; print-color-adjust: exact; }" +
        ".page-container { page-break-after: always; padding: 10px; box-sizing: border-box; height: 98vh; display: flex; flex-direction: column; }" +
        ".page-container:last-child { page-break-after: avoid; }" +
        ".print-header { text-align: center; line-height: 1.2; margin-bottom: 4px; }" +
        ".header-title-1 { font-size: 11pt; font-weight: bold; text-transform: uppercase; }" +
        ".header-title-2 { font-size: 10pt; font-weight: bold; text-transform: uppercase; margin-top: 1px; }" +
        ".header-title-3 { font-size: 8.5pt; margin-top: 1px; }" +
        ".header-title-4 { font-size: 8.5pt; margin-top: 1px; }" +
        ".print-datetime { text-align: center; font-size: 9pt; font-weight: bold; margin-bottom: 8px; }" +
        ".companies-wrapper { flex-grow: 1; display: flex; flex-direction: column; justify-content: space-between; gap: 8px; min-height: 0; }" +
        ".company-card { border: 1.5px solid #666; border-radius: 6px; padding: 6px 10px; background-color: #fff; display: flex; flex-direction: column; gap: 4px; flex: 1; min-height: 0; }" +
        ".company-name-banner { font-size: 9pt; font-weight: bold; background-color: #f2f2f2; padding: 3px 6px; border-radius: 4px; text-transform: uppercase; border-left: 4px solid #b6d7a8; }" +
        ".diets-flex-container { display: flex; flex-wrap: wrap; gap: 6px; flex-grow: 1; align-content: flex-start; min-height: 0; overflow: hidden; }" +
        ".diet-column { flex: 1 1 110px; border: 1px solid #ccc; border-radius: 4px; background-color: #fafafa; padding: 4px; display: flex; flex-direction: column; gap: 3px; min-height: 0; }" +
        ".diet-column-header { font-size: 7pt; font-weight: bold; background-color: #b6d7a8 !important; color: #000; padding: 2px 4px; border-radius: 3px; text-align: center; text-transform: uppercase; }" +
        ".cadet-list { list-style: none; padding: 0; margin: 0; font-size: 7pt; overflow-y: auto; }" +
        ".cadet-list li { padding: 1.5px 2px; border-bottom: 1px solid #eee; }" +
        ".cadet-list li:last-child { border-bottom: none; }" +
        ".female-cadet { color: #d93025 !important; font-weight: bold; }" +
        ".company-totals-section { border-top: 1px dashed #999; padding-top: 3px; display: flex; flex-direction: column; gap: 2px; }" +
        ".company-total-row { display: flex; font-size: 6.5pt; background-color: #f9f9f9 !important; padding: 1.5px 4px; border-radius: 3px; border: 1px solid #ddd; }" +
        ".total-row-label { font-weight: bold; width: 120px; min-width: 120px; color: #000; text-transform: uppercase; }" +
        ".total-row-values { flex-grow: 1; color: #333; }" +
        ".overall-summary-card { border: 2px solid #333; border-radius: 6px; padding: 6px 10px; background-color: #fff; margin-top: 4px; }" +
        ".overall-title { font-size: 8.5pt; font-weight: bold; background-color: #333 !important; color: #fff; padding: 3px 6px; border-radius: 4px; text-align: center; margin-bottom: 4px; }" +
        ".overall-row { display: flex; font-size: 7pt; background-color: #f5f5f5 !important; padding: 2.5px 6px; border-radius: 3px; border: 1px solid #ddd; margin-bottom: 2px; }" +
        ".overall-row:last-child { margin-bottom: 0; }" +
        ".overall-row-label { font-weight: bold; width: 130px; min-width: 130px; color: #000; text-transform: uppercase; }" +
        ".overall-row-values { flex-grow: 1; color: #111; }" +
        "</style></head><body>" +
        pagesHtml +
        "<script>window.onload = function() { window.print(); }<\/script>" +
        "</body></html>";

      const printWindow = window.open("", "_blank");
      if (printWindow) {
        printWindow.document.write(printContent);
        printWindow.document.close();
      } else {
        alert("Could not open print window. Please disable your pop-up blocker.");
      }
    } catch (err) {
      console.error("Print report error:", err);
      alert("Failed to load the special diet report data. Please check your internet connection and try again.");
    }
  };

  return (
    <div className="animate-fade-in">
      {/* Premium Hero Banner */}
      <header className="hero-header-card animate-fade-in animate-stagger-1">
        <div className="hero-text">
          <h2>{greeting}</h2>
          <p>
            Mess Disposition System connected to:{" "}
            <span style={{ fontWeight: 800, textDecoration: "underline", color: dataSource === "LIVE" ? "var(--success)" : "var(--accent)" }}>
              {dataSource === "LIVE" ? "Live Cadet Database" : "Demo Mode / Offline Roster"}
            </span>
          </p>
        </div>
        <div className="header-actions" style={{ display: "flex", gap: "10px" }}>
          {user && user.role === "RMESSO" && (
            <button 
              className="btn btn-primary" 
              onClick={handlePrintSpecialDietReport}
              style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ width: "16px", height: "16px" }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              <span>Print Special Diet Report</span>
            </button>
          )}
          <button className="btn btn-accent" onClick={fetchSpreadsheetData} disabled={loading}>
            {loading ? (
              <>
                <svg className="animate-spin" style={{ width: "16px", height: "16px", marginRight: "6px" }} fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Syncing...
              </>
            ) : "Sync Database"}
          </button>
        </div>
      </header>

      {/* Error alert */}
      {error && (
        <div className="alert-success animate-fade-in" style={{ backgroundColor: "var(--warning-light)", border: "1px solid var(--warning)", color: "var(--secondary)", marginBottom: "2rem" }}>
          <strong>Offline Mode:</strong> {error}
        </div>
      )}

      {/* Stats Summary Panel */}
      <div className="stats-grid animate-fade-in animate-stagger-1">
        <div className="stat-card">
          <h3>Total Roster</h3>
          <div className="value">{totalCadetsCount}</div>
          <div className="subtext">Active filter match</div>
        </div>
        <div className="stat-card">
          <h3>1st Battalion</h3>
          <div className="value">{bn1Count}</div>
          <div className="subtext">Alfa, Bravo Co.</div>
        </div>
        <div className="stat-card">
          <h3>2nd Battalion</h3>
          <div className="value">{bn2Count}</div>
          <div className="subtext">Charlie, Delta Co.</div>
        </div>
        <div className="stat-card">
          <h3>3rd Battalion</h3>
          <div className="value">{bn3Count}</div>
          <div className="subtext">Echo, Foxtrot Co.</div>
        </div>
        <div className="stat-card">
          <h3>4th Battalion</h3>
          <div className="value">{bn4Count}</div>
          <div className="subtext">Golf, Hawk Co.</div>
        </div>
        <div className="stat-card">
          <h3>Holding Center</h3>
          <div className="value">{hcCount}</div>
          <div className="subtext">HC Status Cadets</div>
        </div>
      </div>

      {/* Dynamic Search & Filters Section */}
      <div className="card animate-fade-in animate-stagger-2">
        <div className="card-title">Roster Filters</div>
        
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          {/* Name Search Row */}
          <div className="form-group" style={{ maxWidth: "450px" }}>
            <label htmlFor="search-input">Search Cadet</label>
            <input
              id="search-input"
              type="text"
              className="input-field"
              placeholder="Search by cadet last name..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>

          {/* Battalion Buttons */}
          <div className="form-group">
            <label>Battalion</label>
            <div className="filter-button-group">
              {[
                { val: "ALL", label: "All Battalions" },
                { val: "1ST BATTALION", label: "1st Bn (Alfa/Bravo)" },
                { val: "2ND BATTALION", label: "2nd Bn (Charlie/Delta)" },
                { val: "3RD BATTALION", label: "3rd Bn (Echo/Foxtrot)" },
                { val: "4TH BATTALION", label: "4th Bn (Golf/Hawk)" }
              ].map((bn) => (
                <button
                  key={bn.val}
                  type="button"
                  className={`filter-btn ${selectedBattalion === bn.val ? "active" : ""}`}
                  onClick={() => {
                    setSelectedBattalion(bn.val);
                    setCurrentPage(1);
                  }}
                >
                  {bn.label}
                </button>
              ))}
            </div>
          </div>

          {/* Company Buttons */}
          <div className="form-group">
            <label>Company</label>
            <div className="filter-button-group">
              {[
                { val: "ALL", label: "All Companies" },
                { val: "ALFA", label: "Alfa" },
                { val: "BRAVO", label: "Bravo" },
                { val: "CHARLIE", label: "Charlie" },
                { val: "DELTA", label: "Delta" },
                { val: "ECHO", label: "Echo" },
                { val: "FOXTROT", label: "Foxtrot" },
                { val: "GOLF", label: "Golf" },
                { val: "HAWK", label: "Hawk" }
              ].map((coy) => (
                <button
                  key={coy.val}
                  type="button"
                  className={`filter-btn ${selectedCompany === coy.val ? "active" : ""}`}
                  onClick={() => {
                    setSelectedCompany(coy.val);
                    setCurrentPage(1);
                  }}
                >
                  {coy.label}
                </button>
              ))}
            </div>
          </div>

          {/* Class & BOS & Status Buttons */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: "1.5rem" }}>
            {/* Class Buttons */}
            <div className="form-group" style={{ flex: "1 1 200px" }}>
              <label>Class</label>
              <div className="filter-button-group">
                {[
                  { val: "ALL", label: "All" },
                  { val: "1CL", label: "1CL" },
                  { val: "2CL", label: "2CL" },
                  { val: "3CL", label: "3CL" },
                  { val: "4CL", label: "4CL" }
                ].map((cls) => (
                  <button
                    key={cls.val}
                    type="button"
                    className={`filter-btn ${selectedClass === cls.val ? "active" : ""}`}
                    onClick={() => {
                      setSelectedClass(cls.val);
                      setCurrentPage(1);
                    }}
                  >
                    {cls.label}
                  </button>
                ))}
              </div>
            </div>

            {/* BOS Buttons */}
            <div className="form-group" style={{ flex: "1 1 250px" }}>
              <label>Branch of Service</label>
              <div className="filter-button-group">
                {[
                  { val: "ALL", label: "All" },
                  { val: "PA", label: "Army (PA)" },
                  { val: "PAF", label: "Air Force (PAF)" },
                  { val: "PN", label: "Navy (PN)" },
                  { val: "N/A", label: "N/A" }
                ].map((bos) => (
                  <button
                    key={bos.val}
                    type="button"
                    className={`filter-btn ${selectedBos === bos.val ? "active" : ""}`}
                    onClick={() => {
                      setSelectedBos(bos.val);
                      setCurrentPage(1);
                    }}
                  >
                    {bos.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Status Buttons */}
            <div className="form-group" style={{ flex: "1 1 200px" }}>
              <label>Status</label>
              <div className="filter-button-group">
                {[
                  { val: "ALL", label: "All Statuses" },
                  { val: "FULL DUTY", label: "Full Duty" },
                  { val: "HC", label: "HC (Holding)" }
                ].map((stat) => (
                  <button
                    key={stat.val}
                    type="button"
                    className={`filter-btn ${selectedStatus === stat.val ? "active" : ""}`}
                    onClick={() => {
                      setSelectedStatus(stat.val);
                      setCurrentPage(1);
                    }}
                  >
                    {stat.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Kitchen Summary Section */}
      <div className="card animate-fade-in animate-stagger-2" style={{ borderLeft: "4px solid var(--accent)" }}>
        <div className="card-title">
          <span>Kitchen Cooking Shares Summary</span>
          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            {selectedDiet !== "ALL" && (
              <button
                className="btn btn-outline"
                style={{ padding: "4px 8px", fontSize: "0.75rem", cursor: "pointer" }}
                onClick={() => { setSelectedDiet("ALL"); setCurrentPage(1); }}
              >
                Clear Diet Filter
              </button>
            )}
            <span className="badge badge-diet">Kitchen Dispatch Roster</span>
          </div>
        </div>
        <p style={{ fontSize: "0.85rem", color: "var(--secondary-light)", marginBottom: "1.5rem" }}>
          Calculates dietary portions for active cadets. Click any item below to filter the Cadet Roster list below.
        </p>

        {/* Categorized Diets (Allergies vs Preferences) */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          
          {/* Allergies / Medical Category */}
          {categorizedDiets.allergens.length > 0 && (
            <div className="diet-category-section">
              <div className="diet-category-title">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ width: "16px", height: "16px" }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                Medical & Allergens
              </div>
              <div className="diet-category-grid">
                {categorizedDiets.allergens.map((dietName) => {
                  const count = dietCounts[dietName] || 0;
                  const isActive = selectedDiet === dietName;
                  return (
                    <div
                      key={dietName}
                      className={`diet-card-clickable ${isActive ? "active" : ""}`}
                      onClick={() => {
                        setSelectedDiet(isActive ? "ALL" : dietName);
                        setCurrentPage(1);
                      }}
                    >
                      <div className="diet-info">
                        <span className="diet-label">{dietName}</span>
                        <span className="diet-help">{isActive ? "Filter active" : "View roster"}</span>
                      </div>
                      <div className="diet-val">{count}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Religious & Preferences Category */}
          {categorizedDiets.preferences.length > 0 && (
            <div className="diet-category-section">
              <div className="diet-category-title">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ width: "16px", height: "16px" }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
                Religious & Food Restrictions
              </div>
              <div className="diet-category-grid">
                {categorizedDiets.preferences.map((dietName) => {
                  const count = dietCounts[dietName] || 0;
                  const isActive = selectedDiet === dietName;
                  return (
                    <div
                      key={dietName}
                      className={`diet-card-clickable ${isActive ? "active" : ""}`}
                      onClick={() => {
                        setSelectedDiet(isActive ? "ALL" : dietName);
                        setCurrentPage(1);
                      }}
                    >
                      <div className="diet-info">
                        <span className="diet-label">{dietName}</span>
                        <span className="diet-help">{isActive ? "Filter active" : "View roster"}</span>
                      </div>
                      <div className="diet-val">{count}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Battalion Summary Breakdown */}
      <div className="card animate-fade-in animate-stagger-3">
        <div className="card-title">Battalion Cooking Shares Breakdown</div>
        <p style={{ fontSize: "0.85rem", color: "var(--secondary-light)", marginBottom: "1.25rem" }}>
          Active special diets breakdown per battalion with percentage gauges. Click a category to view the cadet roster in detail.
        </p>
        
        <div className="battalion-summary-grid">
          {["1ST BATTALION", "2ND BATTALION", "3RD BATTALION", "4TH BATTALION"].map((bn) => {
            const totalBnShares = cadets.filter(c => c.battalion === bn).length;
            // Count of cadets with at least 1 diet restriction
            const specialBnShares = cadets.filter(c => c.battalion === bn && Object.values(c.diets).some(v => v === true)).length;
            const percent = totalBnShares > 0 ? Math.round((specialBnShares / totalBnShares) * 100) : 0;

            return (
              <div key={bn} className="battalion-card">
                <h4>{bn}</h4>
                <div className="battalion-shares-count">
                  {specialBnShares} <span>Special Diets ({percent}%)</span>
                </div>
                
                {/* Visual progress bar gauge */}
                <div className="meter-container" title={`${percent}% of ${bn} has dietary restrictions`}>
                  <div className="meter-fill" style={{ width: `${percent}%` }}></div>
                </div>

                <div className="battalion-diet-list">
                  {dietColumns.map((dietName) => {
                    const count = cadets.filter(c => c.battalion === bn && c.diets[dietName] === true).length;
                    if (count === 0) return null;
                    
                    return (
                      <div 
                        key={dietName} 
                        className="battalion-diet-item"
                        onClick={() => openDietModal(bn, dietName)}
                      >
                        <span>{dietName}</span>
                        <span className="badge badge-diet" style={{ fontSize: "0.75rem" }}>{count}</span>
                      </div>
                    );
                  })}
                  {dietColumns.every(d => cadets.filter(c => c.battalion === bn && c.diets[d] === true).length === 0) && (
                    <span style={{ fontSize: "0.8rem", color: "var(--muted)", fontStyle: "italic", textAlign: "center", display: "block" }}>No special diets registered</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Cadet Roster Table */}
      <div className="card animate-fade-in animate-stagger-3">
        <div className="card-title">Cadet Roster Database</div>

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
                  const activeDiets = dietColumns.filter((dName) => c.diets[dName] === true);

                  return (
                    <tr key={c.no + c.name}>
                      <td>{c.no}</td>
                      <td>{c.class}</td>
                      <td style={{ fontWeight: 700, color: "var(--secondary)" }}>{c.name}</td>
                      <td>{c.company}</td>
                      <td style={{ fontSize: "0.75rem", textTransform: "uppercase" }}>{c.battalion}</td>
                      <td>
                        {c.bos !== "N/A" && (
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
                            {c.bos}
                          </span>
                        )}
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
                            <span key={d} className="badge badge-diet" style={{ fontSize: "0.65rem", padding: "1px 6px" }}>
                              {d}
                            </span>
                          ))}
                          {activeDiets.length === 0 && <span style={{ color: "var(--muted)", fontSize: "0.8rem" }}>None</span>}
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
            <span style={{ fontSize: "0.8rem", color: "var(--secondary-light)" }}>
              Page {currentPage} of {totalPages} ({filteredCadets.length} entries matched)
            </span>
            <div style={{ display: "flex", gap: "6px" }}>
              <button
                className="btn btn-outline"
                style={{ padding: "6px 12px", fontSize: "0.75rem" }}
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                Previous
              </button>
              <button
                className="btn btn-outline"
                style={{ padding: "6px 12px", fontSize: "0.75rem" }}
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Diet List Modal */}
      {isModalOpen && mounted && createPortal(
        <div className="modal-backdrop" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{modalTitle}</h3>
              <button className="modal-close-x" onClick={() => setIsModalOpen(false)}>&times;</button>
            </div>
            <div className="modal-body">
              {modalCadets.length > 0 ? (
                <div className="table-container" style={{ maxHeight: "300px", overflowY: "auto" }}>
                  <table style={{ width: "100%" }}>
                    <thead>
                      <tr>
                        <th style={{ padding: "8px 12px", fontSize: "0.75rem" }}>Class</th>
                        <th style={{ padding: "8px 12px", fontSize: "0.75rem" }}>Name</th>
                        <th style={{ padding: "8px 12px", fontSize: "0.75rem" }}>Company</th>
                        <th style={{ padding: "8px 12px", fontSize: "0.75rem" }}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {modalCadets.map((c, idx) => (
                        <tr key={c.name + idx} style={{ borderBottom: "1px solid var(--border-color)" }}>
                          <td style={{ padding: "8px 12px", fontSize: "0.8rem" }}>{c.class}</td>
                          <td style={{ padding: "8px 12px", fontSize: "0.8rem", fontWeight: 700, color: "var(--secondary)" }}>{c.name}</td>
                          <td style={{ padding: "8px 12px", fontSize: "0.8rem" }}>{c.company}</td>
                          <td style={{ padding: "8px 12px", fontSize: "0.8rem" }}>
                            {c.status === "HC" || c.status.includes("HOLDING") ? "HC" : c.status}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p style={{ textAlign: "center", color: "var(--muted)", padding: "1rem" }}>No cadets found for this diet.</p>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-accent" style={{ padding: "8px 16px" }} onClick={() => setIsModalOpen(false)}>Close</button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
