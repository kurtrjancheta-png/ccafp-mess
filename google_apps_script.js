/**
 * CCAFP Mess - Dissemination Recorder & API Web App Script
 * 
 * Paste this script into your Google Sheet (Extensions > Apps Script) to enable automatic
 * calculation, recording of meal disseminations, and API connection to the Next.js app.
 * 
 * To activate the API, click "Deploy > New Deployment", select "Web App",
 * execute as "Me" (your account), and allow access to "Anyone".
 */

// Target Sheet GIDs
var DATABASE_GID = "482780671";
var DISSEMINATIONS_GID = "1204067800";

/**
 * Creates a custom menu when the spreadsheet is opened.
 */
function onOpen() {
  var ui = SpreadsheetApp.getUi();
  ui.createMenu('CCAFP Mess Operations')
    .addItem('Record Current Meal Dissemination', 'showDisseminationDialog')
    .addToUi();
}

/**
 * Displays the HTML dialog for picking Date and Meal.
 */
function showDisseminationDialog() {
  var html = HtmlService.createHtmlOutput(getHtmlDialogContent())
      .setWidth(350)
      .setHeight(300)
      .setTitle('CCAFP Mess - Record Dissemination');
  SpreadsheetApp.getUi().showModalDialog(html, 'Record Meal Dissemination');
}

/**
 * Utility to find a sheet by GID.
 */
function getSheetByGid(ss, gid) {
  var sheets = ss.getSheets();
  for (var i = 0; i < sheets.length; i++) {
    if (sheets[i].getSheetId().toString() === gid.toString()) {
      return sheets[i];
    }
  }
  return null;
}

/**
 * Web App GET endpoint. Exposes database queries and recording triggers.
 */
