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


const GOOGLE_API_KEY = "AIzaSyDAug4Znn8xVPiwjRkRAg5IguT_f1Vb6pc";

// Haversine formula
function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const toRad = (value: number) => (value * Math.PI) / 180;
  const R = 6371; // km

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a = Math.sin(dLat / 2) ** 2 +
            Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
            Math.sin(dLon / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// latitude:
// Tool Config
const findAndCallHospitalConfig: ToolConfig = {
  id: "find-and-call-hospital",
  name: "Find and Call Hospital",
  description: "Finds the closest hospital using Google Maps API and calls it (skipping hospitals with no phone number)",
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


    const placesResponse = await axios.get(
      'https://maps.googleapis.com/maps/api/place/nearbysearch/json',
      {
        params: {
          location: `${latitude},${longitude}`,
          radius: 10000, // 10 km
          type: "hospital",
          key: GOOGLE_API_KEY,
        },
      }
    );

    const hospitals = placesResponse.data.results;
    if (!hospitals.length) {
      throw new Error("No hospitals found nearby.");
    }

    console.log(`Found ${hospitals.length} hospitals nearby.`);


    let chosenHospital: any = null;
    let hospitalPhone: string | null = null;
    let hospitalDistanceKm: number = 0;

    for (const hospital of hospitals) {
      const hospitalLocation = hospital.geometry.location;
      const hospitalName = hospital.name;
      const placeId = hospital.place_id;

      hospitalDistanceKm = haversineDistance(
        latitude,
        longitude,
        hospitalLocation.lat,
        hospitalLocation.lng
      );

      console.log(`Checking hospital: ${hospitalName} (${hospitalDistanceKm.toFixed(2)} km)`);

      // Fetch hospital details
      const detailsResponse = await axios.get(
        `https://maps.googleapis.com/maps/api/place/details/json`,
        {
          params: {
            place_id: placeId,
            fields: "name,formatted_phone_number",
            key: GOOGLE_API_KEY,
          },
        }
      );

      hospitalPhone = detailsResponse.data.result?.formatted_phone_number;
      
      if (hospitalPhone) {
        chosenHospital = {
          name: hospitalName,
          location: hospitalLocation,
          phone: hospitalPhone,
        };
        console.log(`Found hospital with phone: ${hospitalName} - ${hospitalPhone}`);
        break; // stop loop
      } else {
        console.log(`Skipping ${hospitalName} (no phone number).`);
      }
    }

    if (!chosenHospital) {
      throw new Error("No reachable hospitals found with a phone number.");
    }

    
    try {
      const call = await twilioClient.calls.create({
        from: twilioCallerNumber,
        to: "+17209087740",
        url: twilioVoiceUrl,
      });
      console.log(`Twilio call SID: ${call.sid}`);
    } catch (error) {
      console.error("Failed to initiate Twilio call", error);
    }

    return {
      text: `Calling ${chosenHospital.name}... 📞`,
      data: {
        hospitalName: chosenHospital.name,
        hospitalPhone: chosenHospital.phone,
        distanceKm: Number(hospitalDistanceKm.toFixed(2)),
      },
      ui: new CardUIBuilder()
        .setRenderMode("page")
        .title(`Hospital Contact: ${chosenHospital.name}`)
        .addChild(
          new MapUIBuilder()
            .setInitialView(chosenHospital.location.lat, chosenHospital.location.lng, 13)
            .addMarkers([
              {
                latitude: chosenHospital.location.lat,
                longitude: chosenHospital.location.lng,
                title: chosenHospital.name,
                description: `Phone: ${chosenHospital.phone}`,
                text: `${chosenHospital.name}`,
              },
            ])
            .build()
        )
        .content(
          `📍 Distance: ${hospitalDistanceKm.toFixed(2)} km\n📞 Phone: ${chosenHospital.phone}`
        )
        .build(),
    };
  },
};

// Define the Service
const dainService: DAINService = defineDAINService({
  metadata: {
    title: "Hospital Finder Service (Smart)",
    description: "Finds the closest reachable hospital via Google Maps and calls it with Twilio",
    version: "1.0.0",
    author: "Your Name",
    tags: ["hospital", "emergency", "call", "dain"],
    logo: "https://cdn-icons-png.flaticon.com/512/3062/3062634.png"
  },
  exampleQueries: [
    {
      category: "Emergency",
      queries: ["Find nearest hospital", "Call reachable hospital"]
    }
  ],
  identity: {
    apiKey: process.env.DAIN_API_KEY,
  },
  tools: [findAndCallHospitalConfig],
});

dainService.startNode({ port }).then(({ address }) => {
  console.log("Hospital Finder Service running at :" + address().port);
});
