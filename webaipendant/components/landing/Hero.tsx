"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, Github, Battery, HardDrive } from "lucide-react";

export function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20 pb-10">
      <div className="container px-4 mx-auto flex flex-col items-center">
        {/* Text Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center max-w-4xl mx-auto mb-16"
        >
          <div className="inline-block px-4 py-1.5 mb-6 rounded-full border border-neutral-200 bg-white shadow-sm">
            <span className="text-sm font-medium text-neutral-600">
              New Release: AI Pendant v1.0
            </span>
          </div>

          <h1 className="text-5xl md:text-7xl font-bold mb-6 tracking-tight font-heading leading-tight text-neutral-900">
            AI Pendant - <br />
            <span className="text-neutral-500">Your Second Brain.</span>
          </h1>

          <p className="text-xl text-neutral-600 mb-8 max-w-2xl mx-auto leading-relaxed">
            Never forget conversations, meetings, or moments again.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button variant="default" size="lg" className="group rounded-full">
              Download App
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button variant="outline" size="lg" className="rounded-full">
              <a
                href="https://github.com/Anmol-TheDev/AI_pendant"
                target="_blank"
                className="flex items-center"
              >
                <Github className="w-5 h-5 mr-2" />
                View on GitHub
              </a>
            </Button>
          </div>
        </motion.div>

        {/* App Mockup */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 40 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="relative w-full max-w-[320px] md:max-w-[1000px] flex justify-center"
        >
          {/* Phone Shell */}
          <div className="relative w-[300px] h-[600px] bg-black rounded-[40px] border-4 border-neutral-800 shadow-2xl overflow-hidden z-10 mx-auto">
            {/* Dynamic Island / Notch */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/3 h-7 bg-black rounded-b-2xl z-20" />

            {/* Screen Content Simulation */}
            <div className="w-full h-full bg-[#050505] pt-12 px-6 relative flex flex-col">
              {/* Header */}
              <div className="flex justify-between items-center mb-6">
                <div className="w-8 h-8 rounded-full bg-neutral-800 flex items-center justify-center">
                  <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                </div>
                <div className="text-[10px] font-semibold tracking-widest text-neutral-500 uppercase">
                  Connected
                </div>
                <div className="w-8 h-8 rounded-full bg-neutral-800 flex items-center justify-center">
                  <div className="w-4 h-0.5 bg-neutral-400 rounded-full" />
                </div>
              </div>

              {/* AI Visualization / Main Status */}
              <div className="flex flex-col items-center justify-center mb-8 relative">
                <div className="w-32 h-32 rounded-full bg-gradient-to-tr from-blue-500/20 to-purple-500/20 flex items-center justify-center relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/10 to-purple-500/10 animate-[spin_4s_linear_infinite]" />
                  <div className="w-24 h-24 rounded-full bg-[#0a0a0a] flex items-center justify-center border border-white/5 z-10">
                    <div className="w-2 h-8 bg-white/20 rounded-full mx-1 animate-[pulse_1s_ease-in-out_infinite]" />
                    <div className="w-2 h-12 bg-white/40 rounded-full mx-1 animate-[pulse_1.2s_ease-in-out_infinite]" />
                    <div className="w-2 h-8 bg-white/20 rounded-full mx-1 animate-[pulse_1s_ease-in-out_infinite]" />
                  </div>
                </div>
                <div className="mt-4 text-center">
                  <h3 className="text-white font-medium text-lg">
                    Listening...
                  </h3>
                  <p className="text-xs text-neutral-500">
                    Processing Audio Context
                  </p>
                </div>
              </div>

              {/* Recent Memories Timeline */}
              <div className="flex-1 overflow-hidden">
                <div className="flex justify-between items-end mb-3">
                  <div className="text-xs font-bold text-neutral-400 tracking-wider">
                    TIMELINE
                  </div>
                  <div className="text-[10px] text-blue-400">View All</div>
                </div>

                <div className="space-y-3">
                  {[
                    {
                      title: "Design Sync",
                      time: "10m ago",
                      tag: "Work",
                      summary: "Action items: Update figma components...",
                    },
                    {
                      title: "Coffee with Alex",
                      time: "2h ago",
                      tag: "Social",
                      summary: "discussed camping trip next month...",
                    },
                    {
                      title: "App Idea",
                      time: "Yesterday",
                      tag: "Personal",
                      summary: "Voice note: minimalist todo list...",
                    },
                  ].map((item, i) => (
                    <div
                      key={i}
                      className="p-3 rounded-xl bg-neutral-900/50 border border-white/5 hover:bg-neutral-800/50 transition-colors"
                    >
                      <div className="flex justify-between items-start mb-1">
                        <span className="text-sm font-medium text-neutral-200">
                          {item.title}
                        </span>
                        <span className="text-[10px] text-neutral-500">
                          {item.time}
                        </span>
                      </div>
                      <p className="text-[11px] text-neutral-400 line-clamp-1 mb-2">
                        {item.summary}
                      </p>
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-white/5 text-neutral-400 border border-white/5">
                          {item.tag}
                        </span>
                        <div className="w-full h-0.5 bg-neutral-800 rounded-full overflow-hidden flex-1">
                          <div className="h-full bg-neutral-600 w-1/3" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="mt-4 pt-4 border-t border-white/5 w-full flex justify-between items-center px-2 pb-6">
                <div className="flex flex-col items-center gap-1 group">
                  <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-white/10 transition-colors">
                    <HardDrive className="w-4 h-4 text-neutral-400" />
                  </div>
                  <span className="text-[9px] text-neutral-600">Storage</span>
                </div>

                <div className="flex flex-col items-center gap-1 -mt-8">
                  <div className="w-14 h-14 rounded-full bg-white text-black flex items-center justify-center shadow-[0_0_20px_-5px_rgba(255,255,255,0.3)] hover:scale-105 transition-transform">
                    <span className="text-2xl">+</span>
                  </div>
                </div>

                <div className="flex flex-col items-center gap-1 group">
                  <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-white/10 transition-colors">
                    <Battery className="w-4 h-4 text-neutral-400" />
                  </div>
                  <span className="text-[9px] text-neutral-600">84%</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