function doGet(e) {
  var action = e.parameter.action || "getDisseminations";
  var response = {};
  
  try {
    if (action === "getDisseminations") {
      response = { success: true, data: readDisseminationsData() };
    } else if (action === "getDatabase") {
      response = { success: true, data: readDatabaseData() };
    } else if (action === "record") {
      var dateVal = e.parameter.date;
      var mealVal = e.parameter.meal;
      if (!dateVal || !mealVal) {
        throw new Error("Missing date or meal parameter.");
      }
      processRecording(dateVal, mealVal.toUpperCase());
      response = { success: true, message: "Successfully recorded dissemination snapshot for " + dateVal + " (" + mealVal + ")" };
    } else {
      throw new Error("Unknown API action: " + action);
    }
  } catch (err) {
    response = { success: false, error: err.message };
  }
  
  return ContentService.createTextOutput(JSON.stringify(response))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Web App POST endpoint. Accepts custom dissemination reports submitted from the website interface.
 */
function doPost(e) {
  var response = {};
  try {
    var postData = JSON.parse(e.postData.contents);
    var action = postData.action || "saveDissemination";
    
    if (action === "saveDissemination") {
      var dateStr = postData.date;
      var mealStr = postData.meal;
      var rows = postData.rows;
      
      if (!dateStr || !mealStr || !rows) {
        throw new Error("Missing required date, meal, or rows parameters in payload.");
      }
      
      saveCustomDissemination(dateStr, mealStr.toUpperCase(), rows);
      response = { success: true, message: "Successfully posted and saved dissemination for " + dateStr + " (" + mealStr + ") to spreadsheet." };
    } else if (action === "saveCamoTasks") {
      var tasks = postData.tasks;
      if (!tasks) {
        throw new Error("Missing tasks parameters in payload.");
      }
      saveCamoTasksToSheet(tasks);
      response = { success: true, message: "Successfully updated CAMO checklist tasks on spreadsheet." };
    } else if (action === "saveWeeklyMenuAndViands") {
      var rows = postData.rows;
      var viands = postData.viands;
      if (!rows || !viands) {
        throw new Error("Missing rows or viands parameter in payload.");
      }
      saveWeeklyMenu(rows);
      saveViands(viands);
      response = { success: true, message: "Successfully updated Weekly Menu and progressive Viands Database." };
    } else {
      throw new Error("Unknown POST action: " + action);
    }
  } catch (err) {
    response = { success: false, error: err.message };
  }
  
  return ContentService.createTextOutput(JSON.stringify(response))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Saves a custom dissemination report submitted from the website interface.
 */
function saveCustomDissemination(dateStr, mealStr, rows) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var disSheet = getSheetByGid(ss, DISSEMINATIONS_GID) || ss.getSheetByName("DISSEMINATIONS");
  if (!disSheet) {
    disSheet = ss.insertSheet("DISSEMINATIONS");
  }
  
  var disDataRange = disSheet.getDataRange();
  var disValues = disDataRange.getValues();
  var disHeaders = [];
  
  // Set up headers if the sheet is completely empty
  if (disValues.length === 0 || disValues[0].length === 0 || !disValues[0][0]) {
    var dbSheet = getSheetByGid(ss, DATABASE_GID) || ss.getSheetByName("DATABASE") || ss.getSheets()[0];
    var dbHeaders = dbSheet.getDataRange().getValues()[0].map(function(h) { return h.toString().toUpperCase().trim(); });
    
    var dietColumns = [];
    dbHeaders.forEach(function(header) {
      if (header && header.indexOf("NO ") === 0) {
        dietColumns.push(header);
      }
    });
    
    disHeaders = [
      "Date", "Meal", "Company", "Battalion", "Total Strength", "Present", "Excused",
      "Excused (HC)", "Excused (Sick Bay)", "Excused (Hospital)", "Excused (Duty)", "Excused (Leave)", "Excused (Other)",
      "Special Diets Total"
    ];
    dietColumns.forEach(function(diet) {
      disHeaders.push(diet);
    });
    disHeaders.push("Timestamp");
    disSheet.appendRow(disHeaders);
    disValues = [disHeaders];
  } else {
    disHeaders = disValues[0];
  }
  
  // Delete existing records matching Date and Meal to prevent duplicates
  var mealUpper = mealStr.toUpperCase().trim();
  for (var j = disValues.length - 1; j >= 1; j--) {
    var rowDate = disValues[j][0];
    var formattedRowDate = "";
    if (rowDate instanceof Date) {
      var d = String(rowDate.getDate()).padStart(2, '0');
      var m = String(rowDate.getMonth() + 1).padStart(2, '0');
      var y = rowDate.getFullYear();
      formattedRowDate = y + '-' + m + '-' + d;
    } else {
      formattedRowDate = rowDate ? rowDate.toString().trim() : "";
    }
    
    var rowMeal = disValues[j][1] ? disValues[j][1].toString().toUpperCase().trim() : "";
    if (formattedRowDate === dateStr && rowMeal === mealUpper) {
      disSheet.deleteRow(j + 1);
    }
  }
  
  // Append new custom rows
  var timestamp = new Date();
  rows.forEach(function(row) {
    var appendRowData = [
      dateStr,
      mealUpper,
      row.company,
      row.battalion,
      row.totalStrength,
      row.present,
      row.excused,
      row.hc,
      row.sickBay,
      row.hospital,
      row.duty,
      row.leave,
      row.otherExcused,
      row.dietsTotal
    ];
    
    // Add diet counts in the order of the original headers (column-by-column mapping)
    for (var colIdx = 14; colIdx < disHeaders.length - 1; colIdx++) {
      var dietName = disHeaders[colIdx];
      var count = row.diets && row.diets[dietName] !== undefined ? row.diets[dietName] : 0;
      appendRowData.push(count);
    }
    
    // Add Timestamp
    appendRowData.push(timestamp);
    disSheet.appendRow(appendRowData);
  });
  
  // Sort and format the sheet
  var numRows = disSheet.getLastRow();
  var numCols = disSheet.getLastColumn();
  if (numRows > 1) {
    var sortRange = disSheet.getRange(2, 1, numRows - 1, numCols);
    sortRange.sort([
      {column: 1, ascending: false}, // Date descending
      {column: 2, ascending: true},  // Meal ascending
      {column: 3, ascending: true}   // Company ascending
    ]);
  }
  
  formatDisseminationsSheet(disSheet);
}

/**
 * Saves/updates CAMO tasks in the CHECKLIST sheet (GID 65446490) based on task description matching.
 */
function saveCamoTasksToSheet(updatedTasks) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = getSheetByGid(ss, "65446490");
  if (!sheet) {
    throw new Error("CAMO checklist sheet (GID 65446490) was not found in the spreadsheet.");
  }
  
  var values = sheet.getDataRange().getValues();
  if (values.length < 2) {
    throw new Error("Checklist sheet does not contain enough rows (header + tasks).");
  }
  
  var headers = values[0].map(function(h) { return h.toString().toUpperCase().trim(); });
  var taskIdx = headers.indexOf("TASK");
  var statusIdx = headers.indexOf("STATUS");
  var timeIdx = headers.indexOf("TIME");
  var remarksIdx = headers.indexOf("REMARKS");
  
  if (taskIdx === -1) {
    throw new Error("Checklist sheet must contain a 'TASK' column.");
  }
  
  // Create a map of task name (lowercase trimmed) to row index (1-indexed)
  var taskRowMap = {};
  for (var i = 1; i < values.length; i++) {
    var taskName = values[i][taskIdx].toString().trim().toLowerCase();
    if (taskName) {
      taskRowMap[taskName] = i + 1;
    }
  }
  
  // Update each task matching by name
  updatedTasks.forEach(function(ut) {
    var cleanTaskName = ut.task.trim().toLowerCase();
    var rowNum = taskRowMap[cleanTaskName];
    if (rowNum) {
      if (statusIdx !== -1) {
        sheet.getRange(rowNum, statusIdx + 1).setValue(ut.status);
      }
      if (timeIdx !== -1) {
        sheet.getRange(rowNum, timeIdx + 1).setValue(ut.time);
      }
      if (remarksIdx !== -1) {
        sheet.getRange(rowNum, remarksIdx + 1).setValue(ut.remarks);
      }
    }
  });
  
  return true;
}

