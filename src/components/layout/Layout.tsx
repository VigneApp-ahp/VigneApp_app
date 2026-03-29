import { Outlet } from "react-router-dom";
import BottomBar from "./BottomBar";
import Header from "./Header";
import BackgroundGradient from "@/components/shared/BackgroundGradient";

export default function Layout() {
  return (
    <div className="min-h-screen w-full relative">
      <BackgroundGradient />
      <Header />
      <main className="pt-16 pb-24 min-h-screen">
        <Outlet />
      </main>
      <BottomBar />
    </div>
  );
}
