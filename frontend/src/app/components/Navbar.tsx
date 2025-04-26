import React from "react";

const MissionBadge = ({ status }: { status: boolean }) => {
    return (
        <div className={`flex rounded-sm uppercase px-2 py-0.5 ${status ? "bg-[#1B2925] text-[#56B685]" : "text-[#8A3836] bg-[#2C1E1F]"}`}>
            {status ? "Mission Active" : "Mission Unactive"}
        </div>
    )
}

const Navbar = () => {
  // @TODO: Check mission status
  const missionStatus: boolean = true;

  return (
    <nav className="z-50 flex flex-row w-full justify-between h-[56px] border-b border-gray-800 px-4">
      {/* Title + Data */}
      <div className="flex gap-3 items-center">
        {/* Title */}
        <h1 className="text-white text-2xl font-bold uppercase">AERIS Dashboard</h1>
        {/* Mission Status */}
        <div className="flex items-center">
          {/* @TODO: Mission State -> Mission Active, Mission Unactive */}
          <MissionBadge status={missionStatus}/>
        </div>
        {/* Analytics */}
        <div className="flex items-center"></div>
      </div>
      {/* CTA */}
    </nav>
  );
};

export default Navbar;