/**
 * Reads all records from the DISSEMINATIONS sheet and formats them as a clean JSON array.
 */
function readDisseminationsData() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = getSheetByGid(ss, DISSEMINATIONS_GID) || ss.getSheetByName("DISSEMINATIONS");
  if (!sheet) return [];
  
  var values = sheet.getDataRange().getValues();
  if (values.length < 2) return [];
  
  var headers = values[0];
  var records = [];
  
  for (var i = 1; i < values.length; i++) {
    var row = values[i];
    var obj = {};
    for (var j = 0; j < headers.length; j++) {
      var key = headers[j];
      if (!key) continue;
      var val = row[j];
      
      if (val instanceof Date) {
        if (j === 0) {
          // Date column
          var d = String(val.getDate()).padStart(2, '0');
          var m = String(val.getMonth() + 1).padStart(2, '0');
          var y = val.getFullYear();
          obj[key] = y + '-' + m + '-' + d;
        } else {
          // Timestamp or other DateTime
          obj[key] = val.getFullYear() + '-' + 
                     String(val.getMonth() + 1).padStart(2, '0') + '-' + 
                     String(val.getDate()).padStart(2, '0') + ' ' + 
                     String(val.getHours()).padStart(2, '0') + ':' + 
                     String(val.getMinutes()).padStart(2, '0') + ':' + 
                     String(val.getSeconds()).padStart(2, '0');
        }
      } else {
        obj[key] = val;
      }
    }
    records.push(obj);
  }
  return records;
}

/**
 * Reads all records from the DATABASE sheet and formats them as a JSON array.
 */
function readDatabaseData() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = getSheetByGid(ss, DATABASE_GID) || ss.getSheetByName("DATABASE") || ss.getSheets()[0];
  if (!sheet) return [];
  
  var values = sheet.getDataRange().getValues();
  if (values.length < 2) return [];
  
  var headers = values[0];
  var records = [];
  
  for (var i = 1; i < values.length; i++) {
    var row = values[i];
    var obj = {};
    for (var j = 0; j < headers.length; j++) {
      var key = headers[j];
      if (key) {
        obj[key] = row[j];
      }
    }
    records.push(obj);
  }
  return records;
}

/**
 * Core function triggered by the HTML dialog or API request to process and write the dissemination data.
 */
