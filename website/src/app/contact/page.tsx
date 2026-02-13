import { Metadata } from "next";
import ContactContent from "./ContactContent";

export const metadata: Metadata = {
  title: "Contact Us — Get Support & Share Feedback",
  description:
    "Reach out to the iRopit team for support, feedback, or feature requests. We're here to help you get the most out of your device sync experience.",
  alternates: {
    canonical: "https://www.iropit.com/contact",
  },
  openGraph: {
    title: "Contact iRopit — We'd Love to Hear From You",
    description:
      "Have questions about syncing your devices? Need support? Send us a message and we'll get back to you.",
    url: "https://www.iropit.com/contact",
  },
};

export default function ContactPage() {
  return <ContactContent />;
}
