import { z } from "zod";
import axios from "axios";
import { defineDAINService, ToolConfig, type DAINService } from "@dainprotocol/service-sdk";
import { CardUIBuilder, MapUIBuilder } from "@dainprotocol/utils";
import twilio from "twilio";

const accountSid = "ACdde7b682cc5da97f66cb162782b3f453";
const authToken = "c467efd7ec600dc798435d3324cf9a69";
const twilioClient = twilio(accountSid, authToken);

const twilioCallerNumber = "+18666916450"; 
const twilioVoiceUrl = "https://fallow-salamander-9631.twil.io/assets/audio3459472596.m4a";
const port = Number(process.env.PORT) || 3030;

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;

// Haversine distance
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

// Tool
const findAndCallHospitalConfig: ToolConfig = {
  id: "find-and-call-hospital",
  name: "Find and Call Hospital",
  description: "Finds the closest hospital using Google Places API (v1) and calls it",
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
    console.log(`User requested nearest hospital at (${latitude}, ${longitude})`);
    console.log("GOOGLE_API_KEY", process.env.GOOGLE_API_KEY);

    const nearby = await axios.get(
      `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${latitude},${longitude}&radius=5000&type=hospital&key=AIzaSyCoUOayAxeeetBncLMxoodlvi4MsGvnDVk`,
    
    );

    const results = nearby.data.results;
    console.log("results", results);
    // if (results.length === 0) {
    //   throw new Error("No hospitals found nearby.");
    // }
    if (!nearby.data || !nearby.data.status || nearby.data.status !== "OK") {
      throw new Error(`Google Places API error: ${nearby.data?.status}`);
    }

    

    let chosen: {
      name: string;
      phone: string;
      lat: number;
      lng: number;
    } | null = null;
    let bestDistance = Infinity;

   
    for (const place of results) {
      const { lat, lng }     = place.geometry.location;
      const distanceKm        = haversineDistance(latitude, longitude, lat, lng);
      const placeId: string   = place.place_id;

     
      const details = await axios.get(
        `https://maps.googleapis.com/maps/api/place/details/json?fields=name%2Crating%2Cformatted_phone_number&place_id=${placeId}&key=AIzaSyCoUOayAxeeetBncLMxoodlvi4MsGvnDVk`, 
        
      );

      const data = details.data.result;
      const phone = data.formatted_phone_number as string | undefined;

      if (phone) {
        chosen = { name: data.name, phone, lat, lng };
        bestDistance = distanceKm;
        break; 
      }
    }

    if (!chosen) throw new Error("No hospital with a phone number found.");

    
    try {
      const call = await twilioClient.calls.create({
        from: twilioCallerNumber,
        to: "+17209087740", 
        url: twilioVoiceUrl,
      });
      console.log("Placed call, SID:", call.sid);
    } catch (err) {
      console.error("Twilio call failed:", err);
    }

    
    return {
      text: `Calling ${chosen.name}... 📞`,
      data: {
        hospitalName: chosen.name,
        hospitalPhone: chosen.phone,
        distanceKm: Number(bestDistance.toFixed(2)),
      },
      ui: new CardUIBuilder()
        .setRenderMode("page")
        .title(`Hospital Contact: ${chosen.name}`)
        .addChild(
          new MapUIBuilder()
            .setInitialView(chosen.lat, chosen.lng, 13)
            .addMarkers([
              {
                latitude: chosen.lat,
                longitude: chosen.lng,
                title: chosen.name,
                description: `Phone: ${chosen.phone}`,
                text: chosen.name,
              },
            ])
            .build()
        )
        .content(
          `📍 Distance: ${bestDistance.toFixed(
            2
          )} km\n📞 Phone: ${chosen.phone}`
        )
        .build(),
    };
  },
};


const service: DAINService = defineDAINService({
  metadata: {
    title: "Hospital Finder Service",
    description:
      "Finds and calls the nearest hospital using Google Places (legacy) & Twilio",
    version: "1.0.0",
    author: "Your Name",
    tags: ["hospital", "emergency", "call"],
    logo:
      "https://cdn-icons-png.flaticon.com/512/3062/3062634.png",
  },
  exampleQueries: [
    { category: "Emergency", queries: ["Find nearest hospital"] },
  ],
  identity: { apiKey: process.env.DAIN_API_KEY },
  tools: [findAndCallHospitalConfig],
});

service.startNode({ port }).then(({ address }) =>
  console.log(`Hospital-Finder listening on :${address().port}`)
);