function processRecording(dateStr, mealStr) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // Find Database and Disseminations sheets
  var dbSheet = getSheetByGid(ss, DATABASE_GID);
  if (!dbSheet) {
    dbSheet = ss.getSheetByName("DATABASE") || ss.getSheets()[0];
  }
  
  var disSheet = getSheetByGid(ss, DISSEMINATIONS_GID);
  if (!disSheet) {
    disSheet = ss.getSheetByName("DISSEMINATIONS");
    if (!disSheet) {
      disSheet = ss.insertSheet("DISSEMINATIONS");
    }
  }
  
  var dbValues = dbSheet.getDataRange().getValues();
  if (dbValues.length < 2) {
    throw new Error("The DATABASE sheet has no cadet records.");
  }
  
  var dbHeaders = dbValues[0].map(function(h) { return h.toString().toUpperCase().trim(); });
  
  // Identify key column indexes in DATABASE
  var coyIdx = dbHeaders.indexOf("COMPANY");
  var statusIdx = dbHeaders.indexOf("STATUS");
  var bnIdx = dbHeaders.indexOf("BATTALION");
  
  if (coyIdx === -1) {
    throw new Error("Required column 'COMPANY' was not found in the DATABASE sheet.");
  }
  
  // Find all dietary restriction columns (starting with "NO ")
  var dietColumns = [];
  var dietColIndices = {};
  for (var c = 0; c < dbHeaders.length; c++) {
    var header = dbHeaders[c];
    if (header && header.indexOf("NO ") === 0) {
      dietColumns.push(header);
      dietColIndices[header] = c;
    }
  }
  
  // Default list of companies to ensure they appear in the report
  var targetCompanies = ["ALFA", "BRAVO", "CHARLIE", "DELTA", "ECHO", "FOXTROT", "GOLF", "HAWK"];
  
  // Initialize Aggregation structure
  var summary = {};
  targetCompanies.forEach(function(coy) {
    summary[coy] = {
      battalion: getFallbackBattalion(coy),
      total: 0,
      present: 0,
      excused: 0,
      hc: 0,
      sickBay: 0,
      hospital: 0,
      duty: 0,
      leave: 0,
      otherExcused: 0,
      dietsTotal: 0,
      dietCounts: {}
    };
    dietColumns.forEach(function(diet) {
      summary[coy].dietCounts[diet] = 0;
    });
  });
  
  // Process each cadet in DATABASE
  for (var i = 1; i < dbValues.length; i++) {
    var row = dbValues[i];
    var rawCoy = row[coyIdx] ? row[coyIdx].toString().toUpperCase().trim() : "";
    if (!rawCoy) continue;
    
    // Auto-create company category if it isn't in target list
    if (rawCoy && !summary[rawCoy]) {
      summary[rawCoy] = {
        battalion: bnIdx !== -1 && row[bnIdx] ? row[bnIdx].toString().toUpperCase().trim() : getFallbackBattalion(rawCoy),
        total: 0, present: 0, excused: 0,
        hc: 0, sickBay: 0, hospital: 0, duty: 0, leave: 0, otherExcused: 0,
        dietsTotal: 0, dietCounts: {}
      };
      dietColumns.forEach(function(diet) {
        summary[rawCoy].dietCounts[diet] = 0;
      });
      targetCompanies.push(rawCoy);
    }
    
    var company = rawCoy;
    summary[company].total++;
    
    // Determine Battalion from DATABASE row
    if (bnIdx !== -1 && row[bnIdx]) {
      summary[company].battalion = row[bnIdx].toString().toUpperCase().trim();
    }
    
    // Parse Status
    var status = statusIdx !== -1 && row[statusIdx] ? row[statusIdx].toString().toUpperCase().trim() : "";
    if (!status || status === "FULL DUTY" || status === "FD") {
      summary[company].present++;
    } else {
      summary[company].excused++;
      if (status === "HC" || status.indexOf("HOLDING") !== -1) {
        summary[company].hc++;
      } else if (status === "SICK BAY" || status === "SB") {
        summary[company].sickBay++;
      } else if (status === "HOSPITAL" || status === "PMAH" || status === "HOSP") {
        summary[company].hospital++;
      } else if (status === "DUTY" || status === "GUARD") {
        summary[company].duty++;
      } else if (status === "LEAVE" || status === "PASS") {
        summary[company].leave++;
      } else {
        summary[company].otherExcused++;
      }
    }
    
    // Parse Special Diets
    var hasDiet = false;
    dietColumns.forEach(function(diet) {
      var colIdx = dietColIndices[diet];
      var val = row[colIdx] ? row[colIdx].toString().trim() : "";
      if (val === "1" || val === 1) {
        summary[company].dietCounts[diet]++;
        hasDiet = true;
      }
    });
    if (hasDiet) {
      summary[company].dietsTotal++;
    }
  }
  
  // Set up headers in DISSEMINATIONS sheet if empty
  var disDataRange = disSheet.getDataRange();
  var disValues = disDataRange.getValues();
  var disHeaders = [];
  
  if (disValues.length === 0 || disValues[0].length === 0 || !disValues[0][0]) {
    // Generate Column Headers
    disHeaders = [
      "Date", "Meal", "Company", "Battalion", "Total Strength", "Present", "Excused",
      "Excused (HC)", "Excused (Sick Bay)", "Excused (Hospital)", "Excused (Duty)", "Excused (Leave)", "Excused (Other)",
      "Special Diets Total"
    ];
    // Add dietary restriction columns dynamically
    dietColumns.forEach(function(diet) {
      disHeaders.push(diet);
    });
    disHeaders.push("Timestamp");
    
    disSheet.appendRow(disHeaders);
    disValues = [disHeaders];
  } else {
    disHeaders = disValues[0];
  }
  
  // Overwrite Strategy: Delete pre-existing records matching Date and Meal to prevent duplicates
  var mealUpper = mealStr.toUpperCase().trim();
  for (var j = disValues.length - 1; j >= 1; j--) {
    var rowDate = disValues[j][0];
    var formattedRowDate = "";
    if (rowDate instanceof Date) {
      var d = String(rowDate.getDate()).padStart(2, '0');
      var m = String(rowDate.getMonth() + 1).padStart(2, '0');
      var y = rowDate.getFullYear();
      formattedRowDate = y + '-' + m + '-' + d;
    } else {
      formattedRowDate = rowDate ? rowDate.toString().trim() : "";
    }
    
    var rowMeal = disValues[j][1] ? disValues[j][1].toString().toUpperCase().trim() : "";
    
    if (formattedRowDate === dateStr && rowMeal === mealUpper) {
      disSheet.deleteRow(j + 1); // delete row (1-indexed)
    }
  }
  
  // Write the new Aggregated Rows to DISSEMINATIONS
  var timestamp = new Date();
  targetCompanies.forEach(function(coy) {
    var info = summary[coy];
    var appendRowData = [
      dateStr,
      mealUpper,
      coy,
      info.battalion,
      info.total,
      info.present,
      info.excused,
      info.hc,
      info.sickBay,
      info.hospital,
      info.duty,
      info.leave,
      info.otherExcused,
      info.dietsTotal
    ];
    
    // Add diet counts in the order of the original headers (column-by-column mapping)
    for (var colIdx = 14; colIdx < disHeaders.length - 1; colIdx++) {
      var dietName = disHeaders[colIdx];
      var count = info.dietCounts[dietName] || 0;
      appendRowData.push(count);
    }
    
    // Add Timestamp
    appendRowData.push(timestamp);
    disSheet.appendRow(appendRowData);
  });
  
  // Sort the Dissemination tab: Date (Col A, Descending), Meal (Col B, Ascending), Company (Col C, Ascending)
  var numRows = disSheet.getLastRow();
  var numCols = disSheet.getLastColumn();
  if (numRows > 1) {
    var sortRange = disSheet.getRange(2, 1, numRows - 1, numCols);
    sortRange.sort([
      {column: 1, ascending: false}, // Date descending
      {column: 2, ascending: true},  // Meal ascending
      {column: 3, ascending: true}   // Company ascending
    ]);
  }
  
  // Format the DISSEMINATIONS sheet beautifully
  formatDisseminationsSheet(disSheet);
  
  // Handle Toast notification if run via active UI
  try {
    ss.toast("Successfully recorded dissemination for " + dateStr + " (" + mealUpper + ")!", "CCAFP Mess");
  } catch (err) {
    // Suppress if triggered via webapp where active UI doesn't exist
  }
  
  return true;
}

