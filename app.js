"use strict";

const ANCHOR = { year: 2026, month: 7, day: 1 };
const SCHEDULE_START_DATE = new Date(2026, 6, 1);
const SCHEDULE_END_DATE = new Date(2100, 11, 1);
const WEEKDAYS = ["星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六"];
const LEGAL_HOLIDAY_CACHE = new Map();
const SOLAR_TERM_MINUTES = [0, 21208, 42467, 63836, 85337, 107014, 128867, 150921, 173149, 195551, 218072, 240693, 263343, 285989, 308563, 331033, 353350, 375494, 397447, 419210, 440795, 462224, 483532, 504758];
// 1900—2100 年农历闰月及大小月数据表，用于离线换算，不依赖浏览器农历实现。
const LUNAR_INFO = [
  0x04bd8,0x04ae0,0x0a570,0x054d5,0x0d260,0x0d950,0x16554,0x056a0,0x09ad0,0x055d2,
  0x04ae0,0x0a5b6,0x0a4d0,0x0d250,0x1d255,0x0b540,0x0d6a0,0x0ada2,0x095b0,0x14977,
  0x04970,0x0a4b0,0x0b4b5,0x06a50,0x06d40,0x1ab54,0x02b60,0x09570,0x052f2,0x04970,
  0x06566,0x0d4a0,0x0ea50,0x06e95,0x05ad0,0x02b60,0x186e3,0x092e0,0x1c8d7,0x0c950,
  0x0d4a0,0x1d8a6,0x0b550,0x056a0,0x1a5b4,0x025d0,0x092d0,0x0d2b2,0x0a950,0x0b557,
  0x06ca0,0x0b550,0x15355,0x04da0,0x0a5b0,0x14573,0x052b0,0x0a9a8,0x0e950,0x06aa0,
  0x0aea6,0x0ab50,0x04b60,0x0aae4,0x0a570,0x05260,0x0f263,0x0d950,0x05b57,0x056a0,
  0x096d0,0x04dd5,0x04ad0,0x0a4d0,0x0d4d4,0x0d250,0x0d558,0x0b540,0x0b6a0,0x195a6,
  0x095b0,0x049b0,0x0a974,0x0a4b0,0x0b27a,0x06a50,0x06d40,0x0af46,0x0ab60,0x09570,
  0x04af5,0x04970,0x064b0,0x074a3,0x0ea50,0x06b58,0x05ac0,0x0ab60,0x096d5,0x092e0,
  0x0c960,0x0d954,0x0d4a0,0x0da50,0x07552,0x056a0,0x0abb7,0x025d0,0x092d0,0x0cab5,
  0x0a950,0x0b4a0,0x0baa4,0x0ad50,0x055d9,0x04ba0,0x0a5b0,0x15176,0x052b0,0x0a930,
  0x07954,0x06aa0,0x0ad50,0x05b52,0x04b60,0x0a6e6,0x0a4e0,0x0d260,0x0ea65,0x0d530,
  0x05aa0,0x076a3,0x096d0,0x04afb,0x04ad0,0x0a4d0,0x1d0b6,0x0d250,0x0d520,0x0dd45,
  0x0b5a0,0x056d0,0x055b2,0x049b0,0x0a577,0x0a4b0,0x0aa50,0x1b255,0x06d20,0x0ada0,
  0x14b63,0x09370,0x049f8,0x04970,0x064b0,0x168a6,0x0ea50,0x06b20,0x1a6c4,0x0aae0,
  0x092e0,0x0d2e3,0x0c960,0x0d557,0x0d4a0,0x0da50,0x05d55,0x056a0,0x0a6d0,0x055d4,
  0x052d0,0x0a9b8,0x0a950,0x0b4a0,0x0b6a6,0x0ad50,0x055a0,0x0aba4,0x0a5b0,0x052b0,
  0x0b273,0x06930,0x07337,0x06aa0,0x0ad50,0x14b55,0x04b60,0x0a570,0x054e4,0x0d160,
  0x0e968,0x0d520,0x0daa0,0x16aa6,0x056d0,0x04ae0,0x0a9d4,0x0a4d0,0x0d150,0x0f252,
  0x0d520
];

// 图片中的 2026-07-01 至 2026-08-18；其余七位人员每 49 天重复一次。
const staff = [
  { name: "陶", type: "weekly" },
  {
    name: "杨",
    cycle: ["休", "休", "休", "早+中", "早", "晚", "休", "休", "休", "早+中", "早", "中+晚", "休", "休", "休", "早+中", "休", "中+晚", "晚", "休", "休", "早+中", "休", "中+晚", "晚", "休", "休", "中+晚", "休", "中+晚", "晚", "休", "休", "中", "中", "晚", "晚", "休", "休", "休", "早", "早", "中+晚", "休", "休", "休", "早+中", "晚", "晚"]
  },
  {
    name: "李",
    cycle: ["休", "休", "早+中", "早", "中+晚", "休", "休", "休", "早+中", "休", "中+晚", "晚", "休", "休", "早+中", "休", "中+晚", "晚", "休", "休", "中+晚", "休", "中+晚", "晚", "休", "休", "中", "中", "晚", "晚", "休", "休", "休", "早", "早", "中+晚", "休", "休", "休", "早+中", "晚", "晚", "休", "休", "休", "早+中", "早", "晚", "休"]
  },
  {
    name: "张",
    cycle: ["休", "早+中", "休", "中+晚", "晚", "休", "休", "早+中", "休", "中+晚", "晚", "休", "休", "中+晚", "休", "中+晚", "晚", "休", "休", "中", "中", "晚", "晚", "休", "休", "休", "早", "早", "中+晚", "休", "休", "休", "早+中", "晚", "晚", "休", "休", "休", "早+中", "早", "晚", "休", "休", "休", "早+中", "早", "中+晚", "休", "休"]
  },
  {
    name: "龚",
    cycle: ["早+中", "休", "中+晚", "晚", "休", "休", "中+晚", "休", "中+晚", "晚", "休", "休", "中", "中", "晚", "晚", "休", "休", "休", "早", "早", "中+晚", "休", "休", "休", "早+中", "晚", "晚", "休", "休", "休", "早+中", "早", "晚", "休", "休", "休", "早+中", "早", "中+晚", "休", "休", "休", "早+中", "休", "中+晚", "晚", "休", "休"]
  },
  {
    name: "黎",
    cycle: ["休", "中+晚", "晚", "休", "休", "中", "中", "晚", "晚", "休", "休", "休", "早", "早", "中+晚", "休", "休", "休", "早+中", "晚", "晚", "休", "休", "休", "早+中", "早", "晚", "休", "休", "休", "早+中", "早", "中+晚", "休", "休", "休", "早+中", "休", "中+晚", "晚", "休", "休", "早+中", "休", "中+晚", "晚", "休", "休", "中+晚"]
  },
  {
    name: "胡",
    cycle: ["晚", "晚", "休", "休", "休", "早", "早", "中+晚", "休", "休", "休", "早+中", "晚", "晚", "休", "休", "休", "早+中", "早", "晚", "休", "休", "休", "早+中", "早", "中+晚", "休", "休", "休", "早+中", "休", "中+晚", "晚", "休", "休", "早+中", "休", "中+晚", "晚", "休", "休", "中+晚", "休", "中+晚", "晚", "休", "休", "中", "中"]
  },
  {
    name: "孙",
    cycle: ["中+晚", "休", "休", "休", "早+中", "晚", "晚", "休", "休", "休", "早+中", "早", "晚", "休", "休", "休", "早+中", "早", "中+晚", "休", "休", "休", "早+中", "休", "中+晚", "晚", "休", "休", "早+中", "休", "中+晚", "晚", "休", "休", "中+晚", "休", "中+晚", "晚", "休", "休", "中", "中", "晚", "晚", "休", "休", "休", "早", "早"]
  }
];

