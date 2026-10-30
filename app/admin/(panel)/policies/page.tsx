import Link from "next/link";
import { listPolicies } from "@/lib/server/policies";
import { PageHead } from "../ui";
import { PolicyForm } from "./policy-form";

export const metadata = { title: "Policies" };

export default async function PoliciesPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const policies = await listPolicies();
  const current = policies.find((p) => p.slug === sp.p) ?? policies[0];
  return (
    <>
      <PageHead title="Policies" sub="The policy pages linked from the footer and checkout. Edit the text here; it is live as soon as you save." />
      <nav aria-label="Policy pages" className="adm-chips flex-wrap !rounded-[1.5rem]">
        {policies.map((p) => (
          <Link key={p.slug} href={`/admin/policies?p=${p.slug}`} scroll={false} aria-current={p.slug === current.slug ? "page" : undefined} className="adm-chip">
            {p.title}
            {!p.edited && <span className="adm-chip-n">Draft</span>}
          </Link>
        ))}
      </nav>
      <PolicyForm key={`${current.slug}|${current.updatedAt}`} slug={current.slug} title={current.title} body={current.body} edited={current.edited} />
    </>
  );
}
