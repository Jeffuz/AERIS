"use client";

// Hooks
import React, { useState } from "react";

// Icons
import { ChevronUp, Wifi, Battery, Eye } from "lucide-react";

interface DroneStatusCardProps {
  id: string;
  batteryLevel: number;
  isActive?: boolean;
  altitude?: number;
  speed?: number;
  status?: string;
}

function DroneStatusCard({
  id,
  batteryLevel,
  isActive = true,
  altitude = 120,
  speed = 18,
}: DroneStatusCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="w-full">
      <div
        className="rounded-lg transition-all duration-300 overflow-hidden cursor-pointer bg-[#09090B] border border-gray-800 hover:border-gray-700 text-white/70"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {/* Header View*/}
        <div className="flex items-center justify-between p-3">
          <div className="flex items-center gap-3">
            <div
              className={`w-3 h-3 rounded-full ${
                isActive ? "bg-[#56B685]" : "bg-red-400"
              }`}
            />
            <div className="font-medium text-white/70">Target: {id}</div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 text-[#56B685]">
              <Battery className="w-4 h-4" />
              <span className="text-sm">{batteryLevel}%</span>
            </div>
            <Wifi className="w-4 h-4 text-white/70" />
            <ChevronUp
              className={`w-4 h-4 transition-transform text-white ${
                !isExpanded && "rotate-180"
              }`}
            />
          </div>
        </div>

        {/* Expanded View */}
        {isExpanded && (
          <div className="p-4 bg-[#09090B] text-white/70 border-t border-gray-800">
            <div className="flex justify-between mb-6">
              <div>
                <div className="text-gray-400 text-sm">Altitude</div>
                <div className="font-medium text-white/70">{altitude}m</div>
              </div>
              <div>
                <div className="text-gray-400 text-sm">Speed</div>
                <div className="font-medium text-white/70">{speed}km/h</div>
              </div>
            </div>

            <button
              className="w-full flex justify-center items-center gap-2 bg-[#1F1F22] rounded-md py-2 px-4 text-sm font-medium text-white hover:bg-[#1F1F22]/80 transition-colors cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
              }}
            >
              <Eye className="w-4 h-4" />
              Camera Feed
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

interface DroneStatusProps {
  className?: string;
}

const DroneStatus = ({ className }: DroneStatusProps) => {
  return (
    <section className={`${className} p-4`}>
      {/* Header */}
      <div className="flex justify-between items-center pb-4">
        <h3 className="text-lg font-medium text-white/70">Drone Fleet Status</h3>
        <div className="text-md text-white/70">
          4/7 active
        </div>
      </div>
      <DroneStatusCard
        id="D2"
        batteryLevel={45}
        isActive={true}
        altitude={90}
        speed={12}
      />
    </section>
  );
};

export default DroneStatus;
