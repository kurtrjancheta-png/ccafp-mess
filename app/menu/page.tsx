"use client";

import React, { useState, useEffect } from "react";

interface Meal {
  breakfast: string;
  lunch: string;
  dinner: string;
}

interface WeeklyMenu {
  [day: string]: Meal;
}

const DEFAULT_MENU: WeeklyMenu = {
  Monday: {
    breakfast: "Garlic Rice, Sunny Side Up Eggs, Skinless Longganisa, Coffee/Hot Chocolate",
    lunch: "Steamed Rice, Sinigang na Baboy (Pork Tamarind Soup), Stir-fried Choy Sum, Banana",
    dinner: "Steamed Rice, Chicken Adobo, Pinakbet (Mixed Vegetables), Fresh Melons",
  },
  Tuesday: {
    breakfast: "Sinangag, Scrambled Eggs with Tomatoes, Beef Tapa, Tea/Milk",
    lunch: "Steamed Rice, Tinolang Manok (Chicken Ginger Soup), Ginisang Monggo (Mung Bean Stew), Apple",
    dinner: "Steamed Rice, Pork Chop in Gravy, Buttered Vegetables, Papaya slices",
  },
  Wednesday: {
    breakfast: "Champorado (Sweet Chocolate Rice Porridge) with Tuyo (Salted Fish), Hot Chocolate",
    lunch: "Steamed Rice, Beef Caldereta (Tomato Stew), Ginisang Baguio Beans, Orange slices",
    dinner: "Steamed Rice, Sweet and Sour Fish Fillet, Chop Suey, Pears",
  },
  Thursday: {
    breakfast: "Garlic Rice, Boiled Eggs, Corned Beef with Onions, Coffee/Milk",
    lunch: "Steamed Rice, Pork Sinigang, Ginisang Repolyo (Cabbage), Mangoes",
    dinner: "Steamed Rice, Grilled Chicken Breast, Sauteed Kangkong, Watermelon",
  },
  Friday: {
    breakfast: "Sinangag, Fried Eggs, Daing na Bangus (Milkfish), Tea/Coffee",
    lunch: "Steamed Rice, Kare-Kareng Baka (Beef Peanut Sauce Stew) with Bagoong, Eggplant, Pineapple slices",
    dinner: "Steamed Rice, Chicken Adobo, Stir-fried Broccoli, Gelatin Dessert",
  },
  Saturday: {
    breakfast: "Pancakes with Syrup, Pork Sausages, Scrambled Eggs, Fruit Juice",
    lunch: "Steamed Rice, Nilagang Baka (Beef Broth), Sauteed Sayote, Bananas",
    dinner: "Steamed Rice, Beef Broccoli, Buttered Corn and Peas, Cookies",
  },
  Sunday: {
    breakfast: "Garlic Rice, Sunny Side Up Eggs, Tocino, Coffee/Hot Chocolate",
    lunch: "Steamed Rice, Lechon Kawali (Crispy Pork Belly), Pinakbet, Fresh Apples",
    dinner: "Steamed Rice, Chicken Curry, Tossed Green Salad, Ice Cream Cup",
  },
};

