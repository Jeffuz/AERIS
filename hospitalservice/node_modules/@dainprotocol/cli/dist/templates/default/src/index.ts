//File: example/example-node.ts

import { z } from "zod";
import axios from "axios";

import { defineDAINService, ToolConfig } from "@dainprotocol/service-sdk";

import {
  CardUIBuilder,
  TableUIBuilder,
  MapUIBuilder,
  LayoutUIBuilder,
} from "@dainprotocol/utils";

const port = Number(process.env.PORT) || 2022;

const getWeatherEmoji = (temperature: number): string => {
  if (temperature <= 0) return "🥶";
  if (temperature <= 10) return "❄️";
  if (temperature <= 20) return "⛅";
  if (temperature <= 25) return "☀️";
  if (temperature <= 30) return "🌞";
  return "🔥";
};

const getWeatherConfig: ToolConfig = {
  id: "get-weather",
  name: "Get Weather",
  description: "Fetches current weather for a city",
  input: z
    .object({
      locationName: z.string().describe("Location name"),
      latitude: z.number().describe("Latitude coordinate"),
      longitude: z.number().describe("Longitude coordinate"),
    })
    .describe("Input parameters for the weather request"),
  output: z
    .object({
      temperature: z.number().describe("Current temperature in Celsius"),
      windSpeed: z.number().describe("Current wind speed in km/h"),
    })
    .describe("Current weather information"),
  pricing: { pricePerUse: 0, currency: "USD" },
  handler: async (
    { locationName, latitude, longitude },
    agentInfo,
    context
  ) => {
    console.log(
      `User / Agent ${agentInfo.id} requested weather at ${locationName} (${latitude},${longitude})`
    );

    const response = await axios.get(
      `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,wind_speed_10m`
    );

    const { temperature_2m, wind_speed_10m } = response.data.current;
    const weatherEmoji = getWeatherEmoji(temperature_2m);

    return {
      text: `The current temperature in ${locationName} is ${temperature_2m}°C with wind speed of ${wind_speed_10m} km/h`,
      data: {
        temperature: temperature_2m,
        windSpeed: wind_speed_10m,
      },
      ui: new CardUIBuilder()
        .setRenderMode("page")
        .title(`Current Weather in ${locationName} ${weatherEmoji}`)
        .addChild(
          new MapUIBuilder()
            .setInitialView(latitude, longitude, 10)
            .setMapStyle("mapbox://styles/mapbox/streets-v12")
            .addMarkers([
              {
                latitude,
                longitude,
                title: locationName,
                description: `Temperature: ${temperature_2m}°C\nWind: ${wind_speed_10m} km/h`,
                text: `${locationName} ${weatherEmoji}`,
              },
            ])
            .build()
        )
        .content(
          `Temperature: ${temperature_2m}°C\nWind Speed: ${wind_speed_10m} km/h`
        )
        .build(),
    };
  },
};

const getWeatherForecastConfig: ToolConfig = {
  id: "get-weather-forecast",
  name: "Get Weather Forecast",
  description: "Fetches hourly weather forecast",
  input: z
    .object({
      locationName: z.string().describe("Location name"),
      latitude: z.number().describe("Latitude coordinate"),
      longitude: z.number().describe("Longitude coordinate"),
    })
    .describe("Input parameters for the forecast request"),
  output: z
    .object({
      times: z.array(z.string()).describe("Forecast times"),
      temperatures: z
        .array(z.number())
        .describe("Temperature forecasts in Celsius"),
      windSpeeds: z.array(z.number()).describe("Wind speed forecasts in km/h"),
      humidity: z
        .array(z.number())
        .describe("Relative humidity forecasts in %"),
    })
    .describe("Hourly weather forecast"),
  pricing: { pricePerUse: 0, currency: "USD" },
  handler: async (
    { locationName, latitude, longitude },
    agentInfo,
    context
  ) => {
    console.log(
      `User / Agent ${agentInfo.id} requested forecast at ${locationName} (${latitude},${longitude})`
    );

    const response = await axios.get(
      `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&hourly=temperature_2m,relative_humidity_2m,wind_speed_10m`
    );

    const { time, temperature_2m, wind_speed_10m, relative_humidity_2m } =
      response.data.hourly;

    // Limit to first 24 hours of forecast data
    const limitedTime = time.slice(0, 24);
    const limitedTemp = temperature_2m.slice(0, 24);
    const limitedWind = wind_speed_10m.slice(0, 24);
    const limitedHumidity = relative_humidity_2m.slice(0, 24);

    const weatherEmoji = getWeatherEmoji(limitedTemp[0]);

    return {
      text: `Weather forecast for ${locationName} available for the next 24 hours`,
      data: {
        times: limitedTime,
        temperatures: limitedTemp,
        windSpeeds: limitedWind,
        humidity: limitedHumidity,
      },
      ui: new LayoutUIBuilder()
        .setRenderMode("page")
        .setLayoutType("column")
        .addChild(
          new MapUIBuilder()
            .setInitialView(latitude, longitude, 10)
            .setMapStyle("mapbox://styles/mapbox/streets-v12")
            .addMarkers([
              {
                latitude,
                longitude,
                title: locationName,
                description: `Temperature: ${limitedTemp[0]}°C\nWind: ${limitedWind[0]} km/h`,
                text: `${locationName} ${weatherEmoji}`,
              },
            ])
            .build()
        )
        .addChild(
          new TableUIBuilder()
            .addColumns([
              { key: "time", header: "Time", type: "string" },
              {
                key: "temperature",
                header: "Temperature (°C)",
                type: "number",
              },
              { key: "windSpeed", header: "Wind Speed (km/h)", type: "number" },
              { key: "humidity", header: "Humidity (%)", type: "number" },
            ])
            .rows(
              limitedTime.map((t: string, i: number) => ({
                time: new Date(t).toLocaleString(),
                temperature: limitedTemp[i],
                windSpeed: limitedWind[i],
                humidity: limitedHumidity[i],
              }))
            )
            .build()
        )
        .build(),
    };
  },
};

const dainService = defineDAINService({
  metadata: {
    title: "Weather DAIN Service",
    description:
      "A DAIN service for current weather and forecasts using Open-Meteo API",
    version: "1.0.0",
    author: "Your Name",
    tags: ["weather", "forecast", "dain"],
    logo: "https://cdn-icons-png.flaticon.com/512/252/252035.png",
  },
  exampleQueries: [
    {
      category: "Weather",
      queries: [
        "What is the weather in Tokyo?",
        "What is the weather in San Francisco?",
        "What is the weather in London?",
      ],
    },
  ],
  identity: {
    apiKey: process.env.DAIN_API_KEY,
  },
  tools: [getWeatherConfig, getWeatherForecastConfig],
});

dainService.startNode({ port: port }).then(({ address }) => {
  console.log("Weather DAIN Service is running at :" + address().port);
});
