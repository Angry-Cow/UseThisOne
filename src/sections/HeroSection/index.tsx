import React, { useEffect, useRef } from "react";
import { HERO_BG_URL } from "@/assets";

export const HeroSection = () => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting)
          el.classList.add("opacity-100", "translate-y-0");
      },
      { threshold: 0.1 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div
      className="relative min-h-screen flex items-center justify-center"
      style={{
        backgroundImage: `url(${HERO_BG_URL})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      {/* Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-900/80 via-slate-900/60 to-slate-900/80" />

      <div
        ref={ref}
        className="relative z-10 max-w-4xl mx-auto px-6 text-center opacity-0 translate-y-8 transition-all duration-700"
      >
        <div className="inline-flex items-center gap-2 bg-amber-600/20 border border-amber-600/40 text-amber-400 text-sm font-semibold px-4 py-2 rounded-full mb-6">
          <span className="h-2 w-2 bg-amber-400 rounded-full animate-pulse" />
          New Jersey&#39;s Premier Safety Training
        </div>

        <h1 className="text-5xl md:text-7xl font-black text-white leading-tight mb-6">
          Train Smart.
          <br />
          <span className="text-amber-500">Stay Safe.</span>
        </h1>

        <p className="text-lg md:text-xl text-slate-300 max-w-2xl mx-auto mb-10 leading-relaxed">
          Professional CPR, threat awareness, personal protection, and tactical
          firearms training for civilians, corporations, and law enforcement.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <a
            href="#booking-form"
            onClick={(e) => {
              e.preventDefault();
              const el = document.getElementById("booking-form");
              if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
            }}
            className="bg-amber-600 text-white font-bold px-8 py-4 rounded-xl text-lg hover:bg-amber-700 transition-all hover:scale-105 shadow-lg shadow-amber-600/30"
          >
            Book a Course
          </a>
          <a
            href="#courses"
            className="border-2 border-white/30 text-white font-bold px-8 py-4 rounded-xl text-lg hover:bg-white/10 transition-all backdrop-blur-sm"
          >
            View Courses
          </a>
        </div>

        <div className="flex items-center justify-center gap-8 mt-16 text-slate-400 text-sm">
          <div className="flex items-center gap-2">
            <svg
              className="h-5 w-5 text-amber-500"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            NJ State Certified
          </div>
          <div className="flex items-center gap-2">
            <svg
              className="h-5 w-5 text-amber-500"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            AHA / Red Cross Certified
          </div>
          <div className="flex items-center gap-2">
            <svg
              className="h-5 w-5 text-amber-500"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            Group &amp; Corporate Training
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
        <svg
          className="h-6 w-6 text-white/50"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </div>
    </div>
  );
};