const yearInput = document.querySelector("#year-input");
const monthInput = document.querySelector("#month-input");
const table = document.querySelector("#schedule-table");
const tableScroll = document.querySelector(".table-scroll");
const scheduleCrosshair = document.querySelector("#schedule-crosshair");
const legalOvertimeOverlays = document.querySelector("#legal-overtime-overlays");
const mobileSchedule = document.querySelector("#mobile-schedule");
const scheduleFullscreenButton = document.querySelector("#schedule-fullscreen");
const summaryTitle = document.querySelector("#summary-title");
const monthlySummary = document.querySelector("#monthly-summary");
const todayTitle = document.querySelector("#today-title");
const todaySchedule = document.querySelector("#today-schedule");
const holidaySummaryTitle = document.querySelector("#holiday-summary-title");
const holidaySummary = document.querySelector("#holiday-summary");
const holidayYearKicker = document.querySelector("#holiday-year-kicker");
const holidayYearInput = document.querySelector("#holiday-year-input");
const desktopLoginAvatar = document.querySelector("#desktop-login-avatar");
const desktopScheduleActions = document.querySelector("#desktop-schedule-actions");
const saveScheduleChangesButton = document.querySelector("#save-schedule-changes");
const restoreScheduleChangesButton = document.querySelector("#restore-schedule-changes");
const restoreDefaultScheduleButton = document.querySelector("#restore-default-schedule");
const loginDialog = document.querySelector("#login-dialog");
const loginForm = document.querySelector("#login-form");
const loginAccount = document.querySelector("#login-account");
const loginPassword = document.querySelector("#login-password");
const loginFeedback = document.querySelector("#login-feedback");
const logoutDialog = document.querySelector("#logout-dialog");
const scheduleActionDialog = document.querySelector("#schedule-action-dialog");
const scheduleActionDialogTitle = document.querySelector("#schedule-action-dialog-title");
const scheduleActionDialogMessage = document.querySelector("#schedule-action-dialog-message");
const scheduleActionConfirm = document.querySelector("#schedule-action-confirm");
const copyFeedback = document.querySelector("#copy-feedback");
const shiftOverrides = {};
const SCHEDULE_STORAGE_KEY = "duty-roster-saved-overrides";
let savedShiftOverrides = loadSavedOverrides();
let loggedIn = false;
let copyFeedbackTimer = null;
let pendingScheduleAction = null;
const GOLD_FLOW_DURATION_MS = 1800;

document.querySelector(".legend").insertAdjacentHTML(
  "beforeend",
  "<span id=\"legal-holiday-legend\"><i class=\"legend-swatch legal-overtime\"></i>无</span>"
);

let displayedDate = getInitialDate();
let dragStartCell = null;
let dragStartPoint = null;
let didDrag = false;
let longPressTimer = null;
let exchangeMode = false;
let exchangeTargetCell = null;
let exchangeSource = null;
let splitOptionCell = null;
let dragSourcePart = null;
let dragSourcePartElement = null;
let headerRangeStartDay = null;
let suppressNextRangeClear = false;
let scheduleFullscreenScrollTop = 0;
let mobileSwipeStart = null;

function getInitialDate() {
  const today = new Date();
  return today < SCHEDULE_START_DATE ? new Date(SCHEDULE_START_DATE) : new Date(today.getFullYear(), today.getMonth(), 1);
}

// 让每次重绘出的鎏金边框接入同一时间轴，避免拆分、移动等操作后从头闪烁。
function goldFlowDelay() {
  return `-${Date.now() % GOLD_FLOW_DURATION_MS}ms`;
}

