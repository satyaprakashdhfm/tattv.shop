"use client";

import type { ReactNode } from "react";
import { useRouter } from "next/navigation";

/** A table row that opens `href` when clicked anywhere, except on its own buttons, links and inputs. */
export function ClickRow({ href, children }: { href: string; children: ReactNode }) {
  const router = useRouter();
  return (
    <tr
      className="cursor-pointer"
      onClick={(e) => {
        if ((e.target as HTMLElement).closest("a, button, input, select, label, form")) return;
        router.push(href, { scroll: false });
      }}
    >
      {children}
    </tr>
  );
}
