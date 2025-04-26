"use client";

import React from "react";
import dynamic from "next/dynamic";

interface MapProps {
  className?: string;
}

const MapWithNoSSR = dynamic(() => import("./MapComponent"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-[#18181B] animate-pulse"></div>
  ),
});

const Map = ({ className }: MapProps) => {
  return (
    <section
      className={`${className} relative w-full h-full overflow-hidden bg-[#18181B]`}
    >
      <div className="absolute inset-0">
        <MapWithNoSSR />
      </div>
    </section>
  );
};

export default Map;
