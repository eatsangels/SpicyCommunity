import HomeClient from "@/components/home/HomeClient";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Spicy Community | The Ultimate Tournament Arena",
  description: "Join the most competitive community for gaming tournaments. Real-time brackets, eSports management, and live arena updates. Built for champions.",
  openGraph: {
    title: "Spicy Community | eSports Tournament Management",
    description: "Manage your tournaments with the most advanced bracket engine in the community.",
    images: ["/logo_new.png"],
  },
  twitter: {
    title: "Spicy Community | eSports Arena",
    description: "The ultimate tournament experience starts here.",
    images: ["/logo_new.png"],
  },
};

export default function HomePage() {
  return <HomeClient />;
}
