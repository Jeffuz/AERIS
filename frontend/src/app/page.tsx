import DroneStatus from "./components/DroneStatus";
import Navbar from "./components/Navbar";
import Triage from "./components/Triage";
import Map from "./components/Map";
import NotificationBar from "./components/NotificationBar";

export default function Home() {
  return (
    <div className="flex flex-col h-screen bg-[#18181B]">
      <Navbar/>
      <NotificationBar/>
      <main className="flex flex-row">
        <DroneStatus />
        <Triage/>
        <Map />
      </main>
    </div>
  );
}
