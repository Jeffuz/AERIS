import DroneStatus from "./components/DroneStatus";
import Navbar from "./components/Navbar";
import Triage from "./components/Triage";
import Map from "./components/Map";
import NotificationBar from "./components/NotificationBar";

export default function Home() {
  return (
    <div className="flex flex-col h-screen bg-[#18181B] overflow-hidden">
      <Navbar/>
      <NotificationBar/>
      <main className="grid grid-cols-4 flex-1 overflow-hidden">
        <DroneStatus className="col-span-1 overflow-hidden" />
        <Map className="col-span-2 overflow-hidden" />
        <Triage className="col-span-1 overflow-hidden" />
      </main>
    </div>
  );
}

