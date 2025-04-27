/* eslint-disable @next/next/no-img-element */
"use client";

import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import type { LatLngTuple } from "leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { MdLocationOn } from "react-icons/md";
import { renderToStaticMarkup } from "react-dom/server";
// import Image from "next/image";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

type Detection = {
  id: string;
  lat: number;
  lon: number;
  type: string;
  description: string;
  main_image: string;
};

const MapComponent = () => {
  const [detections, setDetections] = useState<Detection[]>([]);

  useEffect(() => {
    supabase
      .from("images")
      .select("id, lat, lon, type, description, main_image")
      .then(({ data, error }) => {
        if (error) {
          console.error("Error loading detections:", error);
        } else if (data) {
          const valid = data.filter((d) => d.lat != null && d.lon != null);
          setDetections(valid);
        }
      });
  }, []);

  const getIcon = (rawType: string) => {
    const type = rawType.trim().toLowerCase();
    const colorMap: Record<string, string> = {
      person: "#3F896C",
      human: "#3F896C",
      fire: "#CA4C45",
      flood: "#4979DD",
      debris: "#8B7355",
    };
    const color = colorMap[type] || "#999999";
    const svg = renderToStaticMarkup(
      <MdLocationOn style={{ color, fontSize: "32px" }} />
    );
    return L.divIcon({
      html: svg,
      className: "",
      iconSize: [32, 32],
      iconAnchor: [16, 32],
    });
  };

  const center: LatLngTuple = detections.length
    ? [detections[0].lon, detections[0].lat]
    : [34.071, -118.4453];

  return (
    <MapContainer
      center={center}
      zoom={17}
      scrollWheelZoom={true}
      className="w-full h-full"
    >
      <TileLayer
        attribution="&copy; OpenStreetMap contributors"
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {detections.map((d) => {
        const markerPos: LatLngTuple = [d.lon, d.lat];
        const cleanType = d.type.trim();

        return (
          <Marker key={d.id} position={markerPos} icon={getIcon(cleanType)}>
            <Popup>
              <div className="font-bold capitalize text-black">
                {cleanType} Detected
              </div>
              <div className="text-xs text-gray-400">{d.description}</div>
              <img
                src={`data:image/jpeg;base64,${d.main_image}`}
                alt={`${cleanType} snapshot`}
                style={{
                  maxWidth: "300px",
                  width: "100%",
                  height: "auto",
                  borderRadius: "0.25rem",
                  border: "1px solid #e5e7eb",
                }}
              />
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
};

export default MapComponent;
