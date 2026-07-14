import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { ServicesSectionHeader } from "@/sections/ServicesSection/components/ServicesSectionHeader";
import { ServiceCard } from "@/sections/ServicesSection/components/ServiceCard";
import {
  ICON_6,
  ICON_8,
  ICON_9,
  ICON_10,
  SERVICE_IMG_FIRST_AID,
  SERVICE_IMG_AWARENESS,
  SERVICE_IMG_PROTECTION,
  SERVICE_IMG_TOLR,
} from "@/assets";

// ── Asset token → URL resolver ─────────────────────────────────────────────
const ASSET_MAP: Record<string, string> = {
  ICON_6,
  ICON_8,
  ICON_9,
  ICON_10,
  SERVICE_IMG_FIRST_AID,
  SERVICE_IMG_AWARENESS,
  SERVICE_IMG_PROTECTION,
  SERVICE_IMG_TOLR,
};

const resolveAsset = (token: string): string => ASSET_MAP[token] ?? token;

// ── Parse listItems — handles JSON string, CSV, or plain string[] ──────────
const parseListItems = (raw: string | string[] | undefined): string[] => {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed;
  } catch {
    // not JSON — fall through
  }
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
};

// ── Static fallback data ───────────────────────────────────────────────────
const FALLBACK_SERVICES = [
  {
    iconSrc: ICON_6,
    title: "First Aid, CPR & Bleeding Control",
    description:
      "Hands-on training for life-saving emergencies. Learn by doing. You will be ready to act quickly when every second counts.",
    listItems: [
      "1st Aid and CPR",
      "Tourniquet Use",
      "Bleeding Control",
      "BLS Certification",
    ],
    buttonText: "Learn More",
    cardImageSrc: SERVICE_IMG_FIRST_AID,
    cardImageAlt: "CPR Training",
  },
  {
    iconSrc: ICON_8,
    title: "Situational Awareness and Deescalation",
    description:
      "Personal defense using escape and evasion and/or less lethal options. We have all heard Run, Hide, Fight. We must also understand the Flight, Fight, Freeze",
    listItems: [
      "Refuse to be a Victim",
      "Situational Awareness",
      "Realistic Deescalation",
      "For Civilians and L.E.O.",
    ],
    buttonText: "Learn More",
    cardImageSrc: SERVICE_IMG_AWARENESS,
    cardImageAlt: "Safe and Secure Facility",
  },
  {
    iconSrc: ICON_9,
    title: "Personal Protection",
    description:
      'Personal defense using escape and evasion and/or less lethal options. We must understand our body&#39;s "Flight, Fight, Freeze" response and learn to manage it.',
    listItems: [
      "Active Shooter Response",
      "Basic Defense and Escape",
      "O.C., Sprays for Civilians",
      "Conducted Energy Devices (stun guns) for Civilians",
    ],
    buttonText: "Learn More",
    cardImageSrc: SERVICE_IMG_PROTECTION,
    cardImageAlt: "Less-Lethal Personal Defense",
  },
  {
    iconSrc: ICON_10,
    title: "T.O.L.R.™ - Tools of Last Resort",
    description:
      "T.O.L.R.™ = Tools of Last Resort. What are the T.O.L.R.™? Firearms. Handguns for self defense and protection of others",
    listItems: [
      "Entry Level Pistol",
      "NRA Basic Pistol",
      "Defensive Pistol",
      "NJ State Permit to Carry",
    ],
    buttonText: "Learn More",
    cardImageSrc: SERVICE_IMG_TOLR,
    cardImageAlt: "T.O.L.R - Tools of Last Resort",
  },
];

export const ServicesSection = () => {
  const [dbServices, setDbServices] = useState<any[] | null>(null);
  const [isPending, setIsPending] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!supabase) {
      setIsPending(false);
      return;
    }
    supabase
      .from("Service")
      .select(
        "id, icon_src, title, description, list_items, card_image_src, card_image_alt",
      )
      .eq("switch", 1)
      .order("order", { ascending: true })
      .then(({ data, error: err }) => {
        if (err) {
          console.error("ServicesSection Supabase error:", JSON.stringify(err));
          setError(true);
        } else {
          if (data && data.length > 0) setDbServices(data);
        }
        setIsPending(false);
      });
  }, []);

  // Build the card data — prefer DB rows when available, fall back to static
  const services =
    dbServices && dbServices.length > 0
      ? dbServices.map((s) => ({
          iconSrc: resolveAsset(s.icon_src),
          title: s.title,
          description: s.description,
          listItems: parseListItems(s.list_items as unknown as string),
          buttonText: "Learn More",
          cardImageSrc: resolveAsset(s.card_image_src),
          cardImageAlt: s.card_image_alt,
        }))
      : FALLBACK_SERVICES;

  return (
    <section className="bg-white box-border caret-transparent py-24">
      <div className="box-border caret-transparent max-w-none w-full mx-auto px-6 md:max-w-screen-xl">
        <ServicesSectionHeader />

        {isPending && (
          <p className="text-center text-gray-400 py-8">Loading services…</p>
        )}
        {error && (
          <p className="text-center text-red-400 py-8">
            Could not load services. Showing default content.
          </p>
        )}

        {/* Flex-wrap: cards are always centered; up to 4 per row on desktop */}
        <div className="box-border caret-transparent flex flex-wrap justify-center gap-8">
          {services.map((service, index) => (
            <div
              key={index}
              className="w-full sm:w-[calc(50%-1rem)] lg:w-[calc(25%-1.5rem)] max-w-sm flex"
            >
              <ServiceCard {...service} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
