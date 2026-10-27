"use client";

import { useState } from "react";
import { ChevronDown, HelpCircle } from "lucide-react";

export interface FaqGroup {
  id: string;
  label: string;
  items: { q: string; a: string }[];
}

/** Questions in tabs; one answer open at a time. */
export function Faq({ groups }: { groups: FaqGroup[] }) {
  const [tab, setTab] = useState(groups[0].id);
  const [open, setOpen] = useState(0);
  const group = groups.find((g) => g.id === tab) ?? groups[0];

  return (
    <div className="mx-auto max-w-3xl">
      <div role="tablist" aria-label="Question topics" className="mx-auto flex w-fit flex-wrap justify-center gap-1 rounded-full bg-white p-1 shadow-soft">
        {groups.map((g) => (
          <button
            key={g.id}
            role="tab"
            type="button"
            aria-selected={g.id === tab}
            onClick={() => {
              setTab(g.id);
              setOpen(0);
            }}
            className={`rounded-full px-4 py-2 text-xs transition-colors ${g.id === tab ? "bg-ink text-white" : "text-ink/60 hover:text-ink"}`}
          >
            {g.label}
          </button>
        ))}
      </div>

      <ul className="mt-8 space-y-3">
        {group.items.map((item, i) => {
          const isOpen = open === i;
          return (
            <li key={item.q} className={`rounded-3xl border bg-white transition-colors ${isOpen ? "border-ink/20 shadow-soft" : "border-line"}`}>
              <button type="button" aria-expanded={isOpen} onClick={() => setOpen(isOpen ? -1 : i)} className="flex w-full items-center gap-4 px-5 py-4 text-left md:px-6">
                <HelpCircle size={17} strokeWidth={1.5} className={`shrink-0 ${isOpen ? "text-ink" : "text-ink/40"}`} />
                <span className="flex-1 text-sm font-medium">{item.q}</span>
                <ChevronDown size={16} className={`shrink-0 text-ink/50 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`} />
              </button>
              <div className={`grid transition-[grid-template-rows] duration-300 ${isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
                <p className="overflow-hidden px-5 text-sm leading-relaxed text-ink/70 md:pl-[3.75rem] md:pr-12">
                  <span className="block pb-5">{item.a}</span>
                </p>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
