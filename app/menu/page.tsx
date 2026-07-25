"use client";

import React, { useState } from "react";

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
    breakfast: "Champorado (Sweet Chocolate Rice Porridge) with Tuyo (Saltsed Fish), Hot Chocolate",
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
  const [menu, setMenu] = useState<WeeklyMenu>(DEFAULT_MENU);

  return (
    <div>
      <header className="page-header">
        <div className="page-title">
          <h2>Weekly Menu Board</h2>
          <p>Meal plans and nutritional allocations for the Cadet Corps Armed Forces of the Philippines.</p>
        </div>
      </header>

      <div className="card">
        <div className="card-title">
          <span>Weekly Rotation Plan</span>
          <span style={{ fontSize: "0.85rem", color: "var(--muted)", fontWeight: "normal" }}>
            A.Y. 2026-2027 Roster Period
          </span>
        </div>

        <div className="menu-grid">
          {Object.keys(menu).map((day) => (
            <div key={day} className="menu-day-card">
              <div className="menu-day-header">
                <span>{day}</span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="2.5"
                  stroke="currentColor"
                  style={{ width: "18px", height: "18px" }}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div className="menu-meals">
                <div className="meal-block">
                  <div className="meal-name">Breakfast</div>
                  <div className="meal-content">{menu[day].breakfast}</div>
                </div>
                <div className="meal-block">
                  <div className="meal-name">Lunch</div>
                  <div className="meal-content">{menu[day].lunch}</div>
                </div>
                <div className="meal-block">
                  <div className="meal-name">Dinner</div>
                  <div className="meal-content">{menu[day].dinner}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
