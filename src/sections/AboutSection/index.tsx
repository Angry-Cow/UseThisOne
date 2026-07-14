import React, { useEffect, useRef } from 'react';
import { ABOUT_IMG } from '@/assets';

const HIGHLIGHTS = [
  { label: 'Founded', value: '2015' },
  { label: 'Instructors', value: '8+' },
  { label: 'Students Trained', value: '5,000+' },
  { label: 'NJ Counties Served', value: '12' },
];

export const AboutSection = () => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) el.classList.add('opacity-100', 'translate-y-0'); },
      { threshold: 0.1 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <section className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-6">
        <div
          ref={ref}
          className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center opacity-0 translate-y-8 transition-all duration-700"
        >
          {/* Image */}
          <div className="relative">
            <div className="rounded-3xl overflow-hidden shadow-2xl">
              <img src={ABOUT_IMG} alt="SASS-TAC Training" className="w-full h-auto object-cover" />
            </div>
            <div className="absolute -bottom-6 -right-6 bg-amber-600 text-white p-6 rounded-2xl shadow-lg">
              <div className="text-3xl font-black">10+</div>
              <div className="text-sm font-semibold opacity-90">Years Training NJ</div>
            </div>
          </div>

          {/* Content */}
          <div>
            <div className="inline-flex items-center gap-2 bg-sky-50 text-sky-900 text-sm font-semibold px-4 py-2 rounded-full mb-6">
              About SASS-TAC
            </div>
            <h2 className="text-4xl md:text-5xl font-black text-slate-900 mb-6 leading-tight">
              New Jersey&#39;s Most Trusted Safety Trainers
            </h2>
            <p className="text-gray-500 leading-relaxed mb-6">
              Safe and Secure Services Tactical Training (SASS-TAC) was founded with one mission: to make New Jersey communities safer through expert education. Our team of certified instructors brings real-world law enforcement and military experience to every classroom.
            </p>
            <p className="text-gray-500 leading-relaxed mb-8">
              We serve individuals, corporations, schools, and government agencies across 12 New Jersey counties. Whether you&#39;re seeking your first CPR card or advanced tactical certification, our programs meet you where you are.
            </p>

            <div className="grid grid-cols-2 gap-4 mb-8">
              {HIGHLIGHTS.map((h) => (
                <div key={h.label} className="bg-slate-50 rounded-2xl p-4 text-center">
                  <div className="text-2xl font-black text-sky-900">{h.value}</div>
                  <div className="text-sm text-gray-500 font-medium">{h.label}</div>
                </div>
              ))}
            </div>

            <a
              href="#booking-form"
              onClick={(e) => { e.preventDefault(); const el = document.getElementById('booking-form'); if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' }); }}
              className="inline-flex items-center gap-2 bg-sky-900 text-white font-bold px-8 py-4 rounded-xl hover:bg-sky-800 transition-colors"
            >
              Get Started Today
              <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};
