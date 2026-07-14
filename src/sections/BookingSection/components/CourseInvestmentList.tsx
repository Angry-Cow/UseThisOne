import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { CourseInvestmentItem } from "@/sections/BookingSection/components/CourseInvestmentItem";

type CourseRow = {
  title: string;
  duration: string;
  group_price?: string;
  group_price_note?: string;
  private_price?: string;
  private_price_note?: string;
  button1_text?: string;
  button2_text?: string;
};

const FALLBACK_COURSES: CourseRow[] = [
  {
    title: "Stop The Bleed",
    duration: "2 Hours • Contact us to arrange a class (Minimum 4 Attendees)",
    group_price: "$49",
    group_price_note: "per person",
    button1_text: "Contact Now",
    button2_text: "Group Rate",
  },
  {
    title: "First Aid CPR AED",
    duration: "4 Hours • Contact us to arrange a class",
    group_price: "$125",
    group_price_note: "per person",
    button1_text: "Contact Now",
    button2_text: "Group Rate",
  },
  {
    title: "ETCC Emergency Tactical Casualty Control",
    duration: "4 Hours • Contact us to arrange a class",
    group_price: "$125",
    group_price_note: "per person",
    button1_text: "Contact Now",
    button2_text: "Group Rate",
  },
  {
    title: "BLS \u2013 Basic Life Saving for Rescuers",
    duration: "4 Hours • Contact us to arrange a class",
    group_price: "$125",
    group_price_note: "per person",
    button1_text: "Contact Now",
    button2_text: "Group Rate",
  },
  {
    title: "Refuse To Be A Victim",
    duration: "4 Hours • Contact us to arrange a class (Minimum 4 Attendees)",
    group_price: "$49",
    group_price_note: "per person",
    button1_text: "Contact Now",
    button2_text: "Group Rate",
  },
  {
    title: "Situational Awareness Lvl 1",
    duration: "2 Hours • Contact us to arrange a class",
    group_price: "$95",
    group_price_note: "per person",
    button1_text: "Contact Now",
    button2_text: "Group Rate",
  },
  {
    title: "De-escalation That Works",
    duration: "2 Hours • Contact us to arrange a class",
    group_price: "$95",
    group_price_note: "per person",
    button1_text: "Contact Now",
    button2_text: "Group Rate",
  },
  {
    title: "MACE Personal Defense Spray",
    duration: "3 Hours • Contact us to arrange a class",
    group_price: "$125",
    group_price_note: "per person",
    button1_text: "Contact Now",
    button2_text: "Group Rate",
  },
  {
    title: "Conducted Energy Devices",
    duration: "3 Hours • Contact us to arrange a class",
    group_price: "$125",
    group_price_note: "per person",
    button1_text: "Contact Now",
    button2_text: "Group Rate",
  },
];

export const CourseInvestmentList = () => {
  const [dbCourses, setDbCourses] = useState<CourseRow[] | null>(null);

  useEffect(() => {
    if (!supabase) return;
    supabase
      .from("Course")
      .select(
        "title, duration, group_price, group_price_note, private_price, private_price_note, button1_text, button2_text",
      )
      .eq("switch", 1)
      .order("order", { ascending: true })
      .then(({ data }) => {
        if (data && data.length > 0) setDbCourses(data);
      });
  }, []);

  const courses =
    dbCourses && dbCourses.length > 0 ? dbCourses : FALLBACK_COURSES;

  return (
    <div className="box-border caret-transparent mb-12">
      {courses.map((item, index) => (
        <CourseInvestmentItem
          key={item.title}
          title={item.title}
          duration={item.duration}
          groupPrice={item.group_price ?? ""}
          groupPriceNote={item.group_price_note}
          privatePrice={item.private_price ?? undefined}
          privatePriceNote={item.private_price_note ?? undefined}
          buttonText={item.button1_text ?? "Contact Now"}
          courseValue={item.title}
          containerClassName={index > 0 ? "mt-6" : undefined}
        />
      ))}
    </div>
  );
};