export default function MenuPage() {
  const [menu] = useState<WeeklyMenu>(DEFAULT_MENU);
  const [activeDay, setActiveDay] = useState("Monday");

  useEffect(() => {
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const todayName = days[new Date().getDay()];
    if (menu[todayName]) {
      setActiveDay(todayName);
    }
  }, [menu]);

  // Helper to extract allergen warnings dynamically
  const getAllergenWarnings = (mealText: string): string[] => {
    const warnings: string[] = [];
    const text = mealText.toUpperCase();
    
    if (text.includes("PORK") || text.includes("BABOY") || text.includes("LONGGANISA") || text.includes("TOCINO") || text.includes("LECHON") || text.includes("SAUSAGES")) {
      warnings.push("Pork");
    }
    if (text.includes("BEEF") || text.includes("BAKA") || text.includes("TAPA")) {
      warnings.push("Beef");
    }
    if (text.includes("FISH") || text.includes("BANGUS") || text.includes("TUYO")) {
      warnings.push("Fish");
    }
    if (text.includes("SEAFOOD") || text.includes("SHRIMP") || text.includes("PRAWN") || text.includes("CRAB") || text.includes("OYSTER") || text.includes("BAGOONG")) {
      warnings.push("Seafood");
    }
    if (text.includes("EGG") || text.includes("EGGS")) {
      warnings.push("Egg");
    }
    if (text.includes("CHICKEN") || text.includes("MANOK")) {
      warnings.push("Chicken");
    }
    if (text.includes("BEAN") || text.includes("BEANS") || text.includes("MONGGO")) {
      warnings.push("Beans");
    }
    if (text.includes("NUT") || text.includes("NUTS") || text.includes("PEANUT") || text.includes("KARE-KARE")) {
      warnings.push("Nuts");
    }
    if (text.includes("TOFU") || text.includes("TOKWA")) {
      warnings.push("Tofu");
    }
    if (text.includes("COFFEE")) {
      warnings.push("Coffee");
    }
    if (text.includes("CHOCOLATE") || text.includes("CHAMPORADO")) {
      warnings.push("Chocolate");
    }
    if (text.includes("TOMATO") || text.includes("TOMATOES") || text.includes("CALDERETA")) {
      warnings.push("Tomatoes");
    }
    if (text.includes("SPICY") || text.includes("CURRY")) {
      warnings.push("Spicy");
    }
    
    return warnings;
  };

  const currentMeals = menu[activeDay];

  return (
    <div className="animate-fade-in">
      <header className="page-header">
        <div className="page-title">
          <h2>Weekly Menu Board</h2>
          <p>Meal plans, nutrition, and diet warning disclosures for the Cadet Corps.</p>
        </div>
      </header>

      {/* Week Day Tab Selectors */}
      <div className="card">
        <div className="card-title">Select Day to View</div>
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

        {/* Detailed Meals Grid for Selected Day */}
        <div className="selected-day-container animate-fade-in" key={activeDay}>
          {/* Breakfast Card */}
          <div className="meal-card breakfast animate-fade-in animate-stagger-1">
            <h4 style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span>Breakfast</span>
              <span style={{ fontSize: "0.7rem", color: "var(--muted)", textTransform: "uppercase" }}>0600H</span>
            </h4>
            <p style={{ marginTop: "1rem", minHeight: "60px" }}>{currentMeals.breakfast}</p>
            
            {/* Allergen check */}
            <div className="allergen-warning-container">
              {getAllergenWarnings(currentMeals.breakfast).map((warning) => (
                <span key={warning} className="badge badge-diet" style={{ fontSize: "0.65rem" }}>
                  ⚠️ Contains {warning}
                </span>
              ))}
              {getAllergenWarnings(currentMeals.breakfast).length === 0 && (
                <span className="badge" style={{ backgroundColor: "var(--success-light)", color: "var(--success)" }}>
                  ✓ Standard Diet Safe
                </span>
              )}
            </div>
          </div>

          {/* Lunch Card */}
          <div className="meal-card lunch animate-fade-in animate-stagger-2">
            <h4 style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span>Lunch</span>
              <span style={{ fontSize: "0.7rem", color: "var(--muted)", textTransform: "uppercase" }}>1200H</span>
            </h4>
            <p style={{ marginTop: "1rem", minHeight: "60px" }}>{currentMeals.lunch}</p>
            
            {/* Allergen check */}
            <div className="allergen-warning-container">
              {getAllergenWarnings(currentMeals.lunch).map((warning) => (
                <span key={warning} className="badge badge-diet" style={{ fontSize: "0.65rem" }}>
                  ⚠️ Contains {warning}
                </span>
              ))}
              {getAllergenWarnings(currentMeals.lunch).length === 0 && (
                <span className="badge" style={{ backgroundColor: "var(--success-light)", color: "var(--success)" }}>
                  ✓ Standard Diet Safe
                </span>
              )}
            </div>
          </div>

          {/* Dinner Card */}
          <div className="meal-card dinner animate-fade-in animate-stagger-3">
            <h4 style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span>Dinner</span>
              <span style={{ fontSize: "0.7rem", color: "var(--muted)", textTransform: "uppercase" }}>1800H</span>
            </h4>
            <p style={{ marginTop: "1rem", minHeight: "60px" }}>{currentMeals.dinner}</p>
            
            {/* Allergen check */}
            <div className="allergen-warning-container">
              {getAllergenWarnings(currentMeals.dinner).map((warning) => (
                <span key={warning} className="badge badge-diet" style={{ fontSize: "0.65rem" }}>
                  ⚠️ Contains {warning}
                </span>
              ))}
              {getAllergenWarnings(currentMeals.dinner).length === 0 && (
                <span className="badge" style={{ backgroundColor: "var(--success-light)", color: "var(--success)" }}>
                  ✓ Standard Diet Safe
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Menu Guidance Note */}
      <div className="card animate-fade-in animate-stagger-2" style={{ backgroundColor: "var(--accent-light)", borderColor: "var(--accent)" }}>
        <h4 style={{ color: "#7D5B18", marginBottom: "0.5rem" }}>CCAFP Dietary Warnings Protocol</h4>
        <p style={{ fontSize: "0.85rem", color: "#8E6B20" }}>
          Allergen warning badges are automatically generated by analyzing active menu ingredient strings against registered cadet dietary concerns. Cadets with verified medical tags matching any badge warnings should sign up for diet substitutions with the Regimental Mess Officer.
        </p>
      </div>
    </div>
  );
}
