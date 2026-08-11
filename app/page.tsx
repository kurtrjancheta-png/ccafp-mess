"use client";

import React, { useState, useEffect } from "react";
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
  }, []);

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

  const handlePrintSpecialDietReport = () => {
    const getFormattedDateTime = () => {
      const now = new Date();
      const day = String(now.getDate()).padStart(2, '0');
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const monthNames = [
        "JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE",
        "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER"
      ];
      const month = monthNames[now.getMonth()];
      const year = now.getFullYear();
      return `${day} ${hours}${minutes}H ${month} ${year}`;
    };

    const formattedDateTime = getFormattedDateTime();

    const standardCompanies = ["ALFA", "BRAVO", "CHARLIE", "DELTA", "ECHO", "FOXTROT", "GOLF", "HAWK"];
    const uniqueCompanies = Array.from(new Set(cadets.map(c => c.company.toUpperCase())))
      .filter(Boolean)
      .sort((a, b) => {
        const idxA = standardCompanies.indexOf(a);
        const idxB = standardCompanies.indexOf(b);
        if (idxA !== -1 && idxB !== -1) return idxA - idxB;
        if (idxA !== -1) return -1;
        if (idxB !== -1) return 1;
        return a.localeCompare(b);
      });

    const FEMALE_CADETS = new Set([
      "DE MESA", "MALANOT", "FELIPE", "LORICO", "PRACULLOS", "ATIWEN", "BALILI", "ANGOLUAN"
    ]);

    const tablesHtml = uniqueCompanies.map(company => {
      const companyCadets = cadets.filter(c => c.company.toUpperCase() === company);
      
      const dietCadetsMap: { [diet: string]: Cadet[] } = {};
      dietColumns.forEach(diet => {
        dietCadetsMap[diet] = companyCadets.filter(c => c.diets[diet] === true);
      });

      let maxRows = 0;
      dietColumns.forEach(diet => {
        if (dietCadetsMap[diet].length > maxRows) {
          maxRows = dietCadetsMap[diet].length;
        }
      });

      let rowsHtml = "";
      for (let i = 0; i < maxRows; i++) {
        rowsHtml += "<tr>";
        rowsHtml += "<td></td>";
        
        dietColumns.forEach(diet => {
          const cadet = dietCadetsMap[diet][i];
          if (cadet) {
            const isFemale = FEMALE_CADETS.has(cadet.name.toUpperCase());
            const textClass = isFemale ? 'class="female-cadet"' : "";
            rowsHtml += `<td ${textClass}>${cadet.class} ${cadet.name}</td>`;
          } else {
            rowsHtml += "<td></td>";
          }
        });
        rowsHtml += "</tr>";
      }

      let totalRowHtml = "<tr>";
      totalRowHtml += "<td class='total-label'>TOTAL</td>";
      dietColumns.forEach(diet => {
        const count = dietCadetsMap[diet].length;
        totalRowHtml += `<td class="total-val">${count}</td>`;
      });
      totalRowHtml += "</tr>";

      return `
        <div class="company-section">
          <table class="diet-table">
            <thead>
              <tr class="header-row-1">
                <th>${company}</th>
                ${dietColumns.map(diet => `<th>${diet}</th>`).join('')}
              </tr>
              <tr class="header-row-2">
                <th>${company}</th>
                ${dietColumns.map(diet => `<th>${diet}</th>`).join('')}
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
              ${totalRowHtml}
            </tbody>
          </table>
        </div>
      `;
    }).join('');

    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Special Diet Report - CCAFP Mess Council</title>
        <style>
          @media print {
            @page {
              size: landscape;
              margin: 10mm 15mm 15mm 15mm;
            }
            body {
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            .no-print {
              display: none;
            }
          }

          body {
            font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            margin: 0;
            padding: 20px;
            color: #333;
            background-color: #fff;
          }

          .print-header {
            text-align: center;
            margin-bottom: 25px;
            line-height: 1.4;
          }

          .header-title-1 {
            font-size: 14pt;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 1px;
          }

          .header-title-2 {
            font-size: 13pt;
            font-weight: bold;
            text-transform: uppercase;
            margin-top: 2px;
          }

          .header-title-3 {
            font-size: 11pt;
            margin-top: 2px;
          }

          .header-title-4 {
            font-size: 11pt;
            margin-top: 2px;
          }

          .print-datetime {
            text-align: center;
            font-size: 12pt;
            font-weight: bold;
            margin-bottom: 30px;
            letter-spacing: 0.5px;
          }

          .company-section {
            margin-bottom: 40px;
            page-break-after: always;
          }
          
          .company-section:last-child {
            page-break-after: avoid;
          }

          .diet-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 9pt;
            table-layout: fixed;
          }

          .diet-table th, .diet-table td {
            border: 1px solid #ccc;
            padding: 6px 4px;
            text-align: left;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }

          .header-row-1 th {
            background-color: #f2f2f2;
            font-weight: bold;
            text-align: left;
            font-size: 9pt;
          }

          .header-row-2 th {
            background-color: #b6d7a8;
            color: #000;
            font-weight: bold;
            text-align: left;
            font-size: 9pt;
          }

          .header-row-1 th {
            background-color: #f2f2f2 !important;
          }
          .header-row-2 th {
            background-color: #b6d7a8 !important;
          }

          .female-cadet {
            color: #d93025;
            font-weight: 500;
          }

          .total-label {
            font-weight: bold;
            background-color: #f9f9f9;
          }

          .total-val {
            font-weight: bold;
            background-color: #f9f9f9;
            text-align: left;
          }

          .total-label, .total-val {
            background-color: #f9f9f9 !important;
            border-top: 2px solid #333;
            border-bottom: 2px double #333;
          }
        </style>
      </head>
      <body>
        <div class="print-header">
          <div class="header-title-1">Cadet Corps Armed Forces of the Philippines</div>
          <div class="header-title-2">Mess Council</div>
          <div class="header-title-3">Fort General Gregorio H. del Pilar</div>
          <div class="header-title-4">Baguio City</div>
        </div>

        <div class="print-datetime">${formattedDateTime}</div>

        ${tablesHtml}

        <script>
          window.onload = function() {
            window.print();
          }
        </script>
      </body>
      </html>
    `;

    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
    } else {
      alert("Could not open print window. Please disable your pop-up blocker.");
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
      {isModalOpen && (
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
        </div>
      )}
    </div>
  );
}
