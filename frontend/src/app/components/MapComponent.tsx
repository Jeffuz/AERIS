"use client";

import { MapContainer, TileLayer } from "react-leaflet";
import type { LatLngTuple } from "leaflet";
import "leaflet/dist/leaflet.css";

const position: LatLngTuple = [34.071, -118.4453];  

const MapComponent = () => {
  return (
    <MapContainer
      center={position}
      zoom={13}
      scrollWheelZoom={true}
      className="w-full h-full [&_.leaflet-tile]:invert [&_.leaflet-tile]:contrast-[3] [&_.leaflet-tile]:hue-rotate-[200deg] [&_.leaflet-tile]:saturate-[0.3] [&_.leaflet-tile]:brightness-[0.7]"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
    </MapContainer>
  );
};

export default MapComponent;
