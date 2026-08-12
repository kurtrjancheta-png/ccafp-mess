"use client";

import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useAuth } from "../context/AuthContext";

interface Meal {
  viand1: string;
  viand2: string;
  viand3: string;
  viand4: string;
  drink: string;
  rice: string;
}

interface DailyMenu {
  morning: Meal;
  noon: Meal;
  evening: Meal;
  pmSnack: string;
}

interface WeeklyMenuState {
  [day: string]: DailyMenu;
}

interface ViandRecord {
  viand: string;
  diets: { [restriction: string]: boolean }; // true means value in sheet is "1" (restricted)
}

const DEFAULT_MEAL_SLOT: Meal = {
  viand1: "",
  viand2: "",
  viand3: "",
  viand4: "",
  drink: "",
  rice: "",
};

const DEFAULT_WEEKLY_MENU: WeeklyMenuState = {
  Monday: {
    morning: { viand1: "Skinless Longganisa", viand2: "Sunny Side Up Eggs", viand3: "", viand4: "", drink: "Coffee", rice: "Garlic Rice" },
    noon: { viand1: "Sinigang na Baboy", viand2: "Stir-fried Choy Sum", viand3: "", viand4: "", drink: "Water", rice: "Steamed Rice" },
    evening: { viand1: "Chicken Adobo", viand2: "Pinakbet", viand3: "", viand4: "", drink: "Water", rice: "Steamed Rice" },
    pmSnack: "Banana & Milk",
  },
  Tuesday: {
    morning: { viand1: "Beef Tapa", viand2: "Scrambled Eggs with Tomatoes", viand3: "", viand4: "", drink: "Tea", rice: "Sinangag" },
    noon: { viand1: "Tinolang Manok", viand2: "Ginisang Monggo", viand3: "", viand4: "", drink: "Water", rice: "Steamed Rice" },
    evening: { viand1: "Pork Chop in Gravy", viand2: "Buttered Vegetables", viand3: "", viand4: "", drink: "Water", rice: "Steamed Rice" },
    pmSnack: "Apple Slices",
  },
  Wednesday: {
    morning: { viand1: "Tuyo", viand2: "Champorado", viand3: "", viand4: "", drink: "Hot Chocolate", rice: "Garlic Rice" },
    noon: { viand1: "Beef Caldereta", viand2: "Ginisang Baguio Beans", viand3: "", viand4: "", drink: "Water", rice: "Steamed Rice" },
    evening: { viand1: "Sweet and Sour Fish Fillet", viand2: "Chop Suey", viand3: "", viand4: "", drink: "Water", rice: "Steamed Rice" },
    pmSnack: "Orange slices",
  },
  Thursday: {
    morning: { viand1: "Corned Beef with Onions", viand2: "Boiled Eggs", viand3: "", viand4: "", drink: "Coffee", rice: "Garlic Rice" },
    noon: { viand1: "Pork Sinigang", viand2: "Ginisang Repolyo", viand3: "", viand4: "", drink: "Water", rice: "Steamed Rice" },
    evening: { viand1: "Grilled Chicken Breast", viand2: "Sauteed Kangkong", viand3: "", viand4: "", drink: "Water", rice: "Steamed Rice" },
    pmSnack: "Watermelon cubes",
  },
  Friday: {
    morning: { viand1: "Daing na Bangus", viand2: "Fried Eggs", viand3: "", viand4: "", drink: "Tea", rice: "Sinangag" },
    noon: { viand1: "Kare-Kareng Baka", viand2: "Eggplant & Beans", viand3: "", viand4: "", drink: "Water", rice: "Steamed Rice" },
    evening: { viand1: "Chicken Curry", viand2: "Stir-fried Broccoli", viand3: "", viand4: "", drink: "Water", rice: "Steamed Rice" },
    pmSnack: "Gelatin Dessert",
  },
  Saturday: {
    morning: { viand1: "Pork Sausages", viand2: "Scrambled Eggs", viand3: "", viand4: "", drink: "Fruit Juice", rice: "Pancakes" },
    noon: { viand1: "Nilagang Baka", viand2: "Sauteed Sayote", viand3: "", viand4: "", drink: "Water", rice: "Steamed Rice" },
    evening: { viand1: "Beef Broccoli", viand2: "Buttered Corn and Peas", viand3: "", viand4: "", drink: "Water", rice: "Steamed Rice" },
    pmSnack: "Cookies",
  },
  Sunday: {
    morning: { viand1: "Tocino", viand2: "Sunny Side Up Eggs", viand3: "", viand4: "", drink: "Coffee", rice: "Garlic Rice" },
    noon: { viand1: "Lechon Kawali", viand2: "Pinakbet", viand3: "", viand4: "", drink: "Water", rice: "Steamed Rice" },
    evening: { viand1: "Chicken Adobo", viand2: "Tossed Green Salad", viand3: "", viand4: "", drink: "Water", rice: "Steamed Rice" },
    pmSnack: "Ice Cream Cup",
  },
};

const DEFAULT_DIET_COLUMNS = [
  "NO FISH", "NO PORK", "NO SEAFOOD", "NO EGG", "NO CHICKEN", "NO BLOOD", 
  "NO PROCESSED FOOD", "NO BEANS", "NO NUTS", "NO TOFU", "NO COFFEE", 
  "NO CHOCOLATE", "NO TOMATOES", "NO SPICY", "NO BEEF", "NO CITRUS", "NO EGGPLANT", 
  "NO JUICE", "NO COCUMBER", "NO SOUR"
];

