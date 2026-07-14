import React from 'react';

export const AccessibilityContent = () => (
  <>
    <p>Safe and Secure Services Tactical Training (SASS-TAC) is committed to ensuring digital accessibility for people with disabilities. We continually improve the user experience for everyone.</p>
    <h3 className="font-bold text-slate-800 mt-4">Standards Conformance</h3>
    <p>We aim to conform to the Web Content Accessibility Guidelines (WCAG) 2.1, Level AA. These guidelines help make web content more accessible to people with disabilities.</p>
    <h3 className="font-bold text-slate-800 mt-4">Measures We Take</h3>
    <ul className="list-disc pl-5 space-y-1">
      <li>Include alternative text for all meaningful images</li>
      <li>Ensure sufficient color contrast throughout the site</li>
      <li>Support keyboard navigation for all interactive elements</li>
      <li>Use semantic HTML for screen reader compatibility</li>
      <li>Provide focus indicators for keyboard users</li>
    </ul>
    <h3 className="font-bold text-slate-800 mt-4">Known Limitations</h3>
    <p>We are actively working to improve all areas of our site. If you encounter an accessibility barrier, please let us know.</p>
    <h3 className="font-bold text-slate-800 mt-4">Contact Us</h3>
    <p>If you experience any accessibility issues, please contact us at <a href="mailto:info@sasstac.com" className="text-sky-700 underline">info@sasstac.com</a> or call (908) 758-4894. We aim to respond within 2 business days.</p>
  </>
);
