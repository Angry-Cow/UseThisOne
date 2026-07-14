import React from 'react';
import { CourseInvestmentList } from './components/CourseInvestmentList';

export const CourseInvestmentSection = () => {
  return (
    <section className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-sky-50 text-sky-900 text-sm font-semibold px-4 py-2 rounded-full mb-4">
            Pricing
          </div>
          <h2 className="text-4xl md:text-5xl font-black text-slate-900 mb-4">Course Investment</h2>
          <p className="text-gray-500 text-lg max-w-2xl mx-auto">
            Transparent pricing with no hidden fees. Group and corporate rates available — contact us for a custom quote.
          </p>
        </div>
        <CourseInvestmentList />
      </div>
    </section>
  );
};
