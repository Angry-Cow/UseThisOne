import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { WHY_US_VIDEO_URL } from "@/assets";

const FALLBACK = {
  videoUrl: WHY_US_VIDEO_URL,
  quote:
    "I would personally like to thank you for considering Safe and Secure Services for your personal protection, defense and safety needs.",
  name: "Larry",
  role: "Owner & Lead Instructor",
  initial: "L",
};

export const WhyUsMedia = () => {
  const [card, setCard] = useState<{
    videoUrl?: string;
    quote?: string;
    name?: string;
    role?: string;
    initial?: string;
  } | null>(null);

  useEffect(() => {
    if (!supabase) return;
    supabase
      .from("WhyUsCard")
      .select("video_url, quote, name, role, initial")
      .eq("switch", 1)
      .order("order", { ascending: true })
      .limit(1)
      .then(({ data }) => {
        if (data && data.length > 0)
          setCard({
            videoUrl: data[0].video_url,
            quote: data[0].quote,
            name: data[0].name,
            role: data[0].role,
            initial: data[0].initial,
          });
      });
  }, []);

  const videoSrc = card?.videoUrl || FALLBACK.videoUrl;
  const quote = card?.quote || FALLBACK.quote;
  const name = card?.name || FALLBACK.name;
  const role = card?.role || FALLBACK.role;
  const initial = card?.initial || FALLBACK.initial;

  return (
    <div className="relative box-border caret-transparent min-h-[auto] min-w-[auto] w-auto md:w-6/12">
      <div className="relative bg-white shadow-[rgba(0,0,0,0)_0px_0px_0px_0px,rgba(0,0,0,0)_0px_0px_0px_0px,rgba(0,0,0,0.25)_0px_25px_50px_-12px] box-border caret-transparent flex flex-col justify-between min-h-[400px] z-10 p-10 rounded-[40px]">
        <div className="box-border caret-transparent min-h-[auto] min-w-[auto]">
          <div className="box-border caret-transparent flex justify-center w-full mb-6 pb-1.5">
            <video
              key={videoSrc}
              controls
              controlsList="nodownload"
              onContextMenu={(e) => e.preventDefault()}
              preload="metadata"
              className="aspect-square shadow-[rgba(0,0,0,0)_0px_0px_0px_0px,rgba(0,0,0,0)_0px_0px_0px_0px,rgba(0,0,0,0.1)_0px_4px_6px_-1px,rgba(0,0,0,0.1)_0px_2px_4px_-2px] box-border caret-transparent max-w-full min-h-[auto] min-w-[auto] object-cover w-[33.33%] border border-gray-100 rounded-xl border-solid"
            >
              <source src={videoSrc} type="video/mp4" />
              Your browser does not support the video tag.
            </video>
          </div>
          <div className="relative box-border caret-transparent overflow-hidden">
            <div className="relative box-border caret-transparent">
              <p className="text-2xl italic box-border caret-transparent leading-[39px] mb-8 font-roboto">
                <span className="box-border caret-transparent">
                  &quot;{quote}&quot;
                </span>
              </p>
              <div className="items-center box-border caret-transparent gap-x-4 flex gap-y-4">
                <div className="text-white text-xl font-bold items-center bg-sky-900 box-border caret-transparent flex h-14 justify-center leading-7 min-h-[auto] min-w-[auto] w-14 rounded-full">
                  {initial}
                </div>
                <div className="box-border caret-transparent min-h-[auto] min-w-[auto]">
                  <p className="text-lg font-bold box-border caret-transparent leading-7">
                    <span className="box-border caret-transparent">{name}</span>
                  </p>
                  <p className="text-gray-500 text-sm box-border caret-transparent leading-5">
                    <span className="box-border caret-transparent">{role}</span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="absolute bg-sky-900/10 box-border caret-transparent blur-3xl h-64 w-64 rounded-full -right-10 -top-10"></div>
      <div className="absolute bg-amber-600/10 box-border caret-transparent blur-3xl h-64 w-64 rounded-full -left-10 -bottom-10"></div>
    </div>
  );
};
