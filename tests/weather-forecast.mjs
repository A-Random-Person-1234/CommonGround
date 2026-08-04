import assert from "node:assert/strict";
import {
  isWeatherIconName,
  sanitizeGoogleDailyForecast,
  sanitizeGoogleHourlyWeather,
  summarizeHourlyWeather,
  weatherIconForForecast
} from "../weather-forecast.js";

assert.equal(weatherIconForForecast({ condition: "CLEAR", highC: 29.9, lowC: 12 }), "sun");
assert.equal(weatherIconForForecast({ condition: "CLEAR", highC: 30, lowC: 12 }), "thermometer-sun");
assert.equal(weatherIconForForecast({ condition: "CLEAR", highC: 8, lowC: 0 }), "thermometer-snowflake");
assert.equal(
  weatherIconForForecast({ condition: "SNOW", highC: 30, lowC: 0 }),
  "snowflake",
  "Specific weather conditions take precedence over generic temperature extremes"
);
assert.equal(weatherIconForForecast({ condition: "PARTLY_CLOUDY", highC: 18, lowC: 8 }), "cloud-sun");
assert.equal(weatherIconForForecast({ condition: "RAIN_SHOWERS", highC: 16, lowC: 9 }), "cloud-drizzle");
assert.equal(weatherIconForForecast({ condition: "HEAVY_SNOW", highC: 4, lowC: 1 }), "snowflake");
assert.equal(weatherIconForForecast({ condition: "THUNDERSTORM", highC: 18, lowC: 8 }), "cloud-lightning");
assert.equal(weatherIconForForecast({ condition: "WINDY", highC: 18, lowC: 8 }), "wind");
assert.equal(weatherIconForForecast({ condition: "FUTURE_UNKNOWN_VALUE", highC: 18, lowC: 8 }), "cloudy");

for (const icon of [
  "sun",
  "cloud-sun",
  "cloudy",
  "cloud-drizzle",
  "cloud-lightning",
  "snowflake",
  "wind",
  "thermometer-sun",
  "thermometer-snowflake"
]) {
  assert.equal(isWeatherIconName(icon), true);
}
assert.equal(isWeatherIconName("https://example.com/icon.svg"), false);

const sanitized = sanitizeGoogleDailyForecast({
  forecastDays: [
    {
      displayDate: { year: 2026, month: 8, day: 4 },
      maxTemperature: { degrees: 30 },
      minTemperature: { degrees: 17.24 },
      daytimeForecast: {
        weatherCondition: {
          type: "CLEAR",
          description: { text: "  Sunny\u0000  " },
          iconBaseUri: "https://provider.example/private-icon"
        }
      },
      providerOnlyField: "must not escape"
    },
    {
      displayDate: { year: 2026, month: 2, day: 30 },
      maxTemperature: { degrees: 12 },
      minTemperature: { degrees: 4 },
      daytimeForecast: { weatherCondition: { type: "CLOUDY" } }
    },
    {
      displayDate: { year: 2026, month: 8, day: 5 },
      maxTemperature: { degrees: "not-a-number" },
      minTemperature: {},
      daytimeForecast: { weatherCondition: { type: "PARTLY_CLOUDY" } }
    }
  ]
});

assert.deepEqual(sanitized, [
  {
    date: "2026-08-04",
    condition: "CLEAR",
    description: "Sunny",
    highC: 30,
    lowC: 17.2,
    icon: "thermometer-sun"
  },
  {
    date: "2026-08-05",
    condition: "PARTLY_CLOUDY",
    description: "Partly cloudy",
    highC: null,
    lowC: null,
    icon: "cloud-sun"
  }
]);
assert.doesNotMatch(JSON.stringify(sanitized), /providerOnlyField|iconBaseUri|private-icon/);

const elevenDays = Array.from({ length: 11 }, (_, index) => ({
  displayDate: { year: 2026, month: 8, day: index + 1 },
  maxTemperature: { degrees: 20 },
  minTemperature: { degrees: 10 },
  daytimeForecast: { weatherCondition: { type: "CLOUDY" } }
}));
assert.equal(sanitizeGoogleDailyForecast({ forecastDays: elevenDays }).length, 10);
assert.deepEqual(sanitizeGoogleDailyForecast(null), []);

const sanitizedHours = sanitizeGoogleHourlyWeather({
  forecastHours: [
    {
      interval: { startTime: "2026-08-04T13:00:00Z", providerSecret: "private" },
      displayDateTime: { year: 2026, month: 8, day: 4, hours: 14, utcOffset: "+01:00" },
      isDaytime: true,
      temperature: { degrees: 21.24 },
      weatherCondition: {
        type: "PARTLY_CLOUDY",
        description: { text: "  Sun and cloud  " },
        iconBaseUri: "https://provider.example/private-icon"
      }
    },
    {
      interval: { startTime: "not-a-date" },
      displayDateTime: { year: 2026, month: 8, day: 4, hours: 15 },
      isDaytime: false,
      temperature: { degrees: 19 },
      weatherCondition: { type: "THUNDERSTORM" }
    },
    {
      displayDateTime: { year: 2026, month: 2, day: 30, hours: 12 },
      temperature: { degrees: 10 }
    }
  ],
  historyHours: [
    {
      interval: { startTime: "2026-08-03T23:00:00Z" },
      displayDateTime: { year: 2026, month: 8, day: 4, hours: 0 },
      isDaytime: false,
      temperature: { degrees: 12.04 },
      weatherCondition: { type: "CLEAR", description: { text: "Clear" } }
    }
  ]
});

assert.deepEqual(sanitizedHours, [
  {
    date: "2026-08-04",
    hour: 0,
    startTime: "2026-08-03T23:00:00.000Z",
    condition: "CLEAR",
    description: "Clear",
    temperatureC: 12,
    isDaytime: false,
    icon: "sun"
  },
  {
    date: "2026-08-04",
    hour: 14,
    startTime: "2026-08-04T13:00:00.000Z",
    condition: "PARTLY_CLOUDY",
    description: "Sun and cloud",
    temperatureC: 21.2,
    isDaytime: true,
    icon: "cloud-sun"
  },
  {
    date: "2026-08-04",
    hour: 15,
    startTime: "",
    condition: "THUNDERSTORM",
    description: "Thunderstorm",
    temperatureC: 19,
    isDaytime: false,
    icon: "cloud-lightning"
  }
]);
assert.doesNotMatch(JSON.stringify(sanitizedHours), /providerSecret|iconBaseUri|private-icon/);

assert.deepEqual(summarizeHourlyWeather(sanitizedHours, { source: "history" }), [
  {
    date: "2026-08-04",
    condition: "PARTLY_CLOUDY",
    description: "Sun and cloud",
    highC: 21.2,
    lowC: 12,
    icon: "cloud-sun",
    source: "history"
  }
]);
assert.deepEqual(summarizeHourlyWeather([], { source: "history" }), []);

console.log("Weather forecast tests passed.");