/**
 * Fallback battalion mapping if BATTALION column is missing or blank in database.
 */
function getFallbackBattalion(coy) {
  var clean = coy.toUpperCase().trim();
  if (clean === "ALFA" || clean === "BRAVO") return "1ST BATTALION";
  if (clean === "CHARLIE" || clean === "DELTA") return "2ND BATTALION";
  if (clean === "ECHO" || clean === "FOXTROT") return "3RD BATTALION";
  if (clean === "GOLF" || clean === "HAWK") return "4TH BATTALION";
  return "OTHER";
}

/**
 * Beautiful styling rules applied automatically to the Dissemination sheet.
 */
function formatDisseminationsSheet(sheet) {
  var lastRow = sheet.getLastRow();
  var lastCol = sheet.getLastColumn();
  if (lastRow < 1) return;
  
  // Un-freeze, then Freeze Row 1
  sheet.setFrozenRows(0);
  sheet.setFrozenRows(1);
  
  // Format Header Row (Pink & Bold, White text, centered)
  var headerRange = sheet.getRange(1, 1, 1, lastCol);
  headerRange.setBackground("#D84B61")
             .setFontColor("#FFFFFF")
             .setFontWeight("bold")
             .setHorizontalAlignment("center")
             .setVerticalAlignment("middle");
             
  sheet.setRowHeight(1, 28);
  
  // Format Data rows
  var dataRange = sheet.getRange(2, 1, lastRow - 1, lastCol);
  dataRange.setFontFamily("Arial")
           .setFontSize(10)
           .setVerticalAlignment("middle");
           
  // Alignments
  sheet.getRange(2, 1, lastRow - 1, 2).setHorizontalAlignment("center"); // Date, Meal
  sheet.getRange(2, 3, lastRow - 1, 2).setHorizontalAlignment("left");   // Company, Battalion
  sheet.getRange(2, 5, lastRow - 1, lastCol - 5).setHorizontalAlignment("right"); // Numbers & Counts
  sheet.getRange(2, lastCol, lastRow - 1, 1).setHorizontalAlignment("center"); // Timestamp
  
  // Number/Date formatting
  sheet.getRange(2, 1, lastRow - 1, 1).setNumberFormat("YYYY-MM-DD");
  sheet.getRange(2, 5, lastRow - 1, lastCol - 5).setNumberFormat("#,##0");
  sheet.getRange(2, lastCol, lastRow - 1, 1).setNumberFormat("YYYY-MM-DD HH:mm:ss");
  
  // Apply borders
  dataRange.setBorder(true, true, true, true, true, true, "#E5E7EB", SpreadsheetApp.BorderStyle.SOLID);
  
  // Auto-resize columns
  for (var col = 1; col <= lastCol; col++) {
    sheet.autoResizeColumn(col);
    // add small padding
    var currentWidth = sheet.getColumnWidth(col);
    if (currentWidth < 80) {
      sheet.setColumnWidth(col, 80);
    } else {
      sheet.setColumnWidth(col, currentWidth + 15);
    }
  }
}

