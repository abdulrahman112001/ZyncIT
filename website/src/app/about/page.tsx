import { Metadata } from "next";
import AboutContent from "./AboutContent";

export const metadata: Metadata = {
  title: "About Us",
  description:
    "Learn about iRopit — the smart device sync platform that bridges your phone and computer securely.",
};

export default function AboutPage() {
  return <AboutContent />;
}
