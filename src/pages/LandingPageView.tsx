import React, { useEffect, useRef, useState } from "react";
// useRef, useState, useEffect used by AutoResizeIframe
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Navbar } from "@/sections/Navbar";
import { Footer } from "@/sections/Footer";

type PageData = {
  name: string;
  iframe_src: string | null;
};

export default function LandingPageView() {
  const { slug } = useParams<{ slug: string }>();
  const [page, setPage] = useState<PageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!slug) {
      setNotFound(true);
      setLoading(false);
      return;
    }
    (async () => {
      const { data, error } = await supabase
        .from("LandingPage")
        .select("name, iframe_src")
        .eq("slug", slug)
        .eq("is_published", true)
        .single();

      if (error || !data) {
        setNotFound(true);
      } else {
        setPage(data);
        document.title = `${data.name} | T.O.L.R.™`;
      }
      setLoading(false);
    })();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center pt-24">
          <div className="flex flex-col items-center gap-3 text-slate-400">
            <svg
              className="w-8 h-8 animate-spin"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v8H4z"
              />
            </svg>
            <span className="text-sm">Loading…</span>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (notFound || !page) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center pt-24 px-6">
          <div className="text-center max-w-md">
            <div className="w-16 h-16 rounded-2xl bg-amber-100 flex items-center justify-center mx-auto mb-5">
              <svg
                className="w-8 h-8 text-amber-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 mb-2">
              Page not found
            </h1>
            <p className="text-slate-500 mb-6">
              This offer page doesn&#39;t exist or is no longer available.
            </p>
            <Link
              to="/"
              className="inline-flex items-center gap-2 px-6 py-3 bg-amber-600 hover:bg-amber-500 text-white font-semibold rounded-full transition"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                />
              </svg>
              Back to Home
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const finalSrc: string = page.iframe_src ?? "";

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />

      <div className="h-20" />

      <div className="h-4" />

      <main className="flex-1 flex flex-col items-center px-4 pb-0">
        <div
          className="w-full"
          style={{ maxWidth: "900px", overflow: "hidden" }}
        >
          {finalSrc ? (
            <AutoResizeIframe src={finalSrc} title={page.name} />
          ) : (
            <div className="flex flex-col items-center justify-center py-24 text-slate-400 gap-3">
              <svg
                className="w-10 h-10 text-slate-300"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
                />
              </svg>
              <p className="text-sm">
                No embed content configured for this page.
              </p>
            </div>
          )}
        </div>
      </main>

      <div className="h-10" />

      <Footer />
    </div>
  );
}

function AutoResizeIframe({ src, title }: { src: string; title: string }) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [height, setHeight] = useState(600);

  useEffect(() => {
    const handler = (event: MessageEvent) => {
      if (event.data && event.data.height) {
        setHeight(event.data.height);
      }
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, []);

  return (
    <iframe
      id="lp-frame"
      ref={iframeRef}
      src={src}
      title={title}
      className="w-full rounded-xl shadow-md"
      style={{
        width: "100%",
        border: "none",
        height: `${height}px`,
        display: "block",
      }}
      sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox allow-top-navigation-by-user-activation"
    />
  );
}
