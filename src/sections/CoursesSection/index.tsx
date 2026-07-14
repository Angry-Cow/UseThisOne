import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { CoursesSectionHeader } from "@/sections/CoursesSection/components/CoursesSectionHeader";
import { CourseCard } from "@/sections/CoursesSection/components/CourseCard";

type Category = string;

const FALLBACK_CATEGORIES: Category[] = [
  "All",
  "First Aid",
  "Personal Defense",
  "Personal Awareness",
];

type Course = {
  title: string;
  groupPrice: string;
  groupPriceNote: string;
  privatePrice?: string;
  privatePriceNote?: string;
  features: string[];
  description: string;
  buttonText: string;
  category: Exclude<Category, "All">;
};

const COURSES: Course[] = [
  {
    title: "Refuse To Be A Victim",
    groupPrice: "$49",
    groupPriceNote: "per person - 4 person minimum",
    features: [
      '"Basic Safety Fundamentals"',
      '"At Home',
      'Work and Away"',
      '"Classroom Instruction"',
      '"Training Materials"',
      '"Certificate of Completion"',
    ],
    description:
      "A comprehensive seminar focused on situational awareness and personal safety strategies.",
    buttonText: "Contact Us Now To Schedule",
    category: "Personal Awareness",
  },
  {
    title: "Situational Awareness Level 1",
    groupPrice: "$95",
    groupPriceNote: "per person",
    features: [
      '"Realistic Scenarios"',
      '"Practical Application"',
      '"Reference Materials"',
      '"Certificate of Completion"',
    ],
    description:
      "Master the art of identifying threats before they escalate with our Level 1 certification.",
    buttonText: "Contact Us Now To Schedule",
    category: "Personal Awareness",
  },
  {
    title: "De-escalation That Works",
    groupPrice: "$95",
    groupPriceNote: "per person",
    features: [
      '"How To Go From Bad To Better"',
      '"Reduce The Chance Of Violence"',
      '"Practical Training"',
      '"Training Materials"',
      '"Certificate of Completion"',
    ],
    description:
      "Learn proven verbal and non-verbal techniques to diffuse high-tension situations safely.",
    buttonText: "Contact Us Now To Schedule",
    category: "Personal Awareness",
  },
  {
    title: "First Aid CPR AED",
    groupPrice: "$125",
    groupPriceNote: "per person - 4 person minimum",
    features: [
      '"HSI or AHA Certification Course"',
      '"Hands-on Practical Exam"',
      '"2025 Standards Compliant"',
      '"Student E-Workbook Provided"',
      '"Certificate and Card Provided"',
    ],
    description:
      "Comprehensive first aid, CPR, and AED training. Gain certification-ready skills for responding to medical emergencies.",
    buttonText: "Contact Us Now To Schedule",
    category: "First Aid",
  },
  {
    title: "BLS \u2013 Basic Life Saving for Rescuers",
    groupPrice: "$125",
    groupPriceNote: "per person",
    features: [
      '"HSI or AHA Certification Course"',
      '"Written and Hands-on Exam"',
      '"Meets NJ State Compliance"',
      '"Priority Scheduling for professionals"',
    ],
    description:
      "Comprehensive CPR and AED training for professional rescuers, EMTs, Nurses, other healthcare providers and lifeguards.",
    buttonText: "Contact Us Now To Schedule",
    category: "First Aid",
  },
  {
    title: "MACE Personal Defense Spray",
    groupPrice: "$125",
    groupPriceNote: "per person",
    features: [
      '"Basic Safety Fundamentals"',
      '"Classroom Instruction"',
      '"Inert Agent Practice"',
      '"Training Materials"',
      '"NJ Compliant OC Spray Provided"',
      '"Certificate of Completion"',
    ],
    description:
      "Learn the safe and effective use of MACE personal defense spray for civilians in NJ, including proper deployment, legal considerations, and scenario practice.",
    buttonText: "Contact Us Now To Schedule",
    category: "Personal Defense",
  },
  {
    title: "Conducted Energy Devices",
    groupPrice: "$125",
    groupPriceNote: "per person",
    features: [
      '"Basic Safety Fundamentals"',
      '"Classroom Instruction"',
      '"Practice on Training Targets"',
      '" Personal Contact CED Included"',
      '"Training Materials Provided"',
      '"Certificate of Completion"',
    ],
    description:
      "Introduction to conducted energy devices for civilians. Learn safety protocols, legal use, and practical application in self-defense situations.",
    buttonText: "Contact Us Now To Schedule",
    category: "Personal Defense",
  },
  {
    title: "Stop The Bleed",
    groupPrice: "$49",
    groupPriceNote: "per person",
    features: [
      '"Traumatic Bleeding First Aid"',
      '"Hands On Training"',
      '"Wound Packing"',
      '"Tourniquet Use"',
      '"Certificate of Completion"',
    ],
    description:
      "Life-saving training focused on rapid bleeding control and tourniquet application. Essential skills for emergency response.",
    buttonText: "Contact Us Now To Schedule",
    category: "First Aid",
  },
  {
    title: "ETCC Emergency Tactical Casualty Control",
    groupPrice: "$125",
    groupPriceNote: "per person",
    features: [
      '"Traumatic bleeding intervention"',
      '"For tactical or high risk situations"',
      '"Beyond Stop The Bleed"',
      '"Tactical or under threat considerations"',
    ],
    description:
      "Traumatic Bleeding Skills for Emergency Responders, Law Enforcement, Security, beyond Stop The Bleed with significant hands on practice on simulated bleeding wounds. Chest seal application and review of IFAK contents and requirements.",
    buttonText: "Contact Us Now To Schedule",
    category: "First Aid",
  },
];

