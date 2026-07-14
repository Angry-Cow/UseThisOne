import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Navbar } from "@/sections/Navbar";
import { Hero } from "@/sections/Hero";
import { ServicesSection } from "@/sections/ServicesSection";
import { WhyUsSection } from "@/sections/WhyUsSection";
import { TestimonialsSection } from "@/sections/TestimonialsSection";
import { CoursesSection } from "@/sections/CoursesSection";
import { BookingSection } from "@/sections/BookingSection";
import { CtaSection } from "@/sections/CtaSection";
import { FaqSection } from "@/sections/FaqSection";
import { Footer } from "@/sections/Footer";
import { MobileFloatingButton } from "@/components/MobileFloatingButton";
import AdminLogin from "@/pages/admin/AdminLogin";
import AdminAuthSetup from "@/pages/admin/AdminAuthSetup";
import AdminDashboard from "@/pages/admin/AdminDashboard";
import CoursesManager from "@/pages/admin/content/CoursesManager";
import ServicesManager from "@/pages/admin/content/ServicesManager";
import OfferingsManager from "@/pages/admin/content/OfferingsManager";
import FaqsManager from "@/pages/admin/content/FaqsManager";
import BookingsManager from "@/pages/admin/content/BookingsManager";
import CategoriesManager from "@/pages/admin/content/CategoriesManager";
import ReviewsManager from "@/pages/admin/content/ReviewsManager";
import WhyUsReasonsManager from "@/pages/admin/content/WhyUsReasonsManager";
import WhyUsCardManager from "@/pages/admin/content/WhyUsCardManager";
import GroupBookingsManager from "@/pages/admin/content/GroupBookingsManager";
import LandingPagesManager from "@/pages/admin/content/LandingPagesManager";
import LandingPageForm from "@/pages/admin/content/LandingPageForm";
import LandingPageView from "@/pages/LandingPageView";
import SectionManagementPage from "@/pages/admin/content/SectionManagementPage";
import UsefulLinksManager from "@/pages/admin/content/UsefulLinksManager";
import SiteSetupPage from "@/pages/admin/content/SiteSetupPage";
import ResourcesManager from "@/pages/admin/content/ResourcesManager";

function MainSite() {
  const handleContextMenu = (e: React.MouseEvent<HTMLDivElement>) => {
    const tag = (e.target as HTMLElement).tagName.toLowerCase();
    if (tag === "img" || tag === "video" || tag === "source") {
      e.preventDefault();
    }
  };

  return (
    <div
      className="text-black text-base font-normal font-inter bg-slate-50 text-slate-900 min-h-screen"
      onContextMenu={handleContextMenu}
    >
      <Navbar />
      <section id="home">
        <Hero />
      </section>
      <section id="services">
        <ServicesSection />
      </section>
      <section id="why-us">
        <WhyUsSection />
      </section>
      <TestimonialsSection />
      <section id="courses">
        <CoursesSection />
      </section>
      <section id="pricing">
        <BookingSection />
      </section>
      <CtaSection />
      <section id="faq">
        <FaqSection />
      </section>
      <div id="contact" className="py-16 bg-slate-50" />
      <Footer />
      <MobileFloatingButton />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainSite />} />
        <Route path="/admin" element={<AdminLogin />} />
        <Route path="/admin/setup" element={<AdminAuthSetup />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/admin/content/courses" element={<CoursesManager />} />
        <Route path="/admin/content/services" element={<ServicesManager />} />
        <Route path="/admin/content/offerings" element={<OfferingsManager />} />
        <Route path="/admin/content/faqs" element={<FaqsManager />} />
        <Route path="/admin/content/bookings" element={<BookingsManager />} />
        <Route
          path="/admin/content/categories"
          element={<CategoriesManager />}
        />
        <Route path="/admin/content/reviews" element={<ReviewsManager />} />
        <Route
          path="/admin/content/whyus-reasons"
          element={<WhyUsReasonsManager />}
        />
        <Route
          path="/admin/content/whyus-card"
          element={<WhyUsCardManager />}
        />
        <Route
          path="/admin/content/group-bookings"
          element={<GroupBookingsManager />}
        />
        <Route
          path="/admin/content/landing-pages"
          element={<LandingPagesManager />}
        />
        <Route
          path="/admin/content/landing-pages/new"
          element={<LandingPageForm />}
        />
        <Route
          path="/admin/content/landing-pages/edit/:id"
          element={<LandingPageForm />}
        />
        <Route
          path="/admin/content/useful-links"
          element={<UsefulLinksManager />}
        />
        <Route
          path="/admin/content/section-management"
          element={<SectionManagementPage />}
        />
        <Route path="/admin/content/site-setup" element={<SiteSetupPage />} />
        <Route path="/admin/content/resources" element={<ResourcesManager />} />
        <Route path="/offers/:slug" element={<LandingPageView />} />
      </Routes>
    </BrowserRouter>
  );
}
