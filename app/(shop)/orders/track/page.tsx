import type { Metadata } from "next";
import { Suspense } from "react";
import { TrackForm } from "./track-form";

export const metadata: Metadata = { title: "Track Your Order" };

export default function TrackPage() {
  return (
    <Suspense fallback={<div className="min-h-[60vh]" />}>
      <TrackForm />
    </Suspense>
  );
}
