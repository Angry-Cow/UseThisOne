import React, { useEffect, useRef } from 'react';
import { STATS_BG } from '@/assets';

const STATS = [
  { value: '5,000+', label: 'Students Trained', icon: '🎓' },
  { value: '98%', label: 'Student Satisfaction', icon: '⭐' },
  { value: '50+', label: 'Corporate Clients', icon: '🏢' },
  { value: '12', label: 'NJ Counties Served', icon: '📍' },
];

export const StatsSection = () => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) el.classList.add('opacity-100'); },
      { threshold: 0.2 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <section
      className="py-24 relative"
      style={{
        backgroundImage: `url(${STATS_BG})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
      }}
    >
      <div className="absolute inset-0 bg-sky-900/85" />
      <div ref={ref} className="relative z-10 max-w-7xl mx-auto px-6 opacity-0 transition-opacity duration-700">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {STATS.map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="text-4xl mb-2">{stat.icon}</div>
              <div className="text-4xl md:text-5xl font-black text-white mb-2">{stat.value}</div>
              <div className="text-sky-200 font-medium">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
