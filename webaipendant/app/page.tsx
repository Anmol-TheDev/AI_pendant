import { Hero } from "@/components/landing/Hero";
import { Features } from "@/components/landing/Features";
import { Overview } from "@/components/landing/Overview";
import { Footer } from "@/components/landing/Footer";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col">
      <Hero />
      <Features />
      <Overview />
      <Footer />
    </main>
  );
}
