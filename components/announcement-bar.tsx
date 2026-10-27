"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useCatalog } from "./store-provider";
import { FacebookIcon, InstagramIcon, XIcon } from "./social-icons";

/** Top ribbon: rotating messages in the middle, social links on the right. Both are edited in Admin → Site Settings. */
export function AnnouncementBar() {
  const { settings } = useCatalog();
  const messages = settings.announcements;
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (messages.length < 2) return;
    const t = setInterval(() => setIndex((i) => (i + 1) % messages.length), 5000);
    return () => clearInterval(t);
  }, [messages.length]);

  const go = (dir: number) => setIndex((i) => (i + dir + messages.length) % messages.length);
  const several = messages.length > 1;

  const social = [
    { label: "Instagram", href: settings.instagram, icon: InstagramIcon },
    { label: "Facebook", href: settings.facebook, icon: FacebookIcon },
    { label: "X (Twitter)", href: settings.twitter, icon: XIcon },
  ].filter((s) => s.href);

  // Nothing to say and nowhere to link: no ribbon at all.
  if (!messages.length && !social.length) return null;

  return (
    <div className="bg-ink text-white">
      <div className="container-x flex h-9 items-center gap-3 md:grid md:grid-cols-[1fr_minmax(0,auto)_1fr]">
        <span className="hidden md:block" />
        <div className="flex min-w-0 flex-1 items-center justify-center gap-4">
          {several && (
            <button aria-label="Previous message" onClick={() => go(-1)} className="opacity-60 hover:opacity-100">
              <ChevronLeft size={14} />
            </button>
          )}
          {messages.length > 0 && (
            <p key={index} className="animate-fade-in truncate text-center text-[11px] uppercase tracking-[0.18em]">
              {messages[index % messages.length]}
            </p>
          )}
          {several && (
            <button aria-label="Next message" onClick={() => go(1)} className="opacity-60 hover:opacity-100">
              <ChevronRight size={14} />
            </button>
          )}
        </div>
        <ul className="flex shrink-0 items-center justify-end gap-3.5">
          {social.map(({ label, href, icon: Icon }) => (
            <li key={label}>
              <a href={href} target="_blank" rel="noopener noreferrer" aria-label={`TATTV on ${label}`} title={label} className="block opacity-70 transition-opacity hover:opacity-100">
                <Icon size={14} />
              </a>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