function dateFromIso(iso) {
  const [year, month, day] = iso.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function toIso(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function addDays(date, days) {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy;
}

function lunarLeapMonth(year) {
  return LUNAR_INFO[year - 1900] & 0xf;
}

function lunarLeapDays(year) {
  const leapMonth = lunarLeapMonth(year);
  return leapMonth ? (LUNAR_INFO[year - 1900] & 0x10000 ? 30 : 29) : 0;
}

function lunarMonthDays(year, month) {
  return LUNAR_INFO[year - 1900] & (0x10000 >> month) ? 30 : 29;
}

function lunarYearDays(year) {
  let days = 348;
  for (let bit = 0x8000; bit > 0x8; bit >>= 1) {
    if (LUNAR_INFO[year - 1900] & bit) days += 1;
  }
  return days + lunarLeapDays(year);
}

function findLunarFestivalDate(year, month, day) {
  if (year < 1900 || year > 2100 || month < 1 || month > 12) return null;

  let offset = day - 1;
  for (let lunarYear = 1900; lunarYear < year; lunarYear += 1) offset += lunarYearDays(lunarYear);
  for (let lunarMonth = 1; lunarMonth < month; lunarMonth += 1) {
    offset += lunarMonthDays(year, lunarMonth);
    if (lunarLeapMonth(year) === lunarMonth) offset += lunarLeapDays(year);
  }

  return addDays(new Date(1900, 0, 31), offset);
}

function qingmingDate(year) {
  const base = Date.UTC(1900, 0, 6, 2, 5);
  const timestamp = base + 31556925974.7 * (year - 1900) + SOLAR_TERM_MINUTES[6] * 60000;
  const date = new Date(timestamp);
  return new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
}

function addLegalHoliday(holidays, date, name) {
  holidays.set(toIso(date), name);
}

function legalHolidaysForYear(year) {
  if (LEGAL_HOLIDAY_CACHE.has(year)) return LEGAL_HOLIDAY_CACHE.get(year);

  const holidays = new Map();
  addLegalHoliday(holidays, new Date(year, 0, 1), "元旦");
  addLegalHoliday(holidays, qingmingDate(year), "清明节");
  addLegalHoliday(holidays, new Date(year, 4, 1), "劳动节");
  addLegalHoliday(holidays, new Date(year, 4, 2), "劳动节");
  addLegalHoliday(holidays, new Date(year, 9, 1), "国庆节");
  addLegalHoliday(holidays, new Date(year, 9, 2), "国庆节");
  addLegalHoliday(holidays, new Date(year, 9, 3), "国庆节");

  const springFestival = findLunarFestivalDate(year, 1, 1);
  if (springFestival) {
    [-1, 0, 1, 2].forEach((offset) => addLegalHoliday(holidays, addDays(springFestival, offset), "春节"));
  }
  const dragonBoatFestival = findLunarFestivalDate(year, 5, 5);
  if (dragonBoatFestival) addLegalHoliday(holidays, dragonBoatFestival, "端午节");
  const midAutumnFestival = findLunarFestivalDate(year, 8, 15);
  if (midAutumnFestival) addLegalHoliday(holidays, midAutumnFestival, "中秋节");

  LEGAL_HOLIDAY_CACHE.set(year, holidays);
  return holidays;
}

function legalHolidayName(date) {
  return legalHolidaysForYear(date.getFullYear()).get(toIso(date)) || "";
}

function isLegalOvertimeDate(date) {
  return Boolean(legalHolidayName(date));
}

function dateDifferenceInDays(date) {
  const start = Date.UTC(ANCHOR.year, ANCHOR.month - 1, ANCHOR.day);
  const target = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
  return Math.round((target - start) / 86400000);
}

function positiveModulo(value, divisor) {
  return ((value % divisor) + divisor) % divisor;
}

function overrideKey(name, date) {
  return `${name}|${toIso(date)}`;
}

function getShift(name, date) {
  const key = overrideKey(name, date);
  if (Object.prototype.hasOwnProperty.call(shiftOverrides, key)) return shiftOverrides[key];

  return getBaseShift(name, date);
}

function getBaseShift(name, date) {
  const person = staff.find((item) => item.name === name);
  if (!person) return "";

  if (person.type === "weekly") {
    const weekday = date.getDay();
    if (weekday === 0 || weekday === 6) return "休";
    return weekday === 1 ? "早+中" : "早";
  }

  return person.cycle[positiveModulo(dateDifferenceInDays(date), 49)];
}

function setShiftOverride(name, date, shift) {
  const key = overrideKey(name, date);
  if (shift === getBaseShift(name, date)) delete shiftOverrides[key];
  else shiftOverrides[key] = shift;
}

function loadSavedOverrides() {
  try {
    const parsed = JSON.parse(localStorage.getItem(SCHEDULE_STORAGE_KEY) || "{}");
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
    return Object.fromEntries(Object.entries(parsed).filter(([key, value]) => (
      typeof key === "string" && typeof value === "string" && /^[休早中晚+|]+$/.test(value)
    )));
  } catch (_) {
    return {};
  }
}

function replaceShiftOverrides(overrides) {
  Object.keys(shiftOverrides).forEach((key) => delete shiftOverrides[key]);
  Object.assign(shiftOverrides, overrides);
}

function overridesMatch(first, second) {
  const firstKeys = Object.keys(first).sort();
  const secondKeys = Object.keys(second).sort();
  return firstKeys.length === secondKeys.length && firstKeys.every((key, index) => key === secondKeys[index] && first[key] === second[key]);
}

function hasUnsavedScheduleChanges() {
  return !overridesMatch(shiftOverrides, savedShiftOverrides);
}

function overrideBelongsToDisplayedMonth(key) {
  const month = String(displayedDate.getMonth() + 1).padStart(2, "0");
  const prefix = `${displayedDate.getFullYear()}-${month}-`;
  return key.includes(`|${prefix}`);
}

function hasOverridesInDisplayedMonth(overrides) {
  return Object.entries(overrides).some(([key, shift]) => {
    if (!overrideBelongsToDisplayedMonth(key)) return false;
    const separatorIndex = key.lastIndexOf("|");
    if (separatorIndex < 1) return false;
    const name = key.slice(0, separatorIndex);
    const date = dateFromIso(key.slice(separatorIndex + 1));
    return Boolean(date) && shift !== getBaseShift(name, date);
  });
}

function overridesForDisplayedMonth(overrides) {
  return Object.fromEntries(
    Object.entries(overrides).filter(([key]) => overrideBelongsToDisplayedMonth(key))
  );
}

function hasUnsavedScheduleChangesInDisplayedMonth() {
  return !overridesMatch(
    overridesForDisplayedMonth(shiftOverrides),
    overridesForDisplayedMonth(savedShiftOverrides)
  );
}

function shiftParts(shift) {
  return String(shift).split("|");
}

function displayShift(shift) {
  return shiftParts(shift).join(" / ");
}

function shiftCellContent(shift) {
  const parts = shiftParts(shift);
  if (parts.length === 1) {
    const compactShift = shift.replace("+", "");
    return `<span class="shift-full">${shift}</span><span class="shift-compact" aria-label="${shift}">${compactShift}</span>`;
  }
  return `<span class="split-shift" data-shift-part="${parts[0]}">${parts[0]}</span><span class="split-divider" aria-hidden="true"></span><span class="split-shift" data-shift-part="${parts[1]}">${parts[1]}</span>`;
}

function isSplittableShift(shift) {
  return shift === "\u65e9+\u4e2d" || shift === "\u4e2d+\u665a";
}

function cellClass(shift) {
  if (shift === "休") return "rest";
  return shift.includes("晚") ? "night" : "day";
}

function renderMonth(year, monthIndex) {
  const requestedDate = new Date(year, monthIndex, 1);
  displayedDate = requestedDate < SCHEDULE_START_DATE ? new Date(SCHEDULE_START_DATE) : requestedDate > SCHEDULE_END_DATE ? new Date(SCHEDULE_END_DATE) : requestedDate;
  const displayYear = displayedDate.getFullYear();
  const displayMonthIndex = displayedDate.getMonth();
  const numberOfDays = new Date(displayYear, displayMonthIndex + 1, 0).getDate();

  yearInput.value = displayYear;
  monthInput.value = displayMonthIndex + 1;
  document.querySelector("#previous-month").disabled = displayedDate.getTime() <= SCHEDULE_START_DATE.getTime();
  document.querySelector("#next-month").disabled = displayedDate.getTime() >= SCHEDULE_END_DATE.getTime();
  document.querySelector("#month-title").textContent = `${displayYear} 年 ${displayMonthIndex + 1} 月值班表`;

  const dates = Array.from({ length: numberOfDays }, (_, index) => new Date(displayYear, displayMonthIndex, index + 1));
  const dateHeader = dates.map((date, index) => {
    const holidayClass = isLegalOvertimeDate(date) ? " legal-overtime" : "";
    const holidayTitle = isLegalOvertimeDate(date) ? " title=\"法定节假日加班工资日\"" : "";
    return `<th data-day-index="${index}" class="${isWeekend(date) ? "weekend" : ""}${holidayClass}" scope="col"${holidayTitle}>${date.getDate()}</th>`;
  }).join("");
  const weekdayHeader = dates.map((date, index) => {
    const holidayClass = isLegalOvertimeDate(date) ? " legal-overtime" : "";
    const holidayTitle = isLegalOvertimeDate(date) ? " title=\"法定节假日加班工资日\"" : "";
    const weekday = WEEKDAYS[date.getDay()];
    const weekdayLabel = weekday.replace("星期", "");
    return `<th data-day-index="${index}" class="weekday ${isWeekend(date) ? "weekend" : ""}${holidayClass}" scope="col"${holidayTitle}><span class="weekday-full">${weekdayLabel}</span><span class="weekday-short" aria-label="${weekday}">${weekdayLabel}</span></th>`;
  }).join("");
  const rows = staff.map((person, staffIndex) => {
    const cells = dates.map((date, index) => {
      const shift = getShift(person.name, date);
      const splitCellClass = shiftParts(shift).length > 1 ? " split-cell" : "";
      const holidayClass = isLegalOvertimeDate(date) ? " legal-overtime" : "";
      const holidayTitle = isLegalOvertimeDate(date) ? " title=\"法定节假日加班工资日\"" : "";
      return `<td data-row-index="${staffIndex}" data-day-index="${index}" class="${cellClass(shift)}${splitCellClass}${holidayClass}"${holidayTitle}>${shiftCellContent(shift)}</td>`;
    }).join("");
    return `<tr data-row-index="${staffIndex}"><th class="staff-name" scope="row">${person.name}</th>${cells}</tr>`;
  }).join("");

  table.innerHTML = `
    <thead>
      <tr><th class="corner" scope="col">日期</th>${dateHeader}</tr>
      <tr><th class="corner" scope="col">星期</th>${weekdayHeader}</tr>
    </thead>
    <tbody>${rows}</tbody>`;

  scheduleCrosshair.classList.remove("is-visible");
  renderLegalOvertimeOverlays(dates);
  updateLegalHolidayLegend(dates);

  renderMobileSchedule(dates);
  renderMonthlySummary(dates);
  renderTodaySchedule();
  holidayYearInput.value = displayYear;
  renderHolidaySummary(displayYear);
  updateScheduleActionButtons();
}

function updateLegalHolidayLegend(dates) {
  const holidayNames = [...new Set(dates.map(legalHolidayName).filter(Boolean))];
  document.querySelector("#legal-holiday-legend").innerHTML = `<i class="legend-swatch legal-overtime"></i>${holidayNames.length ? holidayNames.join("、") : "无"}`;
}

function positionLegalOvertimeOverlays() {
  const containerBox = tableScroll.getBoundingClientRect();
  legalOvertimeOverlays.querySelectorAll(".legal-overtime-column").forEach((overlay) => {
    const startIndex = overlay.dataset.startIndex;
    const endIndex = overlay.dataset.endIndex;
    const firstHeader = table.querySelector(`thead th[data-day-index="${startIndex}"]`);
    const lastHeader = table.querySelector(`thead th[data-day-index="${endIndex}"]`);
    const lastCell = table.querySelector(`tbody tr:last-child td[data-day-index="${endIndex}"]`);
    if (!firstHeader || !lastHeader || !lastCell) return;
    const firstHeaderBox = firstHeader.getBoundingClientRect();
    const lastHeaderBox = lastHeader.getBoundingClientRect();
    const lastCellBox = lastCell.getBoundingClientRect();
    overlay.style.left = `${firstHeaderBox.left - containerBox.left}px`;
    overlay.style.top = `${firstHeaderBox.top - containerBox.top}px`;
    overlay.style.width = `${lastHeaderBox.right - firstHeaderBox.left}px`;
    overlay.style.height = `${lastCellBox.bottom - firstHeaderBox.top}px`;
  });
}

function renderLegalOvertimeOverlays(dates) {
  const groups = [];
  let index = 0;
  while (index < dates.length) {
    if (!isLegalOvertimeDate(dates[index])) {
      index += 1;
      continue;
    }
    const startIndex = index;
    while (index + 1 < dates.length && isLegalOvertimeDate(dates[index + 1])) index += 1;
    groups.push({ startIndex, endIndex: index });
    index += 1;
  }

  const flowDelay = goldFlowDelay();
  legalOvertimeOverlays.innerHTML = groups
    .map((group) => `<div class="legal-overtime-column" style="animation-delay: ${flowDelay}" data-start-index="${group.startIndex}" data-end-index="${group.endIndex}"></div>`)
    .join("");
  window.requestAnimationFrame(positionLegalOvertimeOverlays);
}

function renderMobileSchedule(dates) {
  mobileSchedule.innerHTML = dates.map((date) => {
    const legalOvertime = isLegalOvertimeDate(date);
    const flowStyle = legalOvertime ? ` style="animation-delay: ${goldFlowDelay()}"` : "";
    const shifts = staff.map((person) => {
      const shift = getShift(person.name, date);
      return `<div class="mobile-shift"><span class="mobile-shift-name">${person.name}</span><span class="mobile-shift-badge ${cellClass(shift)}">${displayShift(shift)}</span></div>`;
    }).join("");
    return `<article class="mobile-day-card${isWeekend(date) ? " weekend-day" : ""}${legalOvertime ? " legal-overtime" : ""}" data-schedule-date="${toIso(date)}"${flowStyle}><header class="mobile-day-heading ${isWeekend(date) ? "weekend" : ""}"><span class="mobile-day-number">${date.getMonth() + 1} 月 ${date.getDate()} 日</span><span class="mobile-day-weekday">${WEEKDAYS[date.getDay()]}</span></header><div class="mobile-shifts">${shifts}</div></article>`;
  }).join("");
}

function renderMonthlySummary(dates) {
  const firstDate = dates[0];
  summaryTitle.textContent = `${firstDate.getFullYear()} 年 ${firstDate.getMonth() + 1} 月值班统计`;
  monthlySummary.innerHTML = staff.map((person) => {
    const statistics = dates.reduce((total, date) => {
      const shift = getShift(person.name, date);
      if (shift !== "休") total.workDays += 1;
      if (shift.includes("晚")) total.nightDays += 1;
      if (shift.includes("+") || shiftParts(shift).length > 1) total.doubleShiftDays += 1;
      return total;
    }, { workDays: 0, nightDays: 0, doubleShiftDays: 0 });

    return `<article class="summary-card" role="listitem"><strong class="summary-name">${person.name}</strong><dl class="summary-values"><div><dt>上班</dt><dd>${statistics.workDays}<small>天</small></dd></div><div><dt>夜班</dt><dd>${statistics.nightDays}<small>天</small></dd></div><div><dt>双班次</dt><dd>${statistics.doubleShiftDays}<small>天</small></dd></div></dl></article>`;
  }).join("");
}

function countShiftSessions(shift) {
  if (shift === "休") return 0;
  if (shift.includes("+")) return shift.split("+").filter(Boolean).length;
  return shiftParts(shift).filter((part) => part !== "休").length;
}

function renderHolidaySummary(year) {
  const holidayDatesByName = new Map();
  const currentSpringFestival = findLunarFestivalDate(year, 1, 1);
  const nextSpringFestival = findLunarFestivalDate(year + 1, 1, 1);
  const periodStart = currentSpringFestival ? addDays(currentSpringFestival, 3) : new Date(year, 0, 1);
  const periodEnd = nextSpringFestival ? addDays(nextSpringFestival, -1) : new Date(year + 1, 0, 1);
  const holidayEntries = [
    ...legalHolidaysForYear(year).entries(),
    ...(year < 2100 ? legalHolidaysForYear(year + 1).entries() : [])
  ];

  holidayEntries
    .filter(([, holidayName]) => holidayName !== "春节")
    .forEach(([iso, holidayName]) => {
      const date = dateFromIso(iso);
      if (date < periodStart || date >= periodEnd || date < SCHEDULE_START_DATE || date > new Date(2100, 11, 31)) return;
      if (!holidayDatesByName.has(holidayName)) holidayDatesByName.set(holidayName, []);
      holidayDatesByName.get(holidayName).push(date);
    });

  const holidayNames = [...holidayDatesByName.entries()]
    .sort(([, firstDates], [, secondDates]) => firstDates[0] - secondDates[0])
    .map(([holidayName]) => holidayName);
  holidayYearKicker.textContent = `${year} 年`;
  holidaySummaryTitle.textContent = "节假日班次统计";
  const headers = holidayNames.map((holidayName) => `<th scope="col">${holidayName}</th>`).join("");
  const rows = staff.map((person) => {
    const sessionsByHoliday = holidayNames.map((holidayName) => {
      const sessions = holidayDatesByName.get(holidayName)
        .reduce((total, date) => total + countShiftSessions(getShift(person.name, date)), 0);
      return sessions;
    });
    const cells = sessionsByHoliday.map((sessions) => `<td>${sessions}</td>`).join("");
    const totalSessions = sessionsByHoliday.reduce((total, sessions) => total + sessions, 0);
    return `<tr><th scope="row">${person.name}</th>${cells}<td>${totalSessions}</td></tr>`;
  }).join("");
  holidaySummary.innerHTML = `<table class="holiday-summary-table"><thead><tr><th scope="col">人员</th>${headers}<th scope="col">总计</th></tr></thead><tbody>${rows}</tbody></table>`;
}

function isWeekend(date) {
  return date.getDay() === 0 || date.getDay() === 6;
}

function todayScheduleDate() {
  const today = new Date();
  const lastAvailableDay = new Date(2100, 11, 31);
  if (today < SCHEDULE_START_DATE) return new Date(SCHEDULE_START_DATE);
  if (today > lastAvailableDay) return lastAvailableDay;
  return today;
}

function renderTodaySchedule() {
  const date = todayScheduleDate();
  const weekendClass = isWeekend(date) ? " weekend" : "";
  todayTitle.textContent = `今日排班：${date.getFullYear()} 年 ${date.getMonth() + 1} 月 ${date.getDate()} 日（${WEEKDAYS[date.getDay()]}）`;
  const shifts = staff.map((person) => {
    const shift = getShift(person.name, date);
    return `<div class="mobile-shift"><span class="mobile-shift-name">${person.name}</span><span class="mobile-shift-badge ${cellClass(shift)}">${displayShift(shift)}</span></div>`;
  }).join("");
  todaySchedule.innerHTML = `<article class="mobile-day-card today-day-card"><header class="mobile-day-heading${weekendClass}"><span class="mobile-day-number">今日 · ${date.getMonth() + 1} 月 ${date.getDate()} 日</span><span class="mobile-day-weekday">${WEEKDAYS[date.getDay()]}</span></header><div class="mobile-shifts">${shifts}</div></article>`;
}

function changeMonth(offset) {
  renderMonth(displayedDate.getFullYear(), displayedDate.getMonth() + offset);
}

function updateScheduleFullscreenState(active) {
  document.body.classList.toggle("is-schedule-fullscreen", active);
  scheduleFullscreenButton.textContent = active ? "× 退出" : "⛶ 全屏";
  scheduleFullscreenButton.setAttribute("aria-pressed", String(active));
  window.requestAnimationFrame(positionLegalOvertimeOverlays);
  if (!active) restoreSchedulePagePosition();
}

function restoreSchedulePagePosition() {
  // 浏览器退出全屏时会重新显示工具栏并改变可视高度，延后恢复能避免页面向上跳动。
  window.setTimeout(() => {
    const maximumTop = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
    window.scrollTo({ top: Math.min(scheduleFullscreenScrollTop, maximumTop), behavior: "auto" });
  }, 80);
}

function requestLandscapeOrientation() {
  try {
    const lockRequest = screen.orientation?.lock?.("landscape");
    lockRequest?.catch?.(() => {});
  } catch (_) {
    // 部分内置浏览器不支持方向锁定，用户仍可手动横置手机。
  }
}

function releaseOrientation() {
  try {
    screen.orientation?.unlock?.();
  } catch (_) {
    // 不支持方向控制的浏览器无需额外处理。
  }
}

function toggleScheduleFullscreen() {
  const active = document.body.classList.contains("is-schedule-fullscreen");
  if (active) {
    updateScheduleFullscreenState(false);
    releaseOrientation();
    return;
  }

  scheduleFullscreenScrollTop = window.scrollY;
  updateScheduleFullscreenState(true);
  // 不依赖各浏览器不稳定的系统全屏接口，确保“退出”能立即响应。
  requestLandscapeOrientation();
}

document.querySelector("#go-month").addEventListener("click", () => {
  const year = Number(yearInput.value);
  const month = Number(monthInput.value);
  if (!Number.isInteger(year) || !Number.isInteger(month) || year < 2026 || year > 2100 || month < 1 || month > 12 || new Date(year, month - 1, 1) < SCHEDULE_START_DATE) {
    window.alert("排班表仅提供 2026 年 7 月至 2100 年的月份。");
    return;
  }
  renderMonth(year, month - 1);
});

document.querySelector("#holiday-summary-form").addEventListener("submit", (event) => {
  event.preventDefault();
  const year = Number(holidayYearInput.value);
  if (!Number.isInteger(year) || year < 2026 || year > 2100) {
    window.alert("请选择 2026 至 2100 年。");
    return;
  }
  renderHolidaySummary(year);
});

document.querySelector("#previous-month").addEventListener("click", () => changeMonth(-1));
document.querySelector("#next-month").addEventListener("click", () => changeMonth(1));
document.querySelector("#return-current-month").addEventListener("click", () => {
  const today = new Date();
  renderMonth(today.getFullYear(), today.getMonth());
});

document.addEventListener("keydown", (event) => {
  if (!window.matchMedia("(min-width: 761px)").matches) return;
  if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;

  if (exchangeMode && exchangeSource) {
    event.preventDefault();
    if (!event.repeat) {
      clearExchangePreview();
      changeMonth(event.key === "ArrowLeft" ? -1 : 1);
    }
    return;
  }

  const target = event.target;
  if (target.matches("input, select, textarea, button") || target.isContentEditable) return;

  event.preventDefault();
  changeMonth(event.key === "ArrowLeft" ? -1 : 1);
});

mobileSchedule.addEventListener("touchstart", (event) => {
  if (event.touches.length !== 1) {
    mobileSwipeStart = null;
    return;
  }
  const touch = event.touches[0];
  mobileSwipeStart = { x: touch.clientX, y: touch.clientY };
}, { passive: true });

mobileSchedule.addEventListener("touchend", (event) => {
  if (!mobileSwipeStart || event.changedTouches.length !== 1) {
    mobileSwipeStart = null;
    return;
  }
  const touch = event.changedTouches[0];
  const horizontalDistance = touch.clientX - mobileSwipeStart.x;
  const verticalDistance = touch.clientY - mobileSwipeStart.y;
  mobileSwipeStart = null;

  // 仅识别明显的横向滑动，不影响上下滚动查看每日卡片。
  if (Math.abs(horizontalDistance) < 60 || Math.abs(horizontalDistance) <= Math.abs(verticalDistance) * 1.35) return;
  changeMonth(horizontalDistance < 0 ? 1 : -1);
}, { passive: true });
mobileSchedule.addEventListener("touchcancel", () => {
  mobileSwipeStart = null;
}, { passive: true });

table.addEventListener("click", (event) => {
  if (didDrag) {
    event.stopPropagation();
    return;
  }
  const cell = event.target.closest("td");
  if (!cell) return;

  showSchedulePosition(cell);
});

// 日期/星期表头选列后不让点击事件冒泡到页面，标红会一直保留到用户点击其他位置。
table.addEventListener("click", (event) => {
  if (event.target.closest("thead th[data-day-index]")) event.stopPropagation();
});

function showSchedulePosition(cell) {
  table.querySelectorAll("td.is-selected").forEach((item) => item.classList.remove("is-selected"));
  cell.classList.add("is-selected");

  const cellBox = cell.getBoundingClientRect();
  const tableBox = tableScroll.getBoundingClientRect();
  scheduleCrosshair.style.setProperty("--cross-x", `${cellBox.left - tableBox.left + cellBox.width / 2}px`);
  scheduleCrosshair.style.setProperty("--cross-y", `${cellBox.top - tableBox.top + cellBox.height / 2}px`);
  scheduleCrosshair.classList.add("is-visible");
}

function highlightRange(endCell) {
  if (!dragStartCell) return;
  const startRow = Number(dragStartCell.dataset.rowIndex);
  const startDay = Number(dragStartCell.dataset.dayIndex);
  const endRow = Number(endCell.dataset.rowIndex);
  const endDay = Number(endCell.dataset.dayIndex);
  const minRow = Math.min(startRow, endRow);
  const maxRow = Math.max(startRow, endRow);
  const minDay = Math.min(startDay, endDay);
  const maxDay = Math.max(startDay, endDay);

  clearRangeHighlight();
  table.querySelectorAll("td[data-row-index][data-day-index]").forEach((cell) => {
    const row = Number(cell.dataset.rowIndex);
    const day = Number(cell.dataset.dayIndex);
    if (row >= minRow && row <= maxRow && day >= minDay && day <= maxDay) {
      cell.classList.add("is-range-highlight");
    }
  });
  table.querySelectorAll("thead [data-day-index]").forEach((header) => {
    const day = Number(header.dataset.dayIndex);
    if (day >= minDay && day <= maxDay) header.classList.add("is-range-date");
  });
}

function highlightDateColumns(startDay, endDay) {
  const firstDay = Math.min(startDay, endDay);
  const lastDay = Math.max(startDay, endDay);
  clearRangeHighlight();
  table.querySelectorAll("td[data-day-index]").forEach((cell) => {
    const day = Number(cell.dataset.dayIndex);
    if (day >= firstDay && day <= lastDay) cell.classList.add("is-range-highlight");
  });
  table.querySelectorAll("thead [data-day-index]").forEach((header) => {
    const day = Number(header.dataset.dayIndex);
    if (day >= firstDay && day <= lastDay) header.classList.add("is-range-date");
  });
}

function clearRangeHighlight() {
  table.querySelectorAll(".is-range-highlight, .is-range-date").forEach((item) => {
    item.classList.remove("is-range-highlight", "is-range-date");
  });
}

function clearSchedulePosition() {
  scheduleCrosshair.classList.remove("is-visible");
  table.querySelectorAll("td.is-selected").forEach((item) => item.classList.remove("is-selected"));
}

function clearExchangePreview() {
  table.querySelectorAll(".is-exchange-source, .is-exchange-target, .is-exchange-source-part, .is-exchange-source-top, .is-exchange-source-bottom").forEach((item) => {
    item.classList.remove("is-exchange-source", "is-exchange-target", "is-exchange-source-part", "is-exchange-source-top", "is-exchange-source-bottom");
  });
  exchangeTargetCell = null;
}

function clearSplitOption() {
  table.querySelectorAll(".split-action").forEach((button) => button.remove());
  table.querySelectorAll("td.is-split-option").forEach((cell) => cell.classList.remove("is-split-option"));
  splitOptionCell = null;
}

function splitScheduleEntry(cell) {
  const entry = scheduleEntryForCell(cell);
  const shift = getShift(entry.name, entry.date);
  if (!isSplittableShift(shift)) return;
  setShiftOverride(entry.name, entry.date, shift.replace("+", "|"));
  renderMonth(displayedDate.getFullYear(), displayedDate.getMonth());
}

function combinedSplitShift(shift) {
  const parts = shiftParts(shift);
  if (parts.length !== 2) return null;
  return mergedSingleShift(parts[0], parts[1]);
}

function cancelSplitScheduleEntry(cell) {
  const entry = scheduleEntryForCell(cell);
  const combinedShift = combinedSplitShift(getShift(entry.name, entry.date));
  if (!combinedShift) return;
  setShiftOverride(entry.name, entry.date, combinedShift);
  renderMonth(displayedDate.getFullYear(), displayedDate.getMonth());
}

function showSplitOption(cell, action) {
  clearSplitOption();
  splitOptionCell = cell;
  cell.classList.add("is-split-option");
  const button = document.createElement("button");
  button.type = "button";
  button.className = "split-action";
  button.textContent = action === "split" ? "拆分" : "取消拆分";
  button.setAttribute("aria-label", action === "split" ? "拆分为两个单班次" : "取消拆分并恢复双班次");
  button.addEventListener("click", (event) => {
    event.stopPropagation();
    if (action === "split") splitScheduleEntry(cell);
    else cancelSplitScheduleEntry(cell);
  });
  cell.appendChild(button);
}

function dateForCell(cell) {
  return new Date(displayedDate.getFullYear(), displayedDate.getMonth(), Number(cell.dataset.dayIndex) + 1);
}

function scheduleEntryForCell(cell, part = null) {
  return {
    name: staff[Number(cell.dataset.rowIndex)].name,
    date: dateForCell(cell),
    part
  };
}

function mergedSingleShift(firstShift, secondShift) {
  const morning = "\u65e9";
  const middle = "\u4e2d";
  const night = "\u665a";

  if (firstShift === morning && secondShift === middle || firstShift === middle && secondShift === morning) {
    return "\u65e9+\u4e2d";
  }
  if (firstShift === middle && secondShift === night || firstShift === night && secondShift === middle) {
    return "\u4e2d+\u665a";
  }
  return null;
}

function setSplitParts(entry, parts) {
  const remaining = parts.filter((part) => part !== "\u4f11");
  setShiftOverride(entry.name, entry.date, remaining.length ? remaining.join("|") : "\u4f11");
}

function moveSplitPart(source, targetCell) {
  const sourceParts = shiftParts(getShift(source.name, source.date));
  const sourcePartIndex = sourceParts.indexOf(source.part);
  if (sourcePartIndex < 0) return;

  const target = scheduleEntryForCell(targetCell);
  const targetShift = getShift(target.name, target.date);
  const rest = "\u4f11";

  if (targetShift === rest) {
    sourceParts.splice(sourcePartIndex, 1);
    setSplitParts(source, sourceParts);
    setShiftOverride(target.name, target.date, source.part);
  } else if (["\u65e9", "\u4e2d", "\u665a"].includes(targetShift)) {
    const mergedShift = mergedSingleShift(source.part, targetShift);
    if (mergedShift) {
      sourceParts.splice(sourcePartIndex, 1);
      setSplitParts(source, sourceParts);
      setShiftOverride(target.name, target.date, mergedShift);
    } else if (source.part === targetShift) {
      return;
    } else {
      sourceParts[sourcePartIndex] = targetShift;
      setSplitParts(source, sourceParts);
      setShiftOverride(target.name, target.date, source.part);
    }
  } else {
    return;
  }

  renderMonth(displayedDate.getFullYear(), displayedDate.getMonth());
}

function mergeOrSwapScheduleEntries(source, targetCell) {
  if (!source || !targetCell) return;

  if (source.part) {
    moveSplitPart(source, targetCell);
    return;
  }

  const target = scheduleEntryForCell(targetCell);
  const sourceShift = getShift(source.name, source.date);
  const targetShift = getShift(target.name, target.date);
  const mergedShift = mergedSingleShift(sourceShift, targetShift);

  // 两个单班次优先融合；相同班次不改变，其他无法融合的组合继续按交换处理。
  if (["\u65e9", "\u4e2d", "\u665a"].includes(sourceShift) && ["\u65e9", "\u4e2d", "\u665a"].includes(targetShift)) {
    if (mergedShift) {
      setShiftOverride(source.name, source.date, "\u4f11");
      setShiftOverride(target.name, target.date, mergedShift);
      renderMonth(displayedDate.getFullYear(), displayedDate.getMonth());
      return;
    }
    if (sourceShift === targetShift) return;
  }

  swapScheduleEntries(source, targetCell);
}

function swapScheduleEntries(source, targetCell) {
  if (!source || !targetCell) return;

  const target = scheduleEntryForCell(targetCell);
  if (source.name === target.name && toIso(source.date) === toIso(target.date)) return;

  const sourceName = source.name;
  const targetName = target.name;
  const sourceDate = source.date;
  const targetDate = dateForCell(targetCell);
  const sourceShift = getShift(sourceName, sourceDate);
  const targetShift = getShift(targetName, targetDate);

  setShiftOverride(sourceName, sourceDate, targetShift);
  setShiftOverride(targetName, targetDate, sourceShift);
  renderMonth(displayedDate.getFullYear(), displayedDate.getMonth());
}

table.addEventListener("pointerdown", (event) => {
  const header = event.target.closest("thead th[data-day-index]");
  if (header && event.button === 0) {
    event.preventDefault();
    headerRangeStartDay = Number(header.dataset.dayIndex);
    clearSchedulePosition();
    clearSplitOption();
    highlightDateColumns(headerRangeStartDay, headerRangeStartDay);
    return;
  }
  if (event.button === 2) return;
  if (event.target.closest(".split-action")) return;
  if (event.target.closest(".split-divider")) return;
  if (!event.target.closest("td")) return;
  dragStartCell = event.target.closest("td[data-row-index]");
  dragStartPoint = { x: event.clientX, y: event.clientY };
  dragSourcePartElement = event.target.closest(".split-shift");
  dragSourcePart = dragSourcePartElement?.dataset.shiftPart || null;
  if (dragStartCell.classList.contains("split-cell")) {
    const parts = shiftParts(getShift(
      staff[Number(dragStartCell.dataset.rowIndex)].name,
      dateForCell(dragStartCell)
    ));
    const cellBox = dragStartCell.getBoundingClientRect();
    const partIndex = event.clientY - cellBox.top < cellBox.height / 2 ? 0 : 1;
    dragSourcePart = parts[partIndex];
    dragSourcePartElement = dragStartCell.querySelectorAll(".split-shift")[partIndex];
  }
  didDrag = false;
  exchangeMode = false;
  exchangeSource = null;
  clearSplitOption();
  clearExchangePreview();
  // 普通单击在按下时立即定位；只有真正拖动或长按时才会取消定位。
  showSchedulePosition(dragStartCell);
  clearRangeHighlight();
  table.setPointerCapture?.(event.pointerId);
  longPressTimer = window.setTimeout(() => {
    if (!dragStartCell) return;
    const entry = scheduleEntryForCell(dragStartCell, dragSourcePart);
    exchangeMode = true;
    didDrag = true;
    exchangeSource = entry;
    clearRangeHighlight();
    clearSchedulePosition();
    if (dragSourcePartElement) {
      dragSourcePartElement.classList.add("is-exchange-source-part");
      const partElements = dragStartCell.querySelectorAll(".split-shift");
      dragStartCell.classList.add(dragSourcePartElement === partElements[0] ? "is-exchange-source-top" : "is-exchange-source-bottom");
    } else {
      dragStartCell.classList.add("is-exchange-source");
    }
  }, 500);
});

table.addEventListener("pointermove", (event) => {
  if (headerRangeStartDay !== null) {
    const header = document.elementFromPoint(event.clientX, event.clientY)?.closest("thead th[data-day-index]");
    if (header) highlightDateColumns(headerRangeStartDay, Number(header.dataset.dayIndex));
    return;
  }
  if (!dragStartCell) return;
  const target = document.elementFromPoint(event.clientX, event.clientY)?.closest("td[data-row-index][data-day-index]");

  if (exchangeMode) {
    if (!target || target === dragStartCell) {
      table.querySelectorAll("td.is-exchange-target").forEach((item) => item.classList.remove("is-exchange-target"));
      exchangeTargetCell = null;
      return;
    }
    if (target === exchangeTargetCell) return;
    table.querySelectorAll("td.is-exchange-target").forEach((item) => item.classList.remove("is-exchange-target"));
    exchangeTargetCell = target;
    exchangeTargetCell.classList.add("is-exchange-target");
    return;
  }

  if (Math.abs(event.clientX - dragStartPoint.x) < 6 && Math.abs(event.clientY - dragStartPoint.y) < 6) return;
  window.clearTimeout(longPressTimer);
  longPressTimer = null;
  if (!target) return;
  didDrag = true;
  clearSchedulePosition();
  highlightRange(target);
});

function stopDragging(event, shouldSwap = true) {
  const pressedCell = dragStartCell;
  const wasExchange = exchangeMode;
  const releasedCell = document.elementFromPoint(event.clientX, event.clientY)?.closest("td[data-row-index][data-day-index]");
  window.clearTimeout(longPressTimer);
  longPressTimer = null;
  if (shouldSwap && exchangeMode && exchangeTargetCell) mergeOrSwapScheduleEntries(exchangeSource, exchangeTargetCell);
  clearExchangePreview();
  exchangeMode = false;
  exchangeSource = null;
  dragSourcePart = null;
  dragSourcePartElement = null;
  dragStartCell = null;
  dragStartPoint = null;
  if (event?.pointerId !== undefined && table.hasPointerCapture?.(event.pointerId)) {
    table.releasePointerCapture(event.pointerId);
  }

  // 正常单击在所有浏览器 click 事件结束后，再确认一次选中状态。
  // 这样长按/拖拽逻辑不会让红框在松开鼠标的一刻被清除。
  const isSingleCellClick = !wasExchange && pressedCell && (!didDrag || releasedCell === pressedCell || !releasedCell);
  if (isSingleCellClick) {
    didDrag = false;
    window.setTimeout(() => {
      clearRangeHighlight();
      showSchedulePosition(pressedCell);
    }, 0);
  }

  window.setTimeout(() => {
    didDrag = false;
  }, 0);
}

function stopHeaderRangeSelection(event) {
  if (headerRangeStartDay === null) return false;
  headerRangeStartDay = null;
  // 拖动表头松开时浏览器仍会补发一次 click；忽略这一次，避免刚选中的列立即被清除。
  suppressNextRangeClear = true;
  window.setTimeout(() => {
    suppressNextRangeClear = false;
  }, 450);
  if (event?.pointerId !== undefined && table.hasPointerCapture?.(event.pointerId)) {
    table.releasePointerCapture(event.pointerId);
  }
  return true;
}

table.addEventListener("pointerup", (event) => {
  if (!stopHeaderRangeSelection(event)) stopDragging(event, true);
});
table.addEventListener("pointercancel", (event) => {
  if (!stopHeaderRangeSelection(event)) stopDragging(event, false);
});

table.addEventListener("contextmenu", (event) => {
  const cell = event.target.closest("td[data-row-index][data-day-index]");
  if (!cell) return;
  event.preventDefault();
  const entry = scheduleEntryForCell(cell);
  const shift = getShift(entry.name, entry.date);
  if (isSplittableShift(shift)) showSplitOption(cell, "split");
  else if (combinedSplitShift(shift)) showSplitOption(cell, "cancel");
  else clearSplitOption();
});

document.addEventListener("click", (event) => {
  if (suppressNextRangeClear) {
    suppressNextRangeClear = false;
    return;
  }
  if (!event.target.closest("#schedule-table td, #schedule-table thead th[data-day-index]")) clearRangeHighlight();
  if (!event.target.closest("#schedule-table td")) clearSchedulePosition();
});

function scrollToPage(position) {
  const maxScroll = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
  const top = position === "top" ? 0 : position === "bottom" ? maxScroll : Math.round(maxScroll / 2);
  window.scrollTo({ top, behavior: "smooth" });
}

function showDoubleTapTip(button, tip) {
  button.dataset.doubleTapTip = tip;
  button.classList.add("show-double-tap-tip");
  window.clearTimeout(button.doubleTapTipTimer);
  button.doubleTapTipTimer = window.setTimeout(() => {
    button.classList.remove("show-double-tap-tip");
  }, 1600);
}

function requireDoubleTap(selector, action, tip) {
  const button = document.querySelector(selector);
  let lastTapAt = 0;

  button.addEventListener("click", (event) => {
    event.preventDefault();
    const now = Date.now();
    if (now - lastTapAt <= 550) {
      lastTapAt = 0;
      button.classList.remove("show-double-tap-tip");
      action();
      return;
    }
    lastTapAt = now;
    showDoubleTapTip(button, tip);
  });
}

requireDoubleTap("#go-page-top", () => scrollToPage("top"), "再点一次：回到顶部");
requireDoubleTap("#go-page-middle", () => scrollToPage("middle"), "再点一次：前往中间");
requireDoubleTap("#go-page-bottom", () => scrollToPage("bottom"), "再点一次：前往底部");
scheduleFullscreenButton.addEventListener("click", toggleScheduleFullscreen);
window.addEventListener("resize", () => window.requestAnimationFrame(positionLegalOvertimeOverlays));

function updateLoginAvatar(isLoggedIn) {
  desktopLoginAvatar.textContent = isLoggedIn ? "admin" : "";
  desktopLoginAvatar.setAttribute("aria-label", isLoggedIn ? "已登录：admin" : "登录");
  desktopLoginAvatar.title = isLoggedIn ? "已登录：admin" : "登录";
  updateScheduleActionButtons();
}

function isLoggedIn() {
  return loggedIn;
}

function updateScheduleActionButtons() {
  const canManageChanges = isLoggedIn();
  const hasChanges = canManageChanges && hasUnsavedScheduleChangesInDisplayedMonth();
  const hasSavedCustomSchedule = hasOverridesInDisplayedMonth(savedShiftOverrides);
  const hasCurrentCustomSchedule = hasOverridesInDisplayedMonth(shiftOverrides);
  desktopScheduleActions.hidden = !canManageChanges || (!hasChanges && !hasSavedCustomSchedule && !hasCurrentCustomSchedule);
  saveScheduleChangesButton.hidden = !hasChanges;
  restoreScheduleChangesButton.hidden = !hasChanges;
  restoreDefaultScheduleButton.hidden = !canManageChanges || !hasCurrentCustomSchedule;
  saveScheduleChangesButton.disabled = !hasChanges;
  restoreScheduleChangesButton.disabled = !hasChanges;
}

function saveScheduleChanges() {
  if (!isLoggedIn() || !hasUnsavedScheduleChangesInDisplayedMonth()) return;
  try {
    const nextSavedOverrides = {
      ...Object.fromEntries(Object.entries(savedShiftOverrides).filter(([key]) => !overrideBelongsToDisplayedMonth(key))),
      ...overridesForDisplayedMonth(shiftOverrides)
    };
    localStorage.setItem(SCHEDULE_STORAGE_KEY, JSON.stringify(nextSavedOverrides));
    savedShiftOverrides = nextSavedOverrides;
    updateScheduleActionButtons();
    showCopyFeedback("排班修改已保存到本机。" );
  } catch (_) {
    showCopyFeedback("浏览器未允许本机保存，修改未能保存。", true);
  }
}

function restoreScheduleChanges() {
  if (!isLoggedIn() || !hasUnsavedScheduleChangesInDisplayedMonth()) return;
  Object.keys(shiftOverrides)
    .filter(overrideBelongsToDisplayedMonth)
    .forEach((key) => delete shiftOverrides[key]);
  Object.assign(shiftOverrides, overridesForDisplayedMonth(savedShiftOverrides));
  renderMonth(displayedDate.getFullYear(), displayedDate.getMonth());
  showCopyFeedback("已恢复到上次保存的排班。" );
}

function restoreDefaultSchedule() {
  if (!isLoggedIn()) return;
  try {
    const nextSavedOverrides = Object.fromEntries(
      Object.entries(savedShiftOverrides).filter(([key]) => !overrideBelongsToDisplayedMonth(key))
    );
    localStorage.setItem(SCHEDULE_STORAGE_KEY, JSON.stringify(nextSavedOverrides));
    savedShiftOverrides = nextSavedOverrides;
    Object.keys(shiftOverrides)
      .filter(overrideBelongsToDisplayedMonth)
      .forEach((key) => delete shiftOverrides[key]);
    renderMonth(displayedDate.getFullYear(), displayedDate.getMonth());
    showCopyFeedback("已恢复本月默认排班。" );
  } catch (_) {
    showCopyFeedback("浏览器未允许更新本机保存的数据。", true);
  }
}

function openLoginDialog() {
  loginFeedback.textContent = "";
  loginPassword.value = "";
  if (typeof loginDialog.showModal === "function") loginDialog.showModal();
  else loginDialog.setAttribute("open", "");
  window.setTimeout(() => loginAccount.focus(), 0);
}

function openLogoutDialog() {
  if (typeof logoutDialog.showModal === "function") logoutDialog.showModal();
  else logoutDialog.setAttribute("open", "");
}

function showScheduleActionConfirmation(action) {
  const copy = {
    save: ["保存修改", "确定保存当前月份的排班修改吗？"],
    restore: ["一键恢复", "确定撤销当前月份未保存的排班修改吗？"],
    default: ["默认排班", "确定恢复当前月份的默认排班吗？\n本月已保存的修改将被清除。"]
  }[action];
  if (!copy) return;
  pendingScheduleAction = action;
  scheduleActionDialogTitle.textContent = copy[0];
  scheduleActionDialogMessage.textContent = copy[1];
  if (typeof scheduleActionDialog.showModal === "function") scheduleActionDialog.showModal();
  else scheduleActionDialog.setAttribute("open", "");
}

function showCopyFeedback(message, isError = false) {
  copyFeedback.textContent = message;
  copyFeedback.classList.toggle("is-error", isError);
  copyFeedback.classList.add("is-visible");
  window.clearTimeout(copyFeedbackTimer);
  copyFeedbackTimer = window.setTimeout(() => copyFeedback.classList.remove("is-visible"), 2200);
}

function excelCellText(sourceCell) {
  const fullShift = sourceCell.querySelector(".shift-full");
  if (fullShift) return fullShift.textContent.trim();
  const splitParts = sourceCell.querySelectorAll(".split-shift");
  if (splitParts.length) return [...splitParts].map((part) => part.textContent.trim()).join(" / ");
  const weekday = sourceCell.querySelector(".weekday-full");
  if (weekday) return weekday.textContent.trim();
  return sourceCell.textContent.trim();
}

function tableHtmlForExcel() {
  const copyTable = document.createElement("table");
  copyTable.style.cssText = "border-collapse:collapse;border-spacing:0;font-family:Microsoft YaHei, PingFang SC, sans-serif;";
  [...table.rows].forEach((sourceRow) => {
    const copyRow = document.createElement("tr");
    [...sourceRow.cells].forEach((sourceCell) => {
      const copyCell = document.createElement(sourceCell.tagName.toLowerCase());
      const computed = window.getComputedStyle(sourceCell);
      copyCell.textContent = excelCellText(sourceCell);
      copyCell.style.cssText = [
        `background-color:${computed.backgroundColor}`,
        `color:${computed.color}`,
        `border-top:${computed.borderTopWidth} ${computed.borderTopStyle} ${computed.borderTopColor}`,
        `border-right:${computed.borderRightWidth} ${computed.borderRightStyle} ${computed.borderRightColor}`,
        `border-bottom:${computed.borderBottomWidth} ${computed.borderBottomStyle} ${computed.borderBottomColor}`,
        `border-left:${computed.borderLeftWidth} ${computed.borderLeftStyle} ${computed.borderLeftColor}`,
        `font-family:${computed.fontFamily}`,
        `font-size:${computed.fontSize}`,
        `font-weight:${computed.fontWeight}`,
        `text-align:${computed.textAlign}`,
        `vertical-align:${computed.verticalAlign}`,
        `white-space:nowrap`,
        `padding:${computed.paddingTop} ${computed.paddingRight} ${computed.paddingBottom} ${computed.paddingLeft}`,
        `height:${computed.height}`
      ].join(";");
      copyRow.append(copyCell);
    });
    copyTable.append(copyRow);
  });
  return copyTable;
}

function copyWithSelection(copyTable) {
  const holder = document.createElement("div");
  holder.contentEditable = "true";
  holder.style.cssText = "position:fixed;left:-9999px;top:0;opacity:0;pointer-events:none;";
  holder.append(copyTable);
  document.body.append(holder);
  const selection = window.getSelection();
  const range = document.createRange();
  range.selectNodeContents(holder);
  selection.removeAllRanges();
  selection.addRange(range);
  const copied = document.execCommand("copy");
  selection.removeAllRanges();
  holder.remove();
  return copied;
}

async function copyScheduleForExcel() {
  const copyTable = tableHtmlForExcel();
  const html = copyTable.outerHTML;
  const plainText = [...table.rows]
    .map((row) => [...row.cells].map(excelCellText).join("\t"))
    .join("\n");

  try {
    if (navigator.clipboard?.write && typeof ClipboardItem !== "undefined") {
      await navigator.clipboard.write([new ClipboardItem({
        "text/html": new Blob([html], { type: "text/html" }),
        "text/plain": new Blob([plainText], { type: "text/plain" })
      })]);
      showCopyFeedback("当月排班已复制，可直接粘贴到 Excel。" );
      return;
    }
  } catch (_) {
    // 部分本地或内置浏览器不允许 Clipboard API，继续使用兼容复制方式。
  }

  if (copyWithSelection(copyTable)) showCopyFeedback("当月排班已复制，可直接粘贴到 Excel。" );
  else showCopyFeedback("浏览器未允许复制，请使用 HTTPS 页面后重试。", true);
}

table.addEventListener("dblclick", (event) => {
  if (!event.target.closest("thead tr:first-child .corner")) return;
  event.preventDefault();
  if (!isLoggedIn()) return;
  copyScheduleForExcel();
});

desktopLoginAvatar.addEventListener("click", () => {
  if (isLoggedIn()) openLogoutDialog();
  else openLoginDialog();
});
document.querySelector("#login-cancel").addEventListener("click", () => loginDialog.close());
loginDialog.addEventListener("click", (event) => {
  if (event.target === loginDialog) loginDialog.close();
});
logoutDialog.addEventListener("click", (event) => {
  if (event.target === logoutDialog) logoutDialog.close();
});
loginForm.addEventListener("submit", (event) => {
  event.preventDefault();
  if (loginAccount.value === "tao" && loginPassword.value === "1985") {
    replaceShiftOverrides(savedShiftOverrides);
    loggedIn = true;
    updateLoginAvatar(true);
    renderMonth(displayedDate.getFullYear(), displayedDate.getMonth());
    loginDialog.close();
    return;
  }
  loggedIn = false;
  updateLoginAvatar(false);
  loginFeedback.textContent = "账户或密码错误，无法登录。";
  loginPassword.focus();
});
document.querySelector("#logout-confirm").addEventListener("click", () => {
  loggedIn = false;
  replaceShiftOverrides(savedShiftOverrides);
  updateLoginAvatar(false);
  renderMonth(displayedDate.getFullYear(), displayedDate.getMonth());
  logoutDialog.close();
});
scheduleActionDialog.addEventListener("click", (event) => {
  if (event.target === scheduleActionDialog) scheduleActionDialog.close();
});
scheduleActionDialog.addEventListener("close", () => {
  pendingScheduleAction = null;
});
scheduleActionConfirm.addEventListener("click", () => {
  const action = pendingScheduleAction;
  scheduleActionDialog.close();
  if (action === "save") saveScheduleChanges();
  else if (action === "restore") restoreScheduleChanges();
  else if (action === "default") restoreDefaultSchedule();
});
saveScheduleChangesButton.addEventListener("click", () => showScheduleActionConfirmation("save"));
restoreScheduleChangesButton.addEventListener("click", () => showScheduleActionConfirmation("restore"));
restoreDefaultScheduleButton.addEventListener("click", () => showScheduleActionConfirmation("default"));
updateLoginAvatar(false);

replaceShiftOverrides(savedShiftOverrides);
renderMonth(displayedDate.getFullYear(), displayedDate.getMonth());

// 供浏览器控制台核对，月表和查询功能均通过同一方法计算班次。
window.getShift = getShift;
window.renderMonth = renderMonth;
