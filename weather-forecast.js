const weatherIconNames = new Set([
  "sun",
  "cloud-sun",
  "cloudy",
  "cloud-drizzle",
  "thermometer-sun",
  "thermometer-snowflake"
]);

function normalizedTemperature(value) {
  if (value?.degrees === null || value?.degrees === undefined) return null;
  const degrees = Number(value.degrees);
  if (!Number.isFinite(degrees)) return null;
  return Math.round(degrees * 10) / 10;
}

function normalizedCondition(value) {
  const condition = String(value || "")
    .toUpperCase()
    .replace(/[^A-Z0-9_]/g, "")
    .slice(0, 64);
  return condition || "UNKNOWN";
}

function normalizedDescription(value) {
  return String(value || "")
    .normalize("NFKC")
    .replace(/[\u0000-\u001F\u007F]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 120);
}

function forecastDateKey(value) {
  const year = Number(value?.year);
  const month = Number(value?.month);
  const day = Number(value?.day);
  if (![year, month, day].every(Number.isInteger)) return "";
  if (year < 1970 || year > 9999 || month < 1 || month > 12 || day < 1 || day > 31) return "";
  const candidate = new Date(Date.UTC(year, month - 1, day));
  if (
    candidate.getUTCFullYear() !== year ||
    candidate.getUTCMonth() !== month - 1 ||
    candidate.getUTCDate() !== day
  ) {
    return "";
  }
  return `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function conditionFallbackDescription(condition) {
  if (condition === "UNKNOWN") return "Weather forecast";
  return condition
    .toLowerCase()
    .split("_")
    .filter(Boolean)
    .join(" ")
    .replace(/^./, (character) => character.toUpperCase());
}

export function weatherIconForForecast({ condition, highC, lowC } = {}) {
  if (Number.isFinite(highC) && highC >= 30) return "thermometer-sun";
  if (Number.isFinite(lowC) && lowC <= 0) return "thermometer-snowflake";

  const type = normalizedCondition(condition);
  if (type === "CLEAR") return "sun";
  if (["MOSTLY_CLEAR", "PARTLY_CLOUDY"].includes(type)) return "cloud-sun";
  if (
    type.includes("RAIN") ||
    type.includes("SHOWER") ||
    type.includes("THUNDER") ||
    type.includes("DRIZZLE")
  ) {
    return "cloud-drizzle";
  }
  if (
    type.includes("CLOUD") ||
    type.includes("WIND") ||
    type.includes("SNOW") ||
    type.includes("HAIL") ||
    type.includes("ICE") ||
    type.includes("SLEET")
  ) {
    return "cloudy";
  }
  return "cloudy";
}

export function isWeatherIconName(value) {
  return weatherIconNames.has(String(value || ""));
}

export function sanitizeGoogleDailyForecast(payload) {
  const forecastDays = Array.isArray(payload?.forecastDays) ? payload.forecastDays : [];
  const byDate = new Map();

  for (const day of forecastDays) {
    const date = forecastDateKey(day?.displayDate);
    if (!date || byDate.has(date)) continue;
    const highC = normalizedTemperature(day?.maxTemperature);
    const lowC = normalizedTemperature(day?.minTemperature);
    const condition = normalizedCondition(day?.daytimeForecast?.weatherCondition?.type);
    const description = normalizedDescription(day?.daytimeForecast?.weatherCondition?.description?.text)
      || conditionFallbackDescription(condition);
    byDate.set(date, {
      date,
      condition,
      description,
      highC,
      lowC,
      icon: weatherIconForForecast({ condition, highC, lowC })
    });
    if (byDate.size >= 10) break;
  }

  return [...byDate.values()];
}
