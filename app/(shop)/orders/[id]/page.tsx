import type { Metadata } from "next";
import { Suspense } from "react";
import { OrderView } from "./order-view";

export const metadata: Metadata = { title: "Your Order", robots: { index: false } };

export default async function OrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <Suspense fallback={<div className="min-h-[60vh]" />}>
      <OrderView id={id} />
    </Suspense>
  );
}
