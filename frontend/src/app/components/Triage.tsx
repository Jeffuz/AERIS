"use client";
import { createClient } from "@supabase/supabase-js";

// Hooks
import React, { useState, useEffect } from "react";
import { formatDistanceToNow } from "date-fns/formatDistanceToNow";

// Components
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
// import { ScrollArea } from "@radix-ui/react-scroll-area";

// Icons
import { GoPerson } from "react-icons/go";
import { AiOutlineFire } from "react-icons/ai";
import { FiChevronRight } from "react-icons/fi";
import { FaWater } from "react-icons/fa";
import { GiFallingRocks } from "react-icons/gi";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

type Detection = {
  id: string;
  type: string;
  location: string;
  urgency: number;
  confidence: number;
  timestamp: string;
};

// Relative time based on detection time stamp
function getRelativeTime(timestamp: string) {
  const date = new Date(timestamp);
  return formatDistanceToNow(date, { addSuffix: true });
}

// Get Icon + Color for Detection Type
function getDetectionIcon(type: Detection["type"]) {
  const icons = {
    person: {
      icon: <GoPerson size={16} />,
      bg: "#261938",
      color: "#7743b7",
    },
    fire: {
      icon: <AiOutlineFire size={16} />,
      bg: "#331716",
      color: "#CA4C45",
    },
    flood: {
      icon: <FaWater size={16} />,
      bg: "#394E61",
      color: "#4979DD",
    },
    debris: {
      icon: <GiFallingRocks size={16} />,
      bg: "#2C2B2A",
      color: "#8B7355",
    },
  };

  const style = icons[type as keyof typeof icons] ?? icons.person;
  return style;
}

function TriageItem({ detection }: { detection: Detection }) {
  const iconStyle = getDetectionIcon(detection.type);
  const relativeTime = getRelativeTime(detection.timestamp);

  return (
    <div className="bg-[#09090B] border border-gray-800 rounded-md overflow-hidden hover:border-gray-700 transition-colors group">
      <div className="p-3">
        <div className="flex justify-between items-start mb-2">
          {/* Informational */}
          <div className="flex items-center gap-1.5">
            {/* Detection Type - Icon */}
            <div
              className="p-1.5 rounded-full"
              style={{
                backgroundColor: iconStyle.bg,
                color: iconStyle.color,
              }}
            >
              {iconStyle.icon}
            </div>
            <div>
              {/* Detection Type - Text */}
              <div className="font-medium text-sm flex items-center gap-1 capitalize text-white/70">
                {detection.type} Detected
                <span className="text-xs bg-[#27272A] px-1 rounded">
                  {detection.id}
                </span>
              </div>
              {/* Location + Timestamp */}
              <div className="text-xs text-gray-400">
                {detection.location} • {relativeTime}
              </div>
            </div>
          </div>
          {/* Confidence score */}
          <div className="text-xs font-medium bg-[#27272A] px-1.5 py-0.5 rounded text-white/70">
            {detection.confidence}%
          </div>
        </div>

        <div className="flex items-center justify-between mt-3">
          {/* Urgency Level */}
          <div className="flex items-center gap-1">
            <span className="text-xs text-gray-400">Urgency:</span>
            <div className="flex items-center gap-0.5">
              {Array.from({ length: 10 }).map((_, i) => (
                <div
                  key={i}
                  className={`w-1 h-2 rounded-sm ${
                    i < detection.urgency ? "bg-red-500" : "bg-gray-700"
                  }`}
                />
              ))}
            </div>
          </div>

          {/* View Additional Details */}
          <Button
            variant="ghost"
            size="sm"
            className="h-6 text-xs gap-1 text-gray-400/80 hover:text-gray-400 hover:cursor-pointer"
          >
            Details
            <FiChevronRight size={12} />
          </Button>
        </div>
      </div>

      {/* CTA Buttons */}
      <div className="flex border-t border-gray-800">
        <button className="flex-1 py-1.5 text-xs font-medium hover:bg-[#27272A] text-[#3F896C] hover:cursor-pointer">
          Assign
        </button>
        <div className="w-px bg-gray-800" />
        <button className="flex-1 py-1.5 text-xs font-medium hover:bg-[#27272A] text-[#648FD4] hover:cursor-pointer">
          Dispatch
        </button>
      </div>
    </div>
  );
}

const TriageTab = () => {
  // @TODO: Fetch backend tagged drone data
  const [detections, setDetections] = useState<Detection[]>([]);

  useEffect(() => {
    async function fetchDetections() {
      try {
        const { data, error } = await supabase
          .from("images")
          .select("*")
          .order("created_at", { ascending: false });

        if (error) throw error;

        // Map Supabase data to Detection type
        const mappedData: Detection[] = data.map((item) => ({
          id: item.id.toString(),
          type: item.type,
          location: `Sector ${item.lat.toFixed(4)}, ${item.lon.toFixed(4)}`,
          urgency: item.level,
          confidence: 90,
          timestamp: item.created_at,
        }));

        setDetections(mappedData);
      } catch (err) {
        console.error("Error fetching detections:", err);
      }
    }

    fetchDetections();
  }, []);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex justify-between items-center pb-3">
        <h3 className="text-md font-medium text-white/70">Active Detections</h3>
        <div className="text-xs bg-[#27272A] px-2 py-1 rounded-md text-white/70">
          Total: <span className="text-[#648FD4]">{detections.length}</span>
        </div>
      </div>

      {/* Scrollable container */}
      <div className="flex-1 overflow-y-auto space-y-3 pr-1">
        {detections.map((detection) => (
          <TriageItem key={detection.id} detection={detection} />
        ))}
      </div>
    </div>
  );
};

const AgentTab = () => {
  return <div className="h-full">Agent</div>;
};

interface TriageProps {
  className?: string;
}

const Triage = ({ className }: TriageProps) => {
  const tabTriggerClass =
    "data-[state=active]:bg-[#1F1F22] data-[state=active]:text-white data-[state=inactive]:text-gray-500";

  // console.log(new Date());
  return (
    <section
      className={`h-full flex flex-col ${className} border-l border-gray-800 p-3`}
    >
      <Tabs
        defaultValue="triage"
        className="flex flex-col h-full overflow-hidden"
      >
        <TabsList className="w-full p-0">
          <TabsTrigger value="triage" className={tabTriggerClass}>
            Triage List
          </TabsTrigger>
          {/* <TabsTrigger value="agent" className={tabTriggerClass}>
            Agent Logs
          </TabsTrigger> */}
        </TabsList>
        <TabsContent value="triage" className="flex-1 overflow-hidden">
          <TriageTab />
        </TabsContent>
        <TabsContent value="agent" className="flex-1 overflow-hidden">
          <AgentTab />
        </TabsContent>
      </Tabs>
    </section>
  );
};

export default Triage;
