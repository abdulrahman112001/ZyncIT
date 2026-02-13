import { Metadata } from "next";
import ServicesContent from "./ServicesContent";

export const metadata: Metadata = {
  title: "Services",
  description:
    "Explore iRopit services — SMS sync, call history, notifications, device chat, and more with end-to-end encryption.",
};

export default function ServicesPage() {
  return <ServicesContent />;
}
