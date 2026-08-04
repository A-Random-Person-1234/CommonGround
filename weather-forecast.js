const weatherIconNames = new Set([
  "sun",
  "cloud-sun",
  "cloudy",
  "cloud-drizzle",
  "cloud-lightning",
  "snowflake",
  "wind",
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

function normalizedHour(value) {
  const hour = Number(value?.hours);
  return Number.isInteger(hour) && hour >= 0 && hour <= 23 ? hour : null;
}

function normalizedStartTime(value) {
  const startTime = String(value || "").trim();
  if (!startTime || startTime.length > 40) return "";
  const timestamp = Date.parse(startTime);
  return Number.isFinite(timestamp) ? new Date(timestamp).toISOString() : "";
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
  const type = normalizedCondition(condition);
  if (type.includes("THUNDER") || type.includes("LIGHTNING")) return "cloud-lightning";
  if (
    type.includes("SNOW") ||
    type.includes("SLEET") ||
    type.includes("ICE") ||
    type.includes("HAIL") ||
    type.includes("FREEZING")
  ) {
    return "snowflake";
  }
  if (type.includes("WIND") || type.includes("BREEZY") || type.includes("GUST")) return "wind";
  if (Number.isFinite(highC) && highC >= 30) return "thermometer-sun";
  if (Number.isFinite(lowC) && lowC <= 0) return "thermometer-snowflake";

  if (type === "CLEAR") return "sun";
  if (["MOSTLY_CLEAR", "PARTLY_CLOUDY"].includes(type)) return "cloud-sun";
  if (
    type.includes("RAIN") ||
    type.includes("SHOWER") ||
    type.includes("DRIZZLE")
  ) {
    return "cloud-drizzle";
  }
  if (type.includes("CLOUD")) return "cloudy";
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

export function sanitizeGoogleHourlyWeather(payload) {
  const providerHours = [
    ...(Array.isArray(payload?.forecastHours) ? payload.forecastHours : []),
    ...(Array.isArray(payload?.historyHours) ? payload.historyHours : [])
  ];
  const byHour = new Map();

  for (const providerHour of providerHours) {
    const date = forecastDateKey(providerHour?.displayDateTime);
    const hour = normalizedHour(providerHour?.displayDateTime);
    if (!date || hour === null) continue;
    const startTime = normalizedStartTime(providerHour?.interval?.startTime);
    const condition = normalizedCondition(providerHour?.weatherCondition?.type);
    const description = normalizedDescription(providerHour?.weatherCondition?.description?.text)
      || conditionFallbackDescription(condition);
    const temperatureC = normalizedTemperature(providerHour?.temperature);
    const key = `${date}-${String(hour).padStart(2, "0")}`;
    if (byHour.has(key)) continue;
    byHour.set(key, {
      date,
      hour,
      startTime,
      condition,
      description,
      temperatureC,
      isDaytime: providerHour?.isDaytime === true,
      icon: weatherIconForForecast({ condition })
    });
    if (byHour.size >= 240) break;
  }

  return [...byHour.values()].sort((left, right) => {
    if (left.date !== right.date) return left.date.localeCompare(right.date);
    return left.hour - right.hour;
  });
}

export function summarizeHourlyWeather(hours, { source = "history" } = {}) {
  const byDate = new Map();
  for (const rawHour of Array.isArray(hours) ? hours : []) {
    const date = String(rawHour?.date || "");
    const hour = Number(rawHour?.hour);
    const temperatureC = Number(rawHour?.temperatureC);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isInteger(hour) || hour < 0 || hour > 23) continue;
    if (!Number.isFinite(temperatureC)) continue;
    const bucket = byDate.get(date) || [];
    bucket.push(rawHour);
    byDate.set(date, bucket);
  }

  return [...byDate.entries()].sort(([left], [right]) => left.localeCompare(right)).map(([date, entries]) => {
    const temperatures = entries.map((entry) => Number(entry.temperatureC));
    const representative = [...entries].sort((left, right) => {
      const leftDistance = Math.abs(Number(left.hour) - 12);
      const rightDistance = Math.abs(Number(right.hour) - 12);
      return leftDistance - rightDistance || Number(left.hour) - Number(right.hour);
    })[0];
    const condition = normalizedCondition(representative?.condition);
    const highC = Math.round(Math.max(...temperatures) * 10) / 10;
    const lowC = Math.round(Math.min(...temperatures) * 10) / 10;
    return {
      date,
      condition,
      description: normalizedDescription(representative?.description) || conditionFallbackDescription(condition),
      highC,
      lowC,
      icon: weatherIconForForecast({ condition, highC, lowC }),
      source: source === "history" ? "history" : "forecast"
    };
  });
}
