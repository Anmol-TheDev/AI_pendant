"use client";

import { motion } from "framer-motion";
import { Cpu, Server, Wifi, Smartphone } from "lucide-react";

export function Overview() {
  return (
    <section className="py-24 bg-[#FAFAFA] relative overflow-hidden">
      {/* Subtle Pattern Grid - Optional, made very subtle */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      <div className="container mx-auto px-4 relative z-10">
        <div className="flex flex-col lg:flex-row items-center gap-16">
          <div className="flex-1 space-y-8">
            <h2 className="text-3xl md:text-5xl font-bold font-heading leading-tight text-neutral-900">
              Seamlessly connected via <br />
              <span className="text-neutral-500">Local Network</span>
            </h2>
            <p className="text-lg text-neutral-600 leading-relaxed">
              The Pendant app communicates directly with your Raspberry Pi Zero
              over WiFi. No cloud servers required—your data stays yours.
            </p>

            <div className="space-y-6">
              {[
                { label: "Connects via mDNS Discovery", icon: Wifi },
                { label: "Rest API Communication", icon: Server },
                { label: "FastAPI Backend on Pi", icon: Cpu },
                { label: "Native iOS & Android Client", icon: Smartphone },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center border border-neutral-200 shadow-sm">
                    <item.icon className="w-5 h-5 text-neutral-900" />
                  </div>
                  <span className="text-neutral-900 font-medium">
                    {item.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex-1 w-full relative">
            <div className="relative z-10 p-8 rounded-3xl bg-white border border-neutral-200 shadow-xl">
              <pre className="text-sm font-mono text-neutral-700 overflow-x-auto">
                {`// Pendant Architecture
{
  "device": {
    "model": "Raspberry Pi Zero W",
    "os": "DietPi / Raspbian",
    "server": "FastAPI"
  },
  "app": {
    "framework": "React Native",
    "engine": "Expo SDK 54",
    "style": "NativeWind"
  },
  "protocol": {
    "transfer": "HTTP/REST",
    "sync": "Background Fetch"
  }
}`}
              </pre>
            </div>

            {/* Soft shadow instead of glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] h-[90%] bg-black/5 blur-3xl -z-10 rounded-full" />
          </div>
        </div>
      </div>
    </section>
  );
}
