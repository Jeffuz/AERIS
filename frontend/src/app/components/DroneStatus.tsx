"use client";

// Hooks
import React, { useState } from "react";

// Icons
import { ChevronUp, Wifi, Battery, Eye } from "lucide-react";

type DroneData = {
  id: string;
  batteryLevel: number;
  isActive: boolean;
  altitude: number;
  speed: number;
  status: string;
};

const mockDrones: DroneData[] = [
  {
    id: "DR-001",
    batteryLevel: 85,
    isActive: true,
    altitude: 120,
    speed: 18,
    status: "Area scan: Sector A3",
  },
  {
    id: "DR-002",
    batteryLevel: 45,
    isActive: true,
    altitude: 90,
    speed: 15,
    status: "Human detection: Sector B2",
  },
  {
    id: "DR-003",
    batteryLevel: 12,
    isActive: false,
    altitude: 60,
    speed: 22,
    status: "Returning to base",
  },
  {
    id: "DR-004",
    batteryLevel: 92,
    isActive: true,
    altitude: 150,
    speed: 25,
    status: "Fire monitoring: Sector C1",
  },
  {
    id: "DR-005",
    batteryLevel: 73,
    isActive: true,
    altitude: 110,
    speed: 16,
    status: "Debris assessment: Sector D4",
  },
];

interface DroneStatusCardProps {
  id: string;
  batteryLevel: number;
  isActive?: boolean;
  altitude?: number;
  speed?: number;
  status?: string;
}

// Drone Battery Color
function getBatteryColor(level: number): string {
  if (level >= 50) return "#56B685"; // Full to low (50-100%)
  if (level >= 20) return "#AF6526"; // Low to critical (20-49%)
  return "#8A3836"; // Critical to none (0-19%)
}

function DroneStatusCard({
  id,
  batteryLevel,
  isActive = true,
  altitude = 120,
  speed = 18,
}: DroneStatusCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const batteryColor = getBatteryColor(batteryLevel);

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
            <div className="flex items-center gap-1" style={{ color: batteryColor }}>
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
  const activeDrones = mockDrones.filter((drone) => drone.isActive).length;

  return (
    <section className={`${className} p-4 border-gray-800 border-r`}>
      {/* Header */}
      <div className="flex justify-between items-center pb-4">
        <h3 className="text-lg font-medium text-white/70">Drone Fleet Status</h3>
        <div className="text-md text-white/70">
          <span className="text-[#56B685]">{activeDrones}</span>/{mockDrones.length} active
        </div>
      </div>

      <div className="space-y-3">
        {mockDrones.map((drone) => (
          <DroneStatusCard
            key={drone.id}
            id={drone.id}
            batteryLevel={drone.batteryLevel}
            isActive={drone.isActive}
            altitude={drone.altitude}
            speed={drone.speed}
            status={drone.status}
          />
        ))}
      </div>
    </section>
  );
};

export default DroneStatus;