/**
 * Returns the HTML UI markup for the modal dialog.
 */
function getHtmlDialogContent() {
  return '<!DOCTYPE html>\n' +
    '<html>\n' +
    '<head>\n' +
    '  <base target="_top">\n' +
    '  <style>\n' +
    '    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 20px; background-color: #FFF8F9; color: #1F2937; margin: 0; }\n' +
    '    h3 { color: #D84B61; margin-top: 0; font-size: 1.25rem; font-weight: 700; margin-bottom: 20px; border-bottom: 2px solid #FFE4E7; padding-bottom: 8px; }\n' +
    '    .form-group { margin-bottom: 16px; }\n' +
    '    label { display: block; font-weight: 600; margin-bottom: 6px; font-size: 0.85rem; color: #4B5563; text-transform: uppercase; letter-spacing: 0.5px; }\n' +
    '    input, select { width: 100%; padding: 10px; border: 1px solid #F3D2D6; border-radius: 8px; box-sizing: border-box; font-size: 0.9rem; background-color: #FFFFFF; color: #1F2937; transition: border-color 0.2s; }\n' +
    '    input:focus, select:focus { outline: none; border-color: #D84B61; box-shadow: 0 0 0 3px rgba(216, 75, 97, 0.15); }\n' +
    '    .btn { background-color: #D84B61; color: white; border: none; padding: 12px 15px; border-radius: 8px; cursor: pointer; font-weight: bold; width: 100%; margin-top: 15px; font-size: 0.95rem; box-shadow: 0 4px 6px rgba(216, 75, 97, 0.2); transition: background-color 0.2s, transform 0.1s; }\n' +
    '    .btn:hover { background-color: #C23E53; }\n' +
    '    .btn:active { transform: scale(0.98); }\n' +
    '  </style>\n' +
    '</head>\n' +
    '<body>\n' +
    '  <h3>CCAFP Mess Dissemination</h3>\n' +
    '  <div class="form-group">\n' +
    '    <label for="date">Date of Meal</label>\n' +
    '    <input type="date" id="date">\n' +
    '  </div>\n' +
    '  <div class="form-group">\n' +
    '    <label for="meal">Meal Type</label>\n' +
    '    <select id="meal">\n' +
    '      <option value="BREAKFAST">Breakfast</option>\n' +
    '      <option value="LUNCH">Lunch</option>\n' +
    '      <option value="DINNER">Dinner</option>\n' +
    '    </select>\n' +
    '  </div>\n' +
    '  <button class="btn" onclick="submit()">Record Snapshot</button>\n' +
    '\n' +
    '  <script>\n' +
    '    // Set default date to local today\n' +
    '    var today = new Date();\n' +
    '    var dd = String(today.getDate()).padStart(2, "0");\n' +
    '    var mm = String(today.getMonth() + 1).padStart(2, "0");\n' +
    '    var yyyy = today.getFullYear();\n' +
    '    document.getElementById("date").value = yyyy + "-" + mm + "-" + dd;\n' +
    '\n' +
    '    function submit() {\n' +
    '      var btn = document.querySelector(".btn");\n' +
    '      btn.disabled = true;\n' +
    '      btn.innerText = "Recording...";\n' +
    '      \n' +
    '      var dateVal = document.getElementById("date").value;\n' +
    '      var mealVal = document.getElementById("meal").value;\n' +
    '      \n' +
    '      if (!dateVal || !mealVal) {\n' +
    '        alert("Please select both Date and Meal.");\n' +
    '        btn.disabled = false;\n' +
    '        btn.innerText = "Record Snapshot";\n' +
    '        return;\n' +
    '      }\n' +
    '      \n' +
    '      google.script.run\n' +
    '        .withSuccessHandler(function() {\n' +
    '          google.script.host.close();\n' +
    '        })\n' +
    '        .withFailureHandler(function(err) {\n' +
    '          alert("Failed to record: " + err.message);\n' +
    '          btn.disabled = false;\n' +
    '          btn.innerText = "Record Snapshot";\n' +
    '        })\n' +
    '        .processRecording(dateVal, mealVal);\n' +
    '    }\n' +
    '  </script>\n' +
    '</body>\n' +
    '</html>';
}

