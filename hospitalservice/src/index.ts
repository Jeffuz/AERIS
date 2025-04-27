// File: services/hospital-finder-service.ts

import { z } from "zod";
import axios from "axios";
import { defineDAINService, ToolConfig, AgentInfo, type DAINService } from "@dainprotocol/service-sdk";
import { CardUIBuilder, MapUIBuilder } from "@dainprotocol/utils";
import twilio from "twilio";

const accountSid = "ACdde7b682cc5da97f66cb162782b3f453";
const authToken = "c467efd7ec600dc798435d3324cf9a69";
const twilioClient = twilio(accountSid, authToken);

const twilioCallerNumber = "+18666916450"; 
const twilioVoiceUrl = "https://fallow-salamander-9631.twil.io/assets/audio3459472596.m4a";
const port = Number(process.env.PORT) || 3030;

// --- Hospital database ---
const HOSPITALS = [
  {
    name: "UCLA Medical Center",
    latitude: 34.0656,
    longitude: -118.4468,
    phone: "+17209087740",
  },
  {
    name: "Cedars-Sinai Medical Center",
    latitude: 34.0752,
    longitude: -118.3804,
    phone: "+17209087740",
  },
  {
    name: "LAC+USC Medical Center",
    latitude: 34.0605,
    longitude: -118.2110,
    phone: "+17209087740",
  },
];

// calculate distance between two lat/lon 
function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const toRad = (value: number) => (value * Math.PI) / 180;
  const R = 6371; // Earth radius in km

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

//  Tool Config: Find and Call Closest Hospital
const findAndCallHospitalConfig: ToolConfig = {
  id: "find-and-call-hospital",
  name: "Find and Call Hospital",
  description: "Finds the closest hospital based on location and calls it",
  input: z
    .object({
      latitude: z.number().describe("User's latitude coordinate"),
      longitude: z.number().describe("User's longitude coordinate"),
    })
    .describe("User location coordinates"),
  output: z
    .object({
      hospitalName: z.string().describe("Closest hospital's name"),
      hospitalPhone: z.string().describe("Hospital's phone number"),
      distanceKm: z.number().describe("Distance to hospital in kilometers"),
    })
    .describe("Closest hospital information"),
  pricing: { pricePerUse: 0, currency: "USD" },
  handler: async ({ latitude, longitude }, agentInfo, context) => {
    console.log(
      `User / Agent ${agentInfo.id} requested nearest hospital at (${latitude}, ${longitude})`
    );

    // Find closest hospital
    let closestHospital = null;
    let minDistance = Infinity;

    for (const hospital of HOSPITALS) {
      const distance = haversineDistance(
        latitude,
        longitude,
        hospital.latitude,
        hospital.longitude
      );
      if (distance < minDistance) {
        minDistance = distance;
        closestHospital = hospital;
      }
    }

    if (!closestHospital) {
      throw new Error("No hospital found nearby.");
    }

    console.log(
      `Closest hospital: ${closestHospital.name} (${minDistance.toFixed(2)} km)`
    );

    // === CALL hospital with TWILIO ===
    try {
      const call = await twilioClient.calls.create({
        from: twilioCallerNumber,
        to: closestHospital.phone,
        url: twilioVoiceUrl,
      });
      console.log(`Twilio call SID: ${call.sid}`);
    } catch (error) {
      console.error("Failed to initiate Twilio call", error);
    }

    return {
      text: `Calling ${closestHospital.name}... 📞`,
      data: {
        hospitalName: closestHospital.name,
        hospitalPhone: closestHospital.phone,
        distanceKm: Number(minDistance.toFixed(2)),
      },
      ui: new CardUIBuilder()
        .setRenderMode("page")
        .title(`Hospital Contact: ${closestHospital.name}`)
        .addChild(
          new MapUIBuilder()
            .setInitialView(
              closestHospital.latitude,
              closestHospital.longitude,
              13
            )
            .addMarkers([
              {
                latitude: closestHospital.latitude,
                longitude: closestHospital.longitude,
                title: closestHospital.name,
                description: `Phone: ${closestHospital.phone}`,
                text: `${closestHospital.name}`,
              },
            ])
            .build()
        )
        .content(
          `📍 Distance: ${minDistance.toFixed(2)} km\n📞 Phone: ${closestHospital.phone}`
        )
        .build(),
    };
  }
};

// Define the Service
const dainService: DAINService = defineDAINService({
  metadata: {
    title: "Hospital Finder Service",
    description: "A DAIN service that finds the nearest hospital and calls it automatically.",
    version: "1.0.0",
    author: "Your Name",
    tags: ["hospital", "emergency", "call", "dain"],
    logo: "https://cdn-icons-png.flaticon.com/512/3062/3062634.png"
  },
  exampleQueries: [
    {
      category: "Emergency",
      queries: ["Find nearest hospital", "Call closest hospital"]
    }
  ],
  identity: {
    apiKey: process.env.DAIN_API_KEY
  },
  tools: [findAndCallHospitalConfig]
});

dainService.startNode({ port }).then(({ address }) => {
  console.log("Hospital Finder Service running at :" + address().port);
});
