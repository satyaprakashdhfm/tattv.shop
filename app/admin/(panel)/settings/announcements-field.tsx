"use client";

import { useState } from "react";
import { ArrowDown, ArrowUp, Plus, X } from "lucide-react";

const MAX = 10;

/** The ribbon's messages as an editable list: change, reorder, remove or add; each is posted as `announcements`. */
export function AnnouncementsField({ initial }: { initial: string[] }) {
  // Stable keys so typing in one row never jumps focus when another is removed.
  const [rows, setRows] = useState(() => initial.map((text, i) => ({ id: i, text })));
  const [nextId, setNextId] = useState(initial.length);

  const update = (id: number, text: string) => setRows((r) => r.map((row) => (row.id === id ? { ...row, text } : row)));
  const remove = (id: number) => setRows((r) => r.filter((row) => row.id !== id));
  const move = (i: number, dir: number) =>
    setRows((r) => {
      const next = [...r];
      [next[i], next[i + dir]] = [next[i + dir], next[i]];
      return next;
    });
  const add = () => {
    setRows((r) => [...r, { id: nextId, text: "" }]);
    setNextId((n) => n + 1);
  };

  return (
    <div className="space-y-2">
      {rows.length === 0 && <p className="rounded-xl bg-[#f6f6f4] px-3 py-2.5 text-xs text-muted">No messages: the ribbon shows only the social icons (or hides if those are empty too).</p>}
      {rows.map((row, i) => (
        <div key={row.id} className="flex items-center gap-1.5">
          <span className="w-4 shrink-0 text-center text-[11px] text-muted">{i + 1}</span>
          <label htmlFor={`s-ann-${row.id}`} className="sr-only">
            Message {i + 1}
          </label>
          <input id={`s-ann-${row.id}`} name="announcements" value={row.text} onChange={(e) => update(row.id, e.target.value)} maxLength={200} placeholder="e.g. Festive edit: 10% off with WELCOME10" className="adm-input min-w-0 flex-1" />
          <button type="button" aria-label={`Move message ${i + 1} up`} disabled={i === 0} onClick={() => move(i, -1)} className="rounded-lg p-1.5 text-ink/50 hover:bg-[#f1f1ef] hover:text-ink disabled:opacity-25">
            <ArrowUp size={14} />
          </button>
          <button type="button" aria-label={`Move message ${i + 1} down`} disabled={i === rows.length - 1} onClick={() => move(i, 1)} className="rounded-lg p-1.5 text-ink/50 hover:bg-[#f1f1ef] hover:text-ink disabled:opacity-25">
            <ArrowDown size={14} />
          </button>
          <button type="button" aria-label={`Remove message ${i + 1}`} onClick={() => remove(row.id)} className="rounded-lg p-1.5 text-ink/50 hover:bg-red-50 hover:text-red-700">
            <X size={14} />
          </button>
        </div>
      ))}
      {rows.length < MAX && (
        <button type="button" onClick={add} className="inline-flex items-center gap-1.5 rounded-full border border-line px-3.5 py-1.5 text-xs hover:border-ink/30">
          <Plus size={13} /> Add message
        </button>
      )}
    </div>
  );
}