/**
 * Saves/updates the weekly menu sheet (GID 143586769) with the new 2D array of rows.
 */
function saveWeeklyMenu(rows) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var menuSheet = getSheetByGid(ss, "143586769") || ss.getSheetByName("WEEKLY MENU");
  if (!menuSheet) {
    menuSheet = ss.insertSheet("WEEKLY MENU");
  }
  
  // Clear the existing content to ensure no remnants
  menuSheet.clearContents();
  
  // Write the new rows starting from A1
  var range = menuSheet.getRange(1, 1, rows.length, rows[0].length);
  range.setValues(rows);
  
  // Apply formatting to weekly menu sheet
  formatWeeklyMenuSheet(menuSheet);
  
  return true;
}

/**
 * Appends new unique viands to the Viands Database sheet (GID 166151731).
 */
function saveViands(viandsList) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var viandsSheet = getSheetByGid(ss, "166151731") || ss.getSheetByName("VIANDS");
  if (!viandsSheet) {
    viandsSheet = ss.insertSheet("VIANDS");
  }
  
  var values = viandsSheet.getDataRange().getValues();
  var headers = [];
  
  if (values.length === 0 || values[0].length === 0 || !values[0][0]) {
    // If the sheet is empty, initialize default headers
    headers = [
      "VIAND", "NO FISH", "NO PORK", "NO SEAFOOD", "NO EGG", "NO CHICKEN", "NO BLOOD", 
      "NO PROCESSED FOOD", "NO BEANS", "NO NUTS", "NO TOFU", "NO COFFEE", 
      "NO CHOCOLATE", "NO TOMATOES", "NO SPICY", "NO BEEF", "NO CITRUS", "NO EGGPLANT", 
      "NO JUICE", "NO COCUMBER", "NO SOUR"
    ];
    viandsSheet.appendRow(headers);
    values = [headers];
  } else {
    headers = values[0];
  }
  
  var cleanHeaders = headers.map(function(h) { return h.toString().toUpperCase().trim(); });
  var viandColIdx = cleanHeaders.indexOf("VIAND");
  if (viandColIdx === -1) {
    throw new Error("Required column 'VIAND' was not found in the Viands sheet.");
  }
  
  // Gather existing viand names (case-insensitive, trimmed) to row numbers (1-indexed)
  var viandRowMap = {};
  for (var i = 1; i < values.length; i++) {
    var name = values[i][viandColIdx] ? values[i][viandColIdx].toString().toUpperCase().trim() : "";
    if (name) {
      viandRowMap[name] = i + 1;
    }
  }
  
  // Upsert viands
  viandsList.forEach(function(item) {
    if (!item.viand) return;
    var nameUpper = item.viand.toUpperCase().trim();
    
    var rowData = new Array(headers.length).fill("");
    rowData[viandColIdx] = item.viand.trim(); // Keep original casing
    
    cleanHeaders.forEach(function(header, colIdx) {
      if (colIdx === viandColIdx) return;
      // Check if item's diets contains this header
      if (item.diets && (item.diets[header] === 1 || item.diets[header] === "1" || item.diets[header] === true)) {
        rowData[colIdx] = 1;
      } else {
        rowData[colIdx] = "";
      }
    });
    
    var existingRow = viandRowMap[nameUpper];
    if (existingRow) {
      // Update existing row
      var range = viandsSheet.getRange(existingRow, 1, 1, headers.length);
      range.setValues([rowData]);
    } else {
      // Append new row
      viandsSheet.appendRow(rowData);
      viandRowMap[nameUpper] = viandsSheet.getLastRow(); // update map in case it appears again in batch
    }
  });
  
  // Format the viands sheet
  formatViandsSheet(viandsSheet);
  
  return true;
}