export default function MenuPage() {
  const { user } = useAuth();
  const [menu, setMenu] = useState<WeeklyMenuState>(DEFAULT_WEEKLY_MENU);
  const [viandsDb, setViandsDb] = useState<ViandRecord[]>([]);
  const [activeDay, setActiveDay] = useState("Monday");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  
  // Edit Modal States
  const [showEditModal, setShowEditModal] = useState(false);
  const [editMenuState, setEditMenuState] = useState<WeeklyMenuState>(DEFAULT_WEEKLY_MENU);
  const [editActiveDay, setEditActiveDay] = useState("Monday");
  
  // Progressive dietary dictionary (case-insensitive keys mapping to checklist map)
  const [localViandsDiets, setLocalViandsDiets] = useState<{ [viandName: string]: { [restriction: string]: boolean } }>({});
  // Track open status of inline diet editor panels
  const [openDietFields, setOpenDietFields] = useState<{ [fieldId: string]: boolean }>({});
  
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Autocomplete UI States
  const [focusedField, setFocusedField] = useState<{ day: string; meal: "morning" | "noon" | "evening" | "pmSnack"; field: string } | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);

  useEffect(() => {
    fetchMenuAndViands();

    // Default to current day
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const todayName = days[new Date().getDay()];
    if (DEFAULT_WEEKLY_MENU[todayName]) {
      setActiveDay(todayName);
    }
  }, []);

  // Simple CSV parser
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
        lines.push(row);
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
      lines.push(row);
    }
    return lines;
  };

  const fetchMenuAndViands = async () => {
    setLoading(true);
    setLoadError(null);
    setSaveError(null);
    const sheetId = process.env.NEXT_PUBLIC_SPREADSHEET_ID || "14dSYE1ntxNrnBdgSn-mWU5z-GMHK7qdMcKFchgh0pAQ";
    const menuGid = "143586769";
    const viandsGid = "166151731";

    const menuUrl = `/api/sheet-csv?gid=${menuGid}`;
    const viandsUrl = `/api/sheet-csv?gid=${viandsGid}`;

    const clientController = new AbortController();
    const timeoutId = setTimeout(() => clientController.abort(), 8000);

    try {
      // 1. Fetch Viands Database first for lookups
      const viandsRes = await fetch(viandsUrl, { signal: clientController.signal });
      let parsedViands: ViandRecord[] = [];
      const initialDiets: { [viand: string]: { [d: string]: boolean } } = {};
      
      if (viandsRes.ok) {
        const csvText = await viandsRes.text();
        const rows = parseCSV(csvText);
        if (rows.length >= 1) {
          const headers = rows[0].map(h => h.trim().toUpperCase());
          for (let i = 1; i < rows.length; i++) {
            const row = rows[i];
            if (!row[0]) continue;
            const dietsMap: { [restriction: string]: boolean } = {};
            headers.forEach((header, index) => {
              if (index === 0) return;
              dietsMap[header] = row[index] === "1";
            });
            parsedViands.push({
              viand: row[0],
              diets: dietsMap
            });
            initialDiets[row[0].toUpperCase().trim()] = dietsMap;
          }
        }
      }
      setViandsDb(parsedViands);
      setLocalViandsDiets(initialDiets);

      // 2. Fetch Weekly Menu
      const menuRes = await fetch(menuUrl, { signal: clientController.signal });
      if (!menuRes.ok) {
        throw new Error("Unable to fetch menu spreadsheet GID 143586769");
      }
      const menuCsvText = await menuRes.ok ? await menuRes.text() : "";
      const menuRows = parseCSV(menuCsvText);
      
      if (menuRows.length >= 26) {
        const parsedMenuState: WeeklyMenuState = {};
        const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
        
        days.forEach((day, index) => {
          const colIdx = index + 1; // days start from column B (index 1)
          const getVal = (rowIdx: number) => {
            return (menuRows[rowIdx] && menuRows[rowIdx][colIdx]) ? menuRows[rowIdx][colIdx].trim() : "";
          };
          
          parsedMenuState[day] = {
            morning: {
              viand1: getVal(2),
              viand2: getVal(3),
              viand3: getVal(4),
              viand4: getVal(5),
              drink: getVal(6),
              rice: getVal(7),
            },
            noon: {
              viand1: getVal(10),
              viand2: getVal(11),
              viand3: getVal(12),
              viand4: getVal(13),
              drink: getVal(14),
              rice: getVal(15),
            },
            evening: {
              viand1: getVal(18),
              viand2: getVal(19),
              viand3: getVal(20),
              viand4: getVal(21),
              drink: getVal(22),
              rice: getVal(23),
            },
            pmSnack: getVal(25),
          };
        });
        setMenu(parsedMenuState);
        setEditMenuState(parsedMenuState);
      } else {
        throw new Error("Google Sheets weekly menu layout is invalid (expected 26 rows).");
      }
    } catch (err: any) {
      console.warn("Failed to load live menu details:", err.message);
      let errMsg = err.message || "Unable to retrieve weekly menu data from Google Sheets.";
      if (errMsg.includes("Failed to fetch")) {
        errMsg = "Failed to communicate with Google Sheets. Please ensure your spreadsheet is shared and you have configured the environment variables on the server.";
      }
      setLoadError(errMsg);
      setMenu({});
      setEditMenuState({});
    } finally {
      clearTimeout(timeoutId);
      setLoading(false);
    }
  };

  // Maps database GID restriction columns to UI display text
  const getDietWarnings = (viandName: string): string[] => {
    if (!viandName) return [];
    const cleanViand = viandName.trim().toUpperCase();
    const record = viandsDb.find(v => v.viand.toUpperCase().trim() === cleanViand);
    if (!record) {
      return getStaticWarnings(viandName);
    }

    const warnings: string[] = [];
    Object.keys(record.diets).forEach(restriction => {
      if (record.diets[restriction]) {
        warnings.push(formatDietName(restriction));
      }
    });
    return warnings;
  };

  const getLocalDietDiets = (viandName: string): { [d: string]: boolean } => {
    if (!viandName) return {};
    const key = viandName.toUpperCase().trim();
    return localViandsDiets[key] || {};
  };

  const getLocalDietWarnings = (viandName: string): string[] => {
    if (!viandName) return [];
    const key = viandName.toUpperCase().trim();
    const diets = localViandsDiets[key];
    if (!diets) {
      // Static scanning fallback for new items
      return getStaticWarnings(viandName);
    }

    const warnings: string[] = [];
    Object.keys(diets).forEach(col => {
      if (diets[col]) {
        warnings.push(formatDietName(col));
      }
    });
    return warnings;
  };

  const formatDietName = (colName: string): string => {
    const clean = colName.toUpperCase().trim();
    if (clean.startsWith("NO ")) {
      const ingredient = clean.substring(3).toLowerCase();
      if (ingredient === "food processed food" || ingredient === "processed food") return "Processed Food";
      if (ingredient === "cocumber") return "Cucumber";
      return ingredient.split(" ").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
    }
    return colName;
  };

  const getStaticWarnings = (mealText: string): string[] => {
    const warnings: string[] = [];
    const text = mealText.toUpperCase();
    
    if (text.includes("PORK") || text.includes("BABOY") || text.includes("LONGGANISA") || text.includes("TOCINO") || text.includes("SAUSAGES") || text.includes("LECHON")) warnings.push("Pork");
    if (text.includes("BEEF") || text.includes("BAKA") || text.includes("TAPA")) warnings.push("Beef");
    if (text.includes("FISH") || text.includes("BANGUS") || text.includes("TUYO")) warnings.push("Fish");
    if (text.includes("SEAFOOD") || text.includes("SHRIMP") || text.includes("PRAWN") || text.includes("CRAB") || text.includes("OYSTER") || text.includes("BAGOONG")) warnings.push("Seafood");
    if (text.includes("EGG") || text.includes("EGGS")) warnings.push("Egg");
    if (text.includes("CHICKEN") || text.includes("MANOK")) warnings.push("Chicken");
    if (text.includes("BEAN") || text.includes("BEANS") || text.includes("MONGGO")) warnings.push("Beans");
    if (text.includes("NUT") || text.includes("NUTS") || text.includes("PEANUT") || text.includes("KARE-KARE")) warnings.push("Nuts");
    if (text.includes("TOFU") || text.includes("TOKWA")) warnings.push("Tofu");
    if (text.includes("COFFEE")) warnings.push("Coffee");
    if (text.includes("CHOCOLATE") || text.includes("CHAMPORADO")) warnings.push("Chocolate");
    if (text.includes("TOMATO") || text.includes("TOMATOES") || text.includes("CALDERETA")) warnings.push("Tomatoes");
    if (text.includes("SPICY") || text.includes("CURRY")) warnings.push("Spicy");
    
    return warnings;
  };

  // Autocomplete suggestions
  const handleInputChange = (
    day: string,
    meal: "morning" | "noon" | "evening" | "pmSnack",
    field: string,
    value: string
  ) => {
    setEditMenuState(prev => {
      const next = { ...prev };
      if (meal === "pmSnack") {
        next[day].pmSnack = value;
      } else {
        next[day][meal] = {
          ...next[day][meal],
          [field]: value
        };
      }
      return next;
    });

    if (value && value.trim()) {
      const key = value.toUpperCase().trim();
      if (!localViandsDiets[key]) {
        // Pre-configure initial diets using smart static scanning guess to save effort!
        const staticGuess = getStaticWarnings(value);
        const newDietSettings: { [d: string]: boolean } = {};
        DEFAULT_DIET_COLUMNS.forEach(col => {
          const formatted = formatDietName(col).toUpperCase();
          newDietSettings[col] = staticGuess.some(w => w.toUpperCase() === formatted);
        });
        setLocalViandsDiets(prev => ({
          ...prev,
          [key]: newDietSettings
        }));
      }
    }

    if (!value || value.trim().length < 1) {
      setSuggestions([]);
      return;
    }

    const cleanInput = value.toLowerCase().trim();
    const matches = viandsDb
      .filter(v => v.viand.toLowerCase().includes(cleanInput))
      .map(v => v.viand)
      .slice(0, 5);

    setSuggestions(matches);
  };

  const selectSuggestion = (
    day: string,
    meal: "morning" | "noon" | "evening" | "pmSnack",
    field: string,
    value: string
  ) => {
    setEditMenuState(prev => {
      const next = { ...prev };
      if (meal === "pmSnack") {
        next[day].pmSnack = value;
      } else {
        next[day][meal] = {
          ...next[day][meal],
          [field]: value
        };
      }
      return next;
    });
    setSuggestions([]);
    setFocusedField(null);
  };

  // Toggles active restriction on local state
  const toggleViandDiet = (viandName: string, restrictionName: string) => {
    if (!viandName) return;
    const key = viandName.toUpperCase().trim();
    setLocalViandsDiets(prev => {
      const current = prev[key] || {};
      const next = { ...current };
      
      // Initialize blank states if completely empty
      if (Object.keys(next).length === 0) {
        DEFAULT_DIET_COLUMNS.forEach(col => {
          next[col] = false;
        });
      }
      next[restrictionName] = !next[restrictionName];
      return {
        ...prev,
        [key]: next
      };
    });
  };

  // Convert state back to 2D Array matching sheets cells
  const constructMenuCSVRows = (weeklyMenu: WeeklyMenuState): string[][] => {
    const rows: string[][] = Array.from({ length: 26 }, () => Array(8).fill(""));
    
    rows[0] = ["", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"];
    
    rows[1][0] = "MORNING MESS";
    rows[2][0] = "1ST VIAND";
    rows[3][0] = "2ND VIAND";
    rows[4][0] = "3RD VIAND";
    rows[5][0] = "4TH VIAND";
    rows[6][0] = "DRINK";
    rows[7][0] = "RICE";
    
    rows[8][0] = "";
    
    rows[9][0] = "NOON MESS";
    rows[10][0] = "1ST VIAND";
    rows[11][0] = "2ND VIAND";
    rows[12][0] = "3RD VIAND";
    rows[13][0] = "4TH VIAND";
    rows[14][0] = "DRINK";
    rows[15][0] = "RICE";
    
    rows[16][0] = "";
    
    rows[17][0] = "EVENING MESS";
    rows[18][0] = "1ST VIAND";
    rows[19][0] = "2ND VIAND";
    rows[20][0] = "3RD VIAND";
    rows[21][0] = "4TH VIAND";
    rows[22][0] = "DRINK";
    rows[23][0] = "RICE";
    
    rows[24][0] = "";
    rows[25][0] = "PM SNACK";

    const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
    days.forEach((day, index) => {
      const colIdx = index + 1;
      const d = weeklyMenu[day];
      
      rows[2][colIdx] = d.morning.viand1 || "";
      rows[3][colIdx] = d.morning.viand2 || "";
      rows[4][colIdx] = d.morning.viand3 || "";
      rows[5][colIdx] = d.morning.viand4 || "";
      rows[6][colIdx] = d.morning.drink || "";
      rows[7][colIdx] = d.morning.rice || "";
      
      rows[10][colIdx] = d.noon.viand1 || "";
      rows[11][colIdx] = d.noon.viand2 || "";
      rows[12][colIdx] = d.noon.viand3 || "";
      rows[13][colIdx] = d.noon.viand4 || "";
      rows[14][colIdx] = d.noon.drink || "";
      rows[15][colIdx] = d.noon.rice || "";
      
      rows[18][colIdx] = d.evening.viand1 || "";
      rows[19][colIdx] = d.evening.viand2 || "";
      rows[20][colIdx] = d.evening.viand3 || "";
      rows[21][colIdx] = d.evening.viand4 || "";
      rows[22][colIdx] = d.evening.drink || "";
      rows[23][colIdx] = d.evening.rice || "";
      
      rows[25][colIdx] = d.pmSnack || "";
    });

    return rows;
  };

  const handleSaveMenu = async () => {
    // 1. Gather all unique entered viands
    const enteredViands = new Set<string>();
    const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
    
    days.forEach(day => {
      const d = editMenuState[day];
      [d.morning, d.noon, d.evening].forEach(meal => {
        if (meal.viand1) enteredViands.add(meal.viand1.trim());
        if (meal.viand2) enteredViands.add(meal.viand2.trim());
        if (meal.viand3) enteredViands.add(meal.viand3.trim());
        if (meal.viand4) enteredViands.add(meal.viand4.trim());
        if (meal.drink) enteredViands.add(meal.drink.trim());
        if (meal.rice) enteredViands.add(meal.rice.trim());
      });
      if (d.pmSnack) enteredViands.add(d.pmSnack.trim());
    });

    // 2. Prepare payload list mapping key values
    const viandsToSave: { viand: string; diets: { [col: string]: number } }[] = [];
    enteredViands.forEach(v => {
      const key = v.toUpperCase().trim();
      if (key === "STEAMED RICE" || key === "GARLIC RICE" || key === "WATER" || !v) return;
      
      const diets = localViandsDiets[key] || {};
      const sheetDiets: { [col: string]: number } = {};
      DEFAULT_DIET_COLUMNS.forEach(col => {
        sheetDiets[col] = diets[col] ? 1 : 0;
      });
      viandsToSave.push({
        viand: v,
        diets: sheetDiets
      });
    });

    setSaving(true);
    setSaveError(null);
    setSuccessMsg(null);

    const rows = constructMenuCSVRows(editMenuState);
    const payload = {
      action: "saveWeeklyMenuAndViands",
      rows: rows,
      viands: viandsToSave
    };

    try {
      const response = await fetch("/api/apps-script", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        // Parse error message if possible
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `Apps Script responded with status: ${response.status}`);
      }

      const resJson = await response.json();
      if (resJson.success) {
        setSuccessMsg("Weekly Menu and progressive Viands Database saved successfully!");
        setShowEditModal(false);
        setOpenDietFields({}); // Reset open panels
        fetchMenuAndViands(); // Reload fresh state
        setTimeout(() => setSuccessMsg(null), 5000);
      } else {
        throw new Error(resJson.error || "Failed to commit weekly menu changes.");
      }
    } catch (err: any) {
      console.error("Failed saving weekly menu details:", err);
      setSaveError(`Failed to save weekly menu: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  // Closes suggestions on click outside
  useEffect(() => {
    const clickOutside = () => {
      setSuggestions([]);
    };
    window.addEventListener("click", clickOutside);
    return () => window.removeEventListener("click", clickOutside);
  }, []);

  const currentMeals = menu[activeDay];

  // Helper to render lists of items in view cards
  const renderMealItems = (meal: Meal) => {
    const items = [
      { label: "1st Viand", val: meal.viand1 },
      { label: "2nd Viand", val: meal.viand2 },
      { label: "3rd Viand", val: meal.viand3 },
      { label: "4th Viand", val: meal.viand4 },
      { label: "Drink", val: meal.drink },
      { label: "Rice Option", val: meal.rice },
    ].filter(i => i.val);

    if (items.length === 0) {
      return <p style={{ color: "var(--muted)", fontStyle: "italic" }}>No menu items posted.</p>;
    }

    return (
      <ul style={{ listStyle: "none", padding: 0, margin: "1rem 0 0 0", display: "flex", flexDirection: "column", gap: "10px" }}>
        {items.map((item, idx) => {
          const warnings = getDietWarnings(item.val);
          return (
            <li key={idx} style={{ display: "flex", flexDirection: "column", borderBottom: idx < items.length - 1 ? "1.2px solid var(--border-color)" : "none", paddingBottom: "8px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "10px" }}>
                <span style={{ fontWeight: 600, fontSize: "0.95rem", color: "var(--secondary)" }}>{item.val}</span>
                <span style={{ fontSize: "0.65rem", color: "var(--muted)", textTransform: "uppercase", fontWeight: 700 }}>{item.label}</span>
              </div>
              
              {/* Warnings Row */}
              {warnings.length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", marginTop: "4px" }}>
                  {warnings.map(w => (
                    <span key={w} className="badge badge-diet" style={{ fontSize: "0.55rem", padding: "1px 6px" }}>
                      ⚠️ Contains {w}
                    </span>
                  ))}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    );
  };

  // Helper to render editable input block with inline tag checklist
  const renderEditField = (
    meal: "morning" | "noon" | "evening" | "pmSnack",
    field: string,
    label: string
  ) => {
    const fKey = field as keyof Meal;
    const val = meal === "pmSnack" ? editMenuState[editActiveDay].pmSnack : editMenuState[editActiveDay][meal][fKey] || "";
    const uniqueId = `${meal}-${field}`;
    const fieldId = `${meal}-${field}`;
    const isOpen = !!openDietFields[fieldId];
    const warnings = getLocalDietWarnings(val);
    const diets = getLocalDietDiets(val);

    return (
      <div key={field} className="form-group autocomplete-wrapper" style={{ margin: 0, position: "relative" }}>
        <label htmlFor={uniqueId} style={{ fontSize: "0.65rem", color: "var(--muted)" }}>{label}</label>
        
        <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
          <input
            id={uniqueId}
            type="text"
            className="input-field"
            style={{ padding: "8px 10px", fontSize: "0.8rem", flexGrow: 1 }}
            value={val}
            autoComplete="off"
            onFocus={() => setFocusedField({ day: editActiveDay, meal, field })}
            onChange={(e) => handleInputChange(editActiveDay, meal, field, e.target.value)}
          />
          
          {val.trim() && (
            <button
              type="button"
              className={`diet-toggle-btn ${isOpen ? "active" : ""}`}
              style={{
                padding: "6px 8px",
                borderRadius: "6px",
                border: "1.2px solid var(--border-color)",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: isOpen ? "var(--primary)" : "var(--background)",
                color: isOpen ? "white" : "var(--muted)",
                transition: "all 0.15s",
                height: "36px",
                width: "36px",
                flexShrink: 0
              }}
              onClick={() => setOpenDietFields(prev => ({ ...prev, [fieldId]: !prev[fieldId] }))}
              title="Edit Dietary warnings for this item"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ width: "16px", height: "16px" }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </button>
          )}
        </div>

        {/* Autocomplete Suggestions dropdown */}
        {focusedField?.day === editActiveDay && 
         focusedField?.meal === meal && 
         focusedField?.field === field && 
         suggestions.length > 0 && (
          <ul className="suggestion-dropdown">
            {suggestions.map(sug => (
              <li 
                key={sug} 
                className="suggestion-item"
                onMouseDown={() => {
                  selectSuggestion(editActiveDay, meal, field, sug);
                  const matched = viandsDb.find(v => v.viand === sug);
                  if (matched) {
                    setLocalViandsDiets(prev => ({
                      ...prev,
                      [sug.toUpperCase().trim()]: matched.diets
                    }));
                  }
                }}
              >
                {sug}
              </li>
            ))}
          </ul>
        )}

        {/* Active tags badges summary */}
        {val.trim() && warnings.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: "2px", marginTop: "4px" }}>
            {warnings.map(w => (
              <span key={w} className="badge badge-diet" style={{ fontSize: "0.52rem", padding: "0.5px 5px", textTransform: "uppercase", fontWeight: 700 }}>
                {w}
              </span>
            ))}
          </div>
        )}

        {/* Inline Collapsible Tag Editor */}
        {val.trim() && isOpen && (
          <div 
            className="animate-fade-in" 
            style={{ 
              marginTop: "8px", 
              padding: "10px", 
              border: "1.2px solid var(--primary-light)", 
              borderRadius: "10px", 
              backgroundColor: "var(--card-bg)",
              boxShadow: "0 4px 12px rgba(0, 0, 0, 0.05)",
              zIndex: 5,
              position: "relative"
            }}
          >
            <span style={{ fontSize: "0.6rem", fontWeight: 800, color: "var(--primary)", textTransform: "uppercase", display: "block", marginBottom: "6px" }}>
              Select Ingredients Contained:
            </span>
            <div className="viand-pills-container" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(75px, 1fr))", gap: "4px" }}>
              {DEFAULT_DIET_COLUMNS.map((col) => {
                const cleanName = formatDietName(col);
                const isPillActive = !!diets[col];
                return (
                  <div
                    key={col}
                    className={`viand-pill ${isPillActive ? "active" : "inactive"}`}
                    style={{
                      padding: "3px 5px",
                      fontSize: "0.58rem",
                      borderRadius: "10px",
                      cursor: "pointer",
                      textAlign: "center",
                      textOverflow: "ellipsis",
                      overflow: "hidden"
                    }}
                    onClick={() => toggleViandDiet(val, col)}
                    title={`Contains ${cleanName}`}
                  >
                    {cleanName}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="animate-fade-in" style={{ position: "relative" }}>
      {/* Dynamic Style Injection for Modals and Input Fields */}
      <style dangerouslySetInnerHTML={{ __html: `
        .edit-menu-btn {
          background-color: var(--primary);
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 700;
          font-size: 0.8rem;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          box-shadow: 0 4px 6px var(--primary-glow);
          transition: background-color 0.2s, transform 0.1s;
        }
        .edit-menu-btn:hover {
          background-color: var(--primary-dark);
        }
        .edit-menu-btn:active {
          transform: scale(0.97);
        }
        .modal-fullscreen {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(15, 23, 42, 0.4);
          backdrop-filter: blur(12px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 20px;
        }
        .modal-card-workspace {
          background-color: var(--card-bg);
          border: 1px solid var(--border-color);
          border-radius: 16px;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
          width: 100%;
          max-width: 950px;
          height: 90%;
          max-height: 780px;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          animation: modalFadeIn 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .workspace-header {
          padding: 1.25rem 1.5rem;
          border-bottom: 1.5px solid var(--border-color);
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .workspace-body {
          flex-grow: 1;
          display: flex;
          overflow: hidden;
        }
        .workspace-sidebar {
          width: 160px;
          border-right: 1.5px solid var(--border-color);
          background-color: var(--background);
          overflow-y: auto;
          display: flex;
          flex-direction: column;
        }
        .sidebar-day-tab {
          padding: 14px 18px;
          font-weight: 700;
          font-size: 0.85rem;
          color: var(--muted);
          cursor: pointer;
          border-left: 3px solid transparent;
          transition: all 0.2s;
        }
        .sidebar-day-tab:hover {
          color: var(--secondary);
          background-color: var(--border-color);
        }
        .sidebar-day-tab.active {
          color: var(--primary);
          background-color: var(--primary-light);
          border-left-color: var(--primary);
        }
        .workspace-fields-panel {
          flex-grow: 1;
          padding: 1.5rem;
          overflow-y: auto;
          background-color: var(--card-bg);
        }
        .meal-section-group {
          margin-bottom: 1.75rem;
          border: 1px solid var(--border-color);
          border-radius: 12px;
          padding: 1.25rem;
          background-color: var(--background);
        }
        .meal-section-title {
          font-size: 0.8rem;
          font-weight: 800;
          color: var(--primary);
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 1rem;
          border-bottom: 1px dashed var(--border-color);
          padding-bottom: 6px;
        }
        .fields-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 16px;
        }
        .autocomplete-wrapper {
          position: relative;
        }
        .suggestion-dropdown {
          position: absolute;
          top: 100%;
          left: 0;
          right: 0;
          background-color: var(--card-bg);
          border: 1.5px solid var(--primary-light);
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          z-index: 1010;
          max-height: 180px;
          overflow-y: auto;
          list-style: none;
          padding: 0;
          margin: 4px 0 0 0;
        }
        .suggestion-item {
          padding: 8px 12px;
          font-size: 0.8rem;
          font-weight: 600;
          color: var(--secondary);
          cursor: pointer;
          transition: background-color 0.1s;
        }
        .suggestion-item:hover {
          background-color: var(--primary-light);
          color: var(--primary);
        }
        .viand-pills-container {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(110px, 1fr));
          gap: 6px;
          margin-top: 10px;
        }
        .viand-pill {
          padding: 6px 10px;
          font-size: 0.7rem;
          font-weight: 700;
          border-radius: 20px;
          cursor: pointer;
          border: 1.2px solid var(--border-color);
          text-align: center;
          transition: all 0.15s;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .viand-pill.inactive {
          background-color: var(--background);
          color: var(--muted);
        }
        .viand-pill.active {
          background-color: var(--primary);
          color: white;
          border-color: var(--primary);
          box-shadow: 0 2px 4px var(--primary-glow);
        }
      ` }} />

      <header className="page-header">
        <div className="page-title">
          <h2>Weekly Menu Board</h2>
          <p>
            Dynamic meal plans, nutrition database, and dietary warning disclosures for the Cadet Corps.
            Source:{" "}
            <span style={{ fontWeight: 700, color: loadError ? "var(--primary)" : "var(--success)" }}>
              {loadError ? "Offline Local" : "Live Google Sheets"}
            </span>
          </p>
        </div>

        <div className="header-actions" style={{ display: "flex", gap: "10px" }}>
          {user && user.role === "RMESSO" && (
            <button 
              className="edit-menu-btn" 
              onClick={() => {
                setEditMenuState({ ...menu });
                setShowEditModal(true);
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ width: "16px", height: "16px" }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              <span>Edit Weekly Menu</span>
            </button>
          )}
        </div>
      </header>

      {/* Success Notification Banner */}
      {successMsg && (
        <div className="alert-success animate-fade-in" style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "1.5rem" }}>
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ width: "18px", height: "18px" }}>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{successMsg}</span>
        </div>
      )}

      {/* Save Error Banner */}
      {saveError && (
        <div className="alert-success animate-fade-in" style={{ backgroundColor: "#FFE4E6", border: "1px solid #F43F5E", color: "#BE123C", marginBottom: "1.5rem" }}>
          ⚠️ <strong>Notice:</strong> {saveError}
        </div>
      )}

      {loadError ? (
        <div className="card animate-fade-in" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "350px", textAlign: "center", padding: "2.5rem" }}>
          <div style={{ backgroundColor: "#FFE4E6", color: "#F43F5E", borderRadius: "50%", width: "64px", height: "64px", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "1.5rem", fontSize: "1.75rem", boxShadow: "0 4px 10px rgba(244, 63, 94, 0.15)" }}>
            ⚠️
          </div>
          <h3 style={{ fontSize: "1.4rem", fontWeight: 700, color: "var(--text-color)", marginBottom: "0.5rem" }}>Unable to Sync Weekly Menu</h3>
          <p style={{ color: "var(--muted)", maxWidth: "450px", fontSize: "0.925rem", lineHeight: "1.5", marginBottom: "1.75rem" }}>
            {loadError}
          </p>
          <button 
            onClick={fetchMenuAndViands}
            className="edit-menu-btn"
            style={{ display: "flex", alignItems: "center", gap: "8px", padding: "0.75rem 1.5rem", borderRadius: "8px", fontWeight: "bold", border: "1px solid var(--primary)", color: "var(--primary)", background: "transparent", cursor: "pointer" }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" style={{ width: "16px", height: "16px" }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
            </svg>
            <span>Retry Connection</span>
          </button>
        </div>
      ) : loading ? (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "300px" }}>
          <svg className="animate-spin" style={{ width: "40px", height: "40px", color: "var(--primary)", marginBottom: "1rem" }} fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <span style={{ fontSize: "0.9rem", color: "var(--muted)" }}>Loading weekly menu from spreadsheet...</span>
        </div>
      ) : (
        <div className="card animate-fade-in">
          <div className="card-title">Select Day to View</div>
          
          {/* Day of Week Tab bar */}
          <div className="menu-tab-bar">
            {Object.keys(menu).map((day) => {
              const isToday = new Date().toLocaleDateString("en-US", { weekday: "long" }) === day;
              return (
                <div
                  key={day}
                  className={`menu-tab ${activeDay === day ? "active" : ""}`}
                  onClick={() => setActiveDay(day)}
                >
                  <span className="day-name">{day}</span>
                  <span className="day-sub">{isToday ? "Today" : "Rotation"}</span>
                </div>
              );
            })}
          </div>

          {/* Meals Grid Cards */}
          <div className="selected-day-container animate-fade-in" key={activeDay}>
            {/* Breakfast Card */}
            <div className="meal-card breakfast animate-fade-in animate-stagger-1" style={{ minHeight: "220px" }}>
              <h4 style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span>Morning Mess</span>
                <span style={{ fontSize: "0.7rem", color: "var(--muted)", textTransform: "uppercase", fontWeight: 700 }}>0600H</span>
              </h4>
              {renderMealItems(currentMeals.morning)}
            </div>

            {/* Lunch Card */}
            <div className="meal-card lunch animate-fade-in animate-stagger-2" style={{ minHeight: "220px" }}>
              <h4 style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span>Noon Mess</span>
                <span style={{ fontSize: "0.7rem", color: "var(--muted)", textTransform: "uppercase", fontWeight: 700 }}>1200H</span>
              </h4>
              {renderMealItems(currentMeals.noon)}
            </div>

            {/* Dinner Card */}
            <div className="meal-card dinner animate-fade-in animate-stagger-3" style={{ minHeight: "220px" }}>
              <h4 style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span>Evening Mess</span>
                <span style={{ fontSize: "0.7rem", color: "var(--muted)", textTransform: "uppercase", fontWeight: 700 }}>1800H</span>
              </h4>
              {renderMealItems(currentMeals.evening)}
            </div>

            {/* PM Snack Card */}
            <div className="meal-card breakfast animate-fade-in animate-stagger-4" style={{ minHeight: "150px" }}>
              <h4 style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span>PM Snack</span>
                <span style={{ fontSize: "0.7rem", color: "var(--muted)", textTransform: "uppercase", fontWeight: 700 }}>1500H</span>
              </h4>
              
              {currentMeals.pmSnack ? (
                <div style={{ marginTop: "1rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontWeight: 600, fontSize: "0.95rem", color: "var(--secondary)" }}>{currentMeals.pmSnack}</span>
                  </div>
                  {getDietWarnings(currentMeals.pmSnack).length > 0 && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", marginTop: "6px" }}>
                      {getDietWarnings(currentMeals.pmSnack).map(w => (
                        <span key={w} className="badge badge-diet" style={{ fontSize: "0.55rem", padding: "1px 6px" }}>
                          ⚠️ Contains {w}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <p style={{ color: "var(--muted)", fontStyle: "italic", marginTop: "1rem" }}>No snack posted.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Warnings Protocol Info */}
      <div className="card animate-fade-in animate-stagger-2" style={{ backgroundColor: "var(--accent-light)", borderColor: "var(--accent)", marginTop: "2rem" }}>
        <h4 style={{ color: "#7D5B18", marginBottom: "0.5rem" }}>CCAFP Dietary Warnings Protocol</h4>
        <p style={{ fontSize: "0.85rem", color: "#8E6B20" }}>
          Allergen warnings are loaded directly from the progressive **Viands Repository Database** updated by the Regimental Mess Officer (RMESSO). Cadets with verified medical tags matching any active warning badges will automatically be scheduled for alternative menus.
        </p>
      </div>

      {/* WORKSPACE MODAL (EDIT CELL VALUES & INLINE DIETARY TOGGLES) */}
      {showEditModal && createPortal(
        <div className="modal-fullscreen" onClick={() => setShowEditModal(false)}>
          <div className="modal-card-workspace" onClick={(e) => e.stopPropagation()}>
            <div className="workspace-header">
              <div>
                <h3 style={{ margin: 0, fontSize: "1.1rem", color: "var(--secondary)" }}>Edit Weekly Menu Board</h3>
                <span style={{ fontSize: "0.75rem", color: "var(--muted)" }}>RMESSO Administration Workspace (Dietary options configured per food item)</span>
              </div>
              <button 
                onClick={() => {
                  setShowEditModal(false);
                  setOpenDietFields({});
                }}
                style={{ background: "none", border: "none", fontSize: "1.5rem", cursor: "pointer", color: "var(--muted)" }}
              >
                &times;
              </button>
            </div>

            <div className="workspace-body">
              {/* Workspace Sidebar Tabs (Days) */}
              <div className="workspace-sidebar">
                {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map(day => (
                  <div
                    key={day}
                    className={`sidebar-day-tab ${editActiveDay === day ? "active" : ""}`}
                    onClick={() => setEditActiveDay(day)}
                  >
                    {day}
                  </div>
                ))}
              </div>

              {/* Workspace Inputs Panel */}
              <div className="workspace-fields-panel">
                <div style={{ marginBottom: "1rem" }}>
                  <h4 style={{ margin: 0, fontSize: "1.05rem", color: "var(--secondary)" }}>Editing Plan for {editActiveDay}</h4>
                  <span style={{ fontSize: "0.7rem", color: "var(--muted)" }}>
                    Type the name of food items. Click the warning shield icon next to each field to configure ingredients.
                  </span>
                </div>

                {/* MORNING MESS */}
                <div className="meal-section-group">
                  <div className="meal-section-title">Morning Mess (Breakfast)</div>
                  <div className="fields-grid">
                    {["viand1", "viand2", "viand3", "viand4", "drink", "rice"].map((field) => {
                      const label = field.toUpperCase().replace("VIAND", "VIAND ").replace("RICE", "RICE/CARB");
                      return renderEditField("morning", field, label);
                    })}
                  </div>
                </div>

                {/* NOON MESS */}
                <div className="meal-section-group">
                  <div className="meal-section-title">Noon Mess (Lunch)</div>
                  <div className="fields-grid">
                    {["viand1", "viand2", "viand3", "viand4", "drink", "rice"].map((field) => {
                      const label = field.toUpperCase().replace("VIAND", "VIAND ").replace("RICE", "RICE/CARB");
                      return renderEditField("noon", field, label);
                    })}
                  </div>
                </div>

                {/* EVENING MESS */}
                <div className="meal-section-group">
                  <div className="meal-section-title">Evening Mess (Dinner)</div>
                  <div className="fields-grid">
                    {["viand1", "viand2", "viand3", "viand4", "drink", "rice"].map((field) => {
                      const label = field.toUpperCase().replace("VIAND", "VIAND ").replace("RICE", "RICE/CARB");
                      return renderEditField("evening", field, label);
                    })}
                  </div>
                </div>

                {/* PM SNACK */}
                <div className="meal-section-group">
                  <div className="meal-section-title">PM Snack</div>
                  {renderEditField("pmSnack", "pmSnack", "SNACK ITEM")}
                </div>
              </div>
            </div>

            <div className="modal-footer" style={{ borderTop: "1.5px solid var(--border-color)", padding: "1rem 1.5rem" }}>
              <button 
                type="button" 
                className="btn btn-outline" 
                onClick={() => {
                  setShowEditModal(false);
                  setOpenDietFields({});
                }}
                style={{ marginRight: "10px" }}
              >
                Cancel
              </button>
              <button 
                type="button" 
                className="btn btn-primary"
                onClick={handleSaveMenu}
                disabled={saving}
              >
                {saving ? "Saving Changes..." : "Save Weekly Menu"}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
