import { Metadata } from "next";
import ContactContent from "./ContactContent";

export const metadata: Metadata = {
  title: "Contact Us",
  description:
    "Get in touch with the iRopit team. We'd love to hear from you — questions, feedback, or support.",
};

export default function ContactPage() {
  return <ContactContent />;
}
