import assert from "node:assert/strict";
import {
  isWeatherIconName,
  sanitizeGoogleDailyForecast,
  weatherIconForForecast
} from "../weather-forecast.js";

assert.equal(weatherIconForForecast({ condition: "CLEAR", highC: 29.9, lowC: 12 }), "sun");
assert.equal(weatherIconForForecast({ condition: "CLEAR", highC: 30, lowC: 12 }), "thermometer-sun");
assert.equal(weatherIconForForecast({ condition: "CLEAR", highC: 8, lowC: 0 }), "thermometer-snowflake");
assert.equal(
  weatherIconForForecast({ condition: "SNOW", highC: 30, lowC: 0 }),
  "thermometer-sun",
  "The explicitly documented hot threshold takes precedence if both extremes occur"
);
assert.equal(weatherIconForForecast({ condition: "PARTLY_CLOUDY", highC: 18, lowC: 8 }), "cloud-sun");
assert.equal(weatherIconForForecast({ condition: "RAIN_SHOWERS", highC: 16, lowC: 9 }), "cloud-drizzle");
assert.equal(weatherIconForForecast({ condition: "HEAVY_SNOW", highC: 4, lowC: 1 }), "cloudy");
assert.equal(weatherIconForForecast({ condition: "FUTURE_UNKNOWN_VALUE", highC: 18, lowC: 8 }), "cloudy");

for (const icon of [
  "sun",
  "cloud-sun",
  "cloudy",
  "cloud-drizzle",
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

console.log("Weather forecast tests passed.");
