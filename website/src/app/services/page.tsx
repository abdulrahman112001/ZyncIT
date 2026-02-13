import { Metadata } from "next";
import ServicesContent from "./ServicesContent";

export const metadata: Metadata = {
  title: "Services — SMS Sync, Call History, Notifications & More",
  description:
    "Explore iRopit's powerful features: real-time SMS sync to PC, call history access, WhatsApp & Telegram notification sync, encrypted device chat with file sharing, and multi-device support.",
  alternates: {
    canonical: "https://www.iropit.com/services",
  },
  openGraph: {
    title: "iRopit Services — Complete Phone-to-PC Sync",
    description:
      "SMS sync, call history, notification forwarding, device chat & file sharing — all encrypted and free.",
    url: "https://www.iropit.com/services",
  },
};

export default function ServicesPage() {
  return <ServicesContent />;
}
