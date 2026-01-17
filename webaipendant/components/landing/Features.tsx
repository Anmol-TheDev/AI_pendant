"use client";

import { motion } from "framer-motion";
import { Activity, Wifi, Film, Layers, Zap, Smartphone } from "lucide-react";

const features = [
  {
    icon: Activity,
    title: "Real-time Monitoring",
    description:
      "Track battery status, storage capacity, and recording states of your Raspberry Pi Zero instantly.",
  },
  {
    icon: Wifi,
    title: "Smart Sync",
    description:
      "Auto-synchronizes your captured data over local WiFi. No cables needed.",
  },
  {
    icon: Film,
    title: "Media Library",
    description:
      "Browse, filter, and playback your audio and video clips directly on your phone.",
  },
  {
    icon: Layers,
    title: "Offline Mode",
    description:
      "Queue actions when offline. they sync automatically once you reconnect.",
  },
  {
    icon: Zap,
    title: "Instant Export",
    description:
      "Save important moments to your gallery or share them to other apps with one tap.",
  },
  {
    icon: Smartphone,
    title: "Native Performance",
    description:
      "Built with React Native and Expo for a buttery smooth 60fps experience.",
  },
];

export function Features() {
  return (
    <section className="py-24 relative bg-white" id="features">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold font-heading mb-4 text-neutral-900">
            Power in your <span className="text-neutral-500">Pocket</span>
          </h2>
          <p className="text-neutral-600 max-w-xl mx-auto">
            Everything you need to manage your wearable device, packed into a
            beautiful native interface.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="p-6 rounded-2xl bg-white border border-neutral-200 hover:border-neutral-300 hover:shadow-lg transition-all group"
            >
              <div className="w-12 h-12 rounded-xl bg-neutral-100 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                <feature.icon className="w-6 h-6 text-neutral-900" />
              </div>
              <h3 className="text-xl font-bold mb-2 text-neutral-900">
                {feature.title}
              </h3>
              <p className="text-sm text-neutral-600 leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