export const CoursesSection = () => {
  const [activeCategory, setActiveCategory] = useState<Category>("All");
  const [dbCategories, setDbCategories] = useState<{ name: string }[] | null>(
    null,
  );
  const [dbCoursesRaw, setDbCoursesRaw] = useState<any[] | null>(null);

  useEffect(() => {
    if (!supabase) return;
    supabase
      .from("CourseCategory")
      .select("name")
      .eq("switch", 1)
      .order("order", { ascending: true })
      .then(({ data }) => {
        if (data && data.length > 0) setDbCategories(data);
      });

    supabase
      .from("Course")
      .select(
        "title, category, group_price, group_price_note, private_price, private_price_note, features, description, button_text",
      )
      .eq("switch", 1)
      .order("order", { ascending: true })
      .then(({ data }) => {
        if (data && data.length > 0) setDbCoursesRaw(data);
      });
  }, []);

  const categoryNames: Category[] =
    dbCategories && dbCategories.length > 0
      ? ["All", ...dbCategories.map((c) => c.name)]
      : FALLBACK_CATEGORIES;

  // Use DB records when available, fall back to static data
  const activeCourses: Course[] =
    dbCoursesRaw && dbCoursesRaw.length > 0
      ? dbCoursesRaw.map((c) => ({
          title: c.title,
          groupPrice: c.group_price ?? "",
          groupPriceNote: c.group_price_note ?? "",
          privatePrice: c.private_price ?? undefined,
          privatePriceNote: c.private_price_note ?? undefined,
          features: Array.isArray(c.features)
            ? c.features
            : (c.features ?? "")
                .split(",")
                .map((f: string) => f.trim())
                .filter(Boolean),
          description: c.description,
          buttonText: c.button_text ?? "Contact Us Now To Schedule",
          category: c.category as Exclude<Category, "All">,
        }))
      : COURSES;

  const dynamicCounts: Record<Category, number> = Object.fromEntries(
    categoryNames.map((cat) => [
      cat,
      cat === "All"
        ? activeCourses.length
        : activeCourses.filter((c) => c.category === cat).length,
    ]),
  );

  const filtered =
    activeCategory === "All"
      ? activeCourses
      : activeCourses.filter((c) => c.category === activeCategory);

  return (
    <section className="bg-slate-50 box-border caret-transparent py-24">
      <div className="box-border caret-transparent max-w-none w-full mx-auto px-6 md:max-w-screen-xl">
        <CoursesSectionHeader />

        {/* Filter tabs */}
        <div className="flex flex-wrap justify-center gap-3 mb-12">
          {categoryNames.map((cat) => {
            const isActive = activeCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold transition-all duration-200 border ${
                  isActive
                    ? "bg-sky-900 text-white border-sky-900 shadow-md scale-105"
                    : "bg-white text-sky-900 border-gray-200 hover:border-sky-900 hover:bg-sky-50"
                }`}
              >
                {cat}
                <span
                  className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-xs font-bold transition-colors duration-200 ${
                    isActive
                      ? "bg-amber-500 text-white"
                      : "bg-slate-100 text-gray-500"
                  }`}
                >
                  {dynamicCounts[cat]}
                </span>
              </button>
            );
          })}
        </div>

        {/* Course grid */}
        <div className="box-border caret-transparent gap-x-8 grid grid-cols-[repeat(1,minmax(0px,1fr))] gap-y-8 md:grid-cols-[repeat(3,minmax(0px,1fr))]">
          {filtered.map((course) => (
            <CourseCard
              key={course.title}
              title={course.title}
              groupPrice={course.groupPrice}
              groupPriceNote={course.groupPriceNote}
              privatePrice={course.privatePrice}
              privatePriceNote={course.privatePriceNote}
              features={course.features}
              description={course.description}
              buttonText={course.buttonText}
            />
          ))}
        </div>

        {filtered.length === 0 && (
          <p className="text-center text-gray-400 py-16 text-lg">
            No courses found in this category.
          </p>
        )}
      </div>
    </section>
  );
};