/**
 * Beautiful styling rules applied automatically to the Weekly Menu sheet.
 */
function formatWeeklyMenuSheet(sheet) {
  var lastRow = sheet.getLastRow();
  var lastCol = sheet.getLastColumn();
  if (lastRow < 1) return;
  
  sheet.setFrozenRows(0);
  
  // Days of the week header (pinkish bg, bold white text)
  var headerRange = sheet.getRange(1, 1, 1, lastCol);
  headerRange.setBackground("#D84B61")
             .setFontColor("#FFFFFF")
             .setFontWeight("bold")
             .setHorizontalAlignment("center")
             .setVerticalAlignment("middle");
             
  sheet.setRowHeight(1, 28);
  
  // Apply light borders
  var dataRange = sheet.getRange(1, 1, lastRow, lastCol);
  dataRange.setFontFamily("Arial")
            .setFontSize(10)
            .setVerticalAlignment("middle")
            .setBorder(true, true, true, true, true, true, "#E5E7EB", SpreadsheetApp.BorderStyle.SOLID);
            
  // Apply styles only if there are data rows (lastRow > 1)
  if (lastRow > 1) {
    // Column A labels (bold, right-aligned or left-aligned)
    var labelRange = sheet.getRange(2, 1, lastRow - 1, 1);
    labelRange.setFontWeight("bold")
              .setHorizontalAlignment("left")
              .setBackground("#F3F4F6");
              
    // Center day columns B-H
    if (lastCol > 1) {
      sheet.getRange(2, 2, lastRow - 1, lastCol - 1).setHorizontalAlignment("center");
    }
  }
            
  // Highlight Section Headers (MORNING MESS, NOON MESS, EVENING MESS, PM SNACK)
  var sectionRows = [2, 10, 18, 26];
  sectionRows.forEach(function(row) {
    if (row <= lastRow) {
      var rowRange = sheet.getRange(row, 1, 1, lastCol);
      rowRange.setBackground("#FFE4E7")
              .setFontWeight("bold")
              .setFontColor("#C23E53");
    }
  });
  
  // Auto-resize columns
  for (var col = 1; col <= lastCol; col++) {
    sheet.autoResizeColumn(col);
    var currentWidth = sheet.getColumnWidth(col);
    if (col === 1) {
      sheet.setColumnWidth(col, 130);
    } else {
      sheet.setColumnWidth(col, Math.max(currentWidth + 12, 120));
    }
  }
}

/**
 * Beautiful styling rules applied automatically to the Viands sheet.
 */
function formatViandsSheet(sheet) {
  var lastRow = sheet.getLastRow();
  var lastCol = sheet.getLastColumn();
  if (lastRow < 1) return;
  
  sheet.setFrozenRows(0);
  sheet.setFrozenRows(1);
  
  // Header row (Dark gray bg, bold white text)
  var headerRange = sheet.getRange(1, 1, 1, lastCol);
  headerRange.setBackground("#374151")
             .setFontColor("#FFFFFF")
             .setFontWeight("bold")
             .setHorizontalAlignment("center")
             .setVerticalAlignment("middle");
             
  sheet.setRowHeight(1, 28);
  
  // Apply fonts and borders to the whole sheet
  var fullRange = sheet.getRange(1, 1, lastRow, lastCol);
  fullRange.setFontFamily("Arial")
           .setFontSize(10)
           .setVerticalAlignment("middle")
           .setBorder(true, true, true, true, true, true, "#E5E7EB", SpreadsheetApp.BorderStyle.SOLID);
  
  // Apply data row styling only if there are data rows (lastRow > 1)
  if (lastRow > 1) {
    // Alignments: Viand name left-aligned, other cells centered
    sheet.getRange(2, 1, lastRow - 1, 1).setHorizontalAlignment("left").setFontWeight("bold");
    if (lastCol > 1) {
      sheet.getRange(2, 2, lastRow - 1, lastCol - 1).setHorizontalAlignment("center");
    }
  }
  
  // Auto-resize columns
  for (var col = 1; col <= lastCol; col++) {
    sheet.autoResizeColumn(col);
    var currentWidth = sheet.getColumnWidth(col);
    if (col === 1) {
      sheet.setColumnWidth(col, Math.max(currentWidth + 15, 150));
    } else {
      sheet.setColumnWidth(col, Math.max(currentWidth + 10, 80));
    }
  }
}
