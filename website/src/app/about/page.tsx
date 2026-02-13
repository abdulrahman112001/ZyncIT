import { Metadata } from "next";
import AboutContent from "./AboutContent";

export const metadata: Metadata = {
  title: "About Us — Our Mission to Bridge Phone & PC",
  description:
    "Learn about iRopit — the smart device sync platform that bridges your Android phone and computer securely. Our mission, values, and the story behind building seamless device synchronization.",
  alternates: {
    canonical: "https://www.iropit.com/about",
  },
  openGraph: {
    title: "About iRopit — Smart Device Sync Platform",
    description:
      "Discover how iRopit bridges your phone and computer with real-time sync, end-to-end encryption, and a privacy-first approach.",
    url: "https://www.iropit.com/about",
  },
};

export default function AboutPage() {
  return <AboutContent />;
}
