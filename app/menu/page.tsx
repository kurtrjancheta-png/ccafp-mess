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
  const [error, setError] = useState<string | null>(null);
  
  // Edit Modal States
  const [showEditModal, setShowEditModal] = useState(false);
  const [editMenuState, setEditMenuState] = useState<WeeklyMenuState>(DEFAULT_WEEKLY_MENU);
  const [editActiveDay, setEditActiveDay] = useState("Monday");
  
  // Step-2 Modal Configuration for New Viands
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [newViandsToConfig, setNewViandsToConfig] = useState<{ viand: string; diets: { [d: string]: boolean } }[]>([]);
  
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Autocomplete UI States
  const [focusedField, setFocusedField] = useState<{ day: string; meal: "morning" | "noon" | "evening" | "pmSnack"; field: string } | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const activeInputRef = useRef<HTMLInputElement | null>(null);

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

  const fetchMenuAndViands = async () => {
    setLoading(true);
    setError(null);
    const sheetId = process.env.NEXT_PUBLIC_SPREADSHEET_ID || "14dSYE1ntxNrnBdgSn-mWU5z-GMHK7qdMcKFchgh0pAQ";
    const menuGid = "143586769";
    const viandsGid = "166151731";

    const menuUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${menuGid}&t=${Date.now()}`;
    const viandsUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${viandsGid}&t=${Date.now()}`;

    try {
      // 1. Fetch Viands Database first for lookups
      const viandsRes = await fetch(viandsUrl);
      let parsedViands: ViandRecord[] = [];
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
          }
        }
      }
      setViandsDb(parsedViands);

      // 2. Fetch Weekly Menu
      const menuRes = await fetch(menuUrl);
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
        console.warn("Spreadsheet menu tab size incorrect, using local template.");
        setMenu(DEFAULT_WEEKLY_MENU);
        setEditMenuState(DEFAULT_WEEKLY_MENU);
      }
    } catch (err: any) {
      console.warn("Failed to load live menu details, using local template:", err.message);
      setError("Displaying offline menu card. Google Sheets dynamic sync is currently offline.");
      setMenu(DEFAULT_WEEKLY_MENU);
      setEditMenuState(DEFAULT_WEEKLY_MENU);
    } finally {
      setLoading(false);
    }
  };

  // Maps database restriction tags like `NO PORK` to cadet warnings like `Contains Pork`
  const getDietWarnings = (viandName: string): string[] => {
    if (!viandName) return [];
    const cleanViand = viandName.trim().toUpperCase();
    const record = viandsDb.find(v => v.viand.toUpperCase().trim() === cleanViand);
    if (!record) {
      // Static fallback scan for matching substrings if not in database
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

  // Autocomplete functionality
  const handleInputChange = (
    day: string,
    meal: "morning" | "noon" | "evening" | "pmSnack",
    field: string,
    value: string
  ) => {
    // Update value in local state
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

    // Populate autocomplete suggestions
    if (!value || value.trim().length < 1) {
      setSuggestions([]);
      return;
    }

    const cleanInput = value.toLowerCase().trim();
    const matches = viandsDb
      .filter(v => v.viand.toLowerCase().includes(cleanInput))
      .map(v => v.viand)
      .slice(0, 5); // Limit to top 5 suggestions

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

  // Convert WeeklyMenuState to 2D Array matching Weekly Menu Sheet format
  const constructMenuCSVRows = (weeklyMenu: WeeklyMenuState): string[][] => {
    const rows: string[][] = Array.from({ length: 26 }, () => Array(8).fill(""));
    
    // Header
    rows[0] = ["", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"];
    
    // Row Labels
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

  // Primary save trigger: scans for new unique viands in menu
  const handleSaveMenuAttempt = () => {
    // 1. Gather all unique entered foods (exclude standard labels like rice and drinks if safe, but we scan all to be thorough)
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

    // 2. Identify which viands are NOT in the database (case-insensitive check)
    const newViandsList: { viand: string; diets: { [d: string]: boolean } }[] = [];
    const dbKeys = new Set(viandsDb.map(v => v.viand.toUpperCase().trim()));

    enteredViands.forEach(v => {
      const upper = v.toUpperCase().trim();
      // Exclude simple fillers
      if (!v || upper === "STEAMED RICE" || upper === "GARLIC RICE" || upper === "WATER") return;

      if (!dbKeys.has(upper)) {
        // Prepare blank diets
        const blankDiets: { [d: string]: boolean } = {};
        DEFAULT_DIET_COLUMNS.forEach(col => {
          blankDiets[col] = false;
        });
        newViandsList.push({
          viand: v,
          diets: blankDiets
        });
      }
    });

    if (newViandsList.length > 0) {
      // Show Step-2 configuration modal for these new viands
      setNewViandsToConfig(newViandsList);
      setShowConfigModal(true);
    } else {
      // Save directly since all viands are already registered!
      saveMenuToSheets(editMenuState, []);
    }
  };

  // Toggles dietary restrictions in Step-2 modal
  const toggleNewViandDiet = (viandIndex: number, restrictionName: string) => {
    setNewViandsToConfig(prev => 
      prev.map((item, idx) => {
        if (idx !== viandIndex) return item;
        return {
          ...item,
          diets: {
            ...item.diets,
            [restrictionName]: !item.diets[restrictionName]
          }
        };
      })
    );
  };

  const handleConfigConfirm = () => {
    setShowConfigModal(false);
    saveMenuToSheets(editMenuState, newViandsToConfig);
  };

  const saveMenuToSheets = async (
    menuStateToSave: WeeklyMenuState,
    newViands: { viand: string; diets: { [d: string]: boolean } }[]
  ) => {
    const appsScriptUrl = process.env.NEXT_PUBLIC_APPS_SCRIPT_URL;
    if (!appsScriptUrl) {
      alert("Google Apps Script URL is not configured. Menu could not be updated.");
      return;
    }

    setSaving(true);
    setError(null);
    setSuccessMsg(null);

    // Format new viands list for sheet (putting 1 if restricted)
    const formattedViandsForSheet = newViands.map(item => {
      const sheetDiets: { [col: string]: number } = {};
      Object.keys(item.diets).forEach(key => {
        sheetDiets[key] = item.diets[key] ? 1 : 0;
      });
      return {
        viand: item.viand,
        diets: sheetDiets
      };
    });

    const rows = constructMenuCSVRows(menuStateToSave);
    const payload = {
      action: "saveWeeklyMenuAndViands",
      rows: rows,
      viands: formattedViandsForSheet
    };

    try {
      const response = await fetch(appsScriptUrl, {
        method: "POST",
        headers: {
          "Content-Type": "text/plain",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Apps Script responded with status: ${response.status}`);
      }

      const resJson = await response.json();
      if (resJson.success) {
        setSuccessMsg("Weekly Menu and progressive Viands Database saved to Google Sheets!");
        setShowEditModal(false);
        fetchMenuAndViands(); // Reload fresh state
        setTimeout(() => setSuccessMsg(null), 5000);
      } else {
        throw new Error(resJson.error || "Failed to commit weekly menu changes.");
      }
    } catch (err: any) {
      console.error("Failed saving weekly menu details:", err);
      setError(`Failed to save weekly menu: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  // Closes suggestion popup when clicking outside
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
          max-width: 900px;
          height: 90%;
          max-height: 750px;
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
          gap: 12px;
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
            <span style={{ fontWeight: 700, color: error ? "var(--primary)" : "var(--success)" }}>
              {error ? "Offline Local" : "Live Google Sheets"}
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

      {/* Notice Banner */}
      {error && (
        <div className="alert-success animate-fade-in" style={{ backgroundColor: "#FFFBEB", border: "1px solid #F59E0B", color: "#B45309", marginBottom: "1.5rem" }}>
          ⚠️ <strong>Notice:</strong> {error}
        </div>
      )}

      {loading ? (
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

            {/* PM Snack Card (New Category) */}
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

      {/* WORKSPACE MODAL - STEP 1 (EDIT CELL VALUES) */}
      {showEditModal && createPortal(
        <div className="modal-fullscreen" onClick={() => setShowEditModal(false)}>
          <div className="modal-card-workspace" onClick={(e) => e.stopPropagation()}>
            <div className="workspace-header">
              <div>
                <h3 style={{ margin: 0, fontSize: "1.1rem", color: "var(--secondary)" }}>Edit Weekly Menu Board</h3>
                <span style={{ fontSize: "0.75rem", color: "var(--muted)" }}>RMESSO Administration Workspace</span>
              </div>
              <button 
                onClick={() => setShowEditModal(false)}
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
                  <span style={{ fontSize: "0.7rem", color: "var(--muted)" }}>Click suggestions when typing to link allergen data.</span>
                </div>

                {/* MORNING MESS */}
                <div className="meal-section-group">
                  <div className="meal-section-title">Morning Mess (Breakfast)</div>
                  <div className="fields-grid">
                    {["viand1", "viand2", "viand3", "viand4", "drink", "rice"].map((field) => {
                      const fKey = field as keyof Meal;
                      const uniqueId = `morning-${field}`;
                      const label = field.toUpperCase().replace("VIAND", "VIAND ").replace("RICE", "RICE/CARB");
                      return (
                        <div key={field} className="form-group autocomplete-wrapper" style={{ margin: 0 }}>
                          <label htmlFor={uniqueId} style={{ fontSize: "0.65rem", color: "var(--muted)" }}>{label}</label>
                          <input
                            id={uniqueId}
                            type="text"
                            className="input-field"
                            style={{ padding: "8px 10px", fontSize: "0.8rem" }}
                            value={editMenuState[editActiveDay].morning[fKey]}
                            autoComplete="off"
                            onFocus={() => setFocusedField({ day: editActiveDay, meal: "morning", field })}
                            onChange={(e) => handleInputChange(editActiveDay, "morning", field, e.target.value)}
                          />
                          {focusedField?.day === editActiveDay && 
                           focusedField?.meal === "morning" && 
                           focusedField?.field === field && 
                           suggestions.length > 0 && (
                            <ul className="suggestion-dropdown">
                              {suggestions.map(sug => (
                                <li 
                                  key={sug} 
                                  className="suggestion-item"
                                  onMouseDown={() => selectSuggestion(editActiveDay, "morning", field, sug)}
                                >
                                  {sug}
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* NOON MESS */}
                <div className="meal-section-group">
                  <div className="meal-section-title">Noon Mess (Lunch)</div>
                  <div className="fields-grid">
                    {["viand1", "viand2", "viand3", "viand4", "drink", "rice"].map((field) => {
                      const fKey = field as keyof Meal;
                      const uniqueId = `noon-${field}`;
                      const label = field.toUpperCase().replace("VIAND", "VIAND ").replace("RICE", "RICE/CARB");
                      return (
                        <div key={field} className="form-group autocomplete-wrapper" style={{ margin: 0 }}>
                          <label htmlFor={uniqueId} style={{ fontSize: "0.65rem", color: "var(--muted)" }}>{label}</label>
                          <input
                            id={uniqueId}
                            type="text"
                            className="input-field"
                            style={{ padding: "8px 10px", fontSize: "0.8rem" }}
                            value={editMenuState[editActiveDay].noon[fKey]}
                            autoComplete="off"
                            onFocus={() => setFocusedField({ day: editActiveDay, meal: "noon", field })}
                            onChange={(e) => handleInputChange(editActiveDay, "noon", field, e.target.value)}
                          />
                          {focusedField?.day === editActiveDay && 
                           focusedField?.meal === "noon" && 
                           focusedField?.field === field && 
                           suggestions.length > 0 && (
                            <ul className="suggestion-dropdown">
                              {suggestions.map(sug => (
                                <li 
                                  key={sug} 
                                  className="suggestion-item"
                                  onMouseDown={() => selectSuggestion(editActiveDay, "noon", field, sug)}
                                >
                                  {sug}
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* EVENING MESS */}
                <div className="meal-section-group">
                  <div className="meal-section-title">Evening Mess (Dinner)</div>
                  <div className="fields-grid">
                    {["viand1", "viand2", "viand3", "viand4", "drink", "rice"].map((field) => {
                      const fKey = field as keyof Meal;
                      const uniqueId = `evening-${field}`;
                      const label = field.toUpperCase().replace("VIAND", "VIAND ").replace("RICE", "RICE/CARB");
                      return (
                        <div key={field} className="form-group autocomplete-wrapper" style={{ margin: 0 }}>
                          <label htmlFor={uniqueId} style={{ fontSize: "0.65rem", color: "var(--muted)" }}>{label}</label>
                          <input
                            id={uniqueId}
                            type="text"
                            className="input-field"
                            style={{ padding: "8px 10px", fontSize: "0.8rem" }}
                            value={editMenuState[editActiveDay].evening[fKey]}
                            autoComplete="off"
                            onFocus={() => setFocusedField({ day: editActiveDay, meal: "evening", field })}
                            onChange={(e) => handleInputChange(editActiveDay, "evening", field, e.target.value)}
                          />
                          {focusedField?.day === editActiveDay && 
                           focusedField?.meal === "evening" && 
                           focusedField?.field === field && 
                           suggestions.length > 0 && (
                            <ul className="suggestion-dropdown">
                              {suggestions.map(sug => (
                                <li 
                                  key={sug} 
                                  className="suggestion-item"
                                  onMouseDown={() => selectSuggestion(editActiveDay, "evening", field, sug)}
                                >
                                  {sug}
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* PM SNACK */}
                <div className="meal-section-group">
                  <div className="meal-section-title">PM Snack</div>
                  <div className="form-group autocomplete-wrapper" style={{ margin: 0 }}>
                    <label htmlFor="snack-field" style={{ fontSize: "0.65rem", color: "var(--muted)" }}>SNACK ITEM</label>
                    <input
                      id="snack-field"
                      type="text"
                      className="input-field"
                      style={{ padding: "8px 10px", fontSize: "0.8rem" }}
                      value={editMenuState[editActiveDay].pmSnack}
                      autoComplete="off"
                      onFocus={() => setFocusedField({ day: editActiveDay, meal: "pmSnack", field: "pmSnack" })}
                      onChange={(e) => handleInputChange(editActiveDay, "pmSnack", "pmSnack", e.target.value)}
                    />
                    {focusedField?.day === editActiveDay && 
                     focusedField?.meal === "pmSnack" && 
                     focusedField?.field === "pmSnack" && 
                     suggestions.length > 0 && (
                      <ul className="suggestion-dropdown">
                        {suggestions.map(sug => (
                          <li 
                            key={sug} 
                            className="suggestion-item"
                            onMouseDown={() => selectSuggestion(editActiveDay, "pmSnack", "pmSnack", sug)}
                          >
                            {sug}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-footer" style={{ borderTop: "1.5px solid var(--border-color)", padding: "1rem 1.5rem" }}>
              <button 
                type="button" 
                className="btn btn-outline" 
                onClick={() => setShowEditModal(false)}
                style={{ marginRight: "10px" }}
              >
                Cancel
              </button>
              <button 
                type="button" 
                className="btn btn-primary"
                onClick={handleSaveMenuAttempt}
              >
                Save Weekly Menu
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* STEP 2 MODAL (NEW VIAND DIETARY CONFIG) */}
      {showConfigModal && createPortal(
        <div className="modal-fullscreen" style={{ zIndex: 1100 }}>
          <div className="modal-content" style={{ maxWidth: "600px", padding: 0 }}>
            <div className="modal-header" style={{ borderBottom: "1.5px solid var(--border-color)", padding: "1.25rem 1.5rem" }}>
              <div>
                <h3 style={{ margin: 0, fontSize: "1.1rem", color: "var(--secondary)" }}>Configure New Viands</h3>
                <span style={{ fontSize: "0.75rem", color: "var(--muted)" }}>Declare ingredients to finalize cadet dietary filtering</span>
              </div>
            </div>

            <div style={{ padding: "1.5rem", overflowY: "auto", maxHeight: "400px" }}>
              <p style={{ fontSize: "0.8rem", color: "var(--muted)", marginBottom: "1.25rem" }}>
                The following foods were introduced to this weekly menu. Select which dietary categories contain this viand (e.g. check "PORK" if the food contains pork so that "NO PORK" diet lists filter it):
              </p>

              {newViandsToConfig.map((item, index) => (
                <div key={item.viand} style={{ marginBottom: "1.5rem", border: "1px solid var(--border-color)", padding: "1rem", borderRadius: "8px" }}>
                  <h4 style={{ margin: "0 0 8px 0", fontSize: "0.95rem", color: "var(--secondary)" }}>{item.viand}</h4>
                  
                  <div className="viand-pills-container">
                    {DEFAULT_DIET_COLUMNS.map((col) => {
                      const cleanName = formatDietName(col);
                      const isActive = item.diets[col];
                      return (
                        <div
                          key={col}
                          className={`viand-pill ${isActive ? "active" : "inactive"}`}
                          onClick={() => toggleNewViandDiet(index, col)}
                          title={`Contains ${cleanName}`}
                        >
                          {cleanName}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            <div className="modal-footer" style={{ borderTop: "1.5px solid var(--border-color)", padding: "1rem 1.5rem" }}>
              <button 
                type="button" 
                className="btn btn-outline" 
                onClick={() => setShowConfigModal(false)}
                style={{ marginRight: "10px" }}
              >
                Back to Edit
              </button>
              <button 
                type="button" 
                className="btn btn-primary"
                onClick={handleConfigConfirm}
                disabled={saving}
              >
                {saving ? "Saving changes..." : "Confirm & Save Menu"}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
