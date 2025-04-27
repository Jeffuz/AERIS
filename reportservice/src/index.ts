//File: example/example-node.ts

import { z } from "zod";
import { createClient } from '@supabase/supabase-js';

import { defineDAINService, ToolConfig } from "@dainprotocol/service-sdk";

import {
  CardUIBuilder,
  MapUIBuilder,
} from "@dainprotocol/utils";

const port = 2022;

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

const getEntitiesConfig: ToolConfig = {
  id: "get-hazards-in-area",
  name: "Get Hazards in Area",
  description: "Fetches hazards from the database",
  input: z
    .object({
      location: z.string().describe("Location"),
    })
    .describe("Input parameters for the weather request"),
  output: z
    .object({
      hazards: z.array(z.object({
        id: z.string().describe("Entity ID"),
        imgRef: z.string().describe("Image reference"),
        latitude: z.number().describe("Latitude"),
        longitude: z.number().describe("Longitude"),
        description: z.string().describe("Entity description"),
        triageLevel: z.number().describe("Triage level"),
      })).describe("List of hazards and their details"),
    })
    .describe("List of hazards and their details"),
  handler: async (
    inputs,
    agentInfo
  ) => {
    console.log(
      `User / Agent ${agentInfo.id} requested hazards of type ${inputs.description}`
    );

    // Fetch entities from Supabase
    const { data: hazards, error } = await supabase
      .from('entities')
      .select('*')
      .eq('xCoord', -118.4513)
      .eq('yCoord', 34.0207)

    console.log(hazards);

    if (error) {
      throw new Error(`Failed to fetch entities: ${error.message}`);
    }

    // Map DB fields to schema fields
    const mappedHazards = (hazards || [])
      .map(hazard => ({
        id: hazard.id,
        imgRef: hazard.imgRef,
        latitude: hazard.yCoord,
        longitude: hazard.xCoord,
        description: hazard.description,
        triageLevel: hazard.triageLevel,
      }))

    console.log('mappedHazards', mappedHazards);

    return {
      text: `There are ${mappedHazards.length} hazards of type ${inputs.description}`,
      data: {
        hazards: mappedHazards,
      },
      ui: new CardUIBuilder()
        .setRenderMode("page")
        .title(`Hazards of type ${inputs.description}`)
        .addChild(
          new MapUIBuilder()
            .setInitialView(
              mappedHazards[0]?.latitude,
              mappedHazards[0]?.longitude,
              10
            )
            .addMarkers(
              mappedHazards.map((hazard) => ({
                latitude: hazard.latitude,
                longitude: hazard.longitude,
                text: `${hazard.description}`,
                title: `${hazard.description}`,
                description: `${hazard.description}`,
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
    title: "Hazards Service",
    description:
      "A DAIN service for reporting hazards",
    version: "1.0.0",
    author: "Your Name",
    tags: ["fire", "hazard", "people", "flood", "debris"],
    logo: "https://cdn-icons-png.flaticon.com/512/252/252035.png",
  },
  exampleQueries: [
    {
      category: "Hazards",
      queries: [
        "What are the hazards near UCLA?",
        "Are there any people in danger?",
        "Are there any fires in the area?",
      ],
    },
  ],
  identity: {
    apiKey: process.env.DAIN_API_KEY,
  },
  tools: [getEntitiesConfig],
});

dainService.startNode({ port: port }).then(({ address }) => {
  console.log("Report DAIN Service is running at :" + address().port);
});
