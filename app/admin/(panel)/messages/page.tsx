import Link from "next/link";
import { listMessages } from "@/lib/server/orders";
import { markMessage } from "../../actions";
import { PageHead, when } from "../ui";

export const metadata = { title: "Messages" };

export default async function MessagesPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const show = (await searchParams).show || "inbox";
  const all = await listMessages();
  const messages = all.filter((m) => (show === "archived" ? m.status === "archived" : m.status !== "archived"));

  return (
    <>
      <PageHead title="Messages" sub="From the contact form and return / exchange requests." />
      <nav aria-label="Messages" className="adm-chips">
        <Link href="/admin/messages" aria-current={show === "inbox" ? "page" : undefined} className="adm-chip">
          Inbox <span className="adm-chip-n">{all.filter((m) => m.status !== "archived").length}</span>
        </Link>
        <Link href="/admin/messages?show=archived" aria-current={show === "archived" ? "page" : undefined} className="adm-chip">
          Archived <span className="adm-chip-n">{all.filter((m) => m.status === "archived").length}</span>
        </Link>
      </nav>
      {messages.length === 0 && <p className="text-sm text-muted">No messages here.</p>}
      <ul className="space-y-4">
        {messages.map((m) => {
          const subject = m.subject || "Your message to TATTV";
          const wa = m.phone.replace(/\D/g, "").replace(/^(\d{10})$/, "91$1");
          return (
            <li key={m.id} className={`adm-card ${m.status === "new" ? "border-l-4 border-l-ink" : ""}`}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="flex flex-wrap items-center gap-2">
                    <b className="font-medium">{m.name || m.email}</b>
                    {m.kind === "return" && <span className="pill pill-packed">Return / exchange</span>}
                    {m.status === "new" && <span className="pill pill-confirmed">New</span>}
                  </p>
                  {m.subject && <p className="mt-1 text-sm">{m.subject}</p>}
                  <p className="mt-1 text-xs text-muted">
                    <a href={`mailto:${m.email}?subject=${encodeURIComponent("Re: " + subject)}`} className="underline-offset-2 hover:underline">
                      {m.email}
                    </a>
                    {m.phone && (
                      <>
                        {" · "}
                        <a href={`tel:${m.phone}`} className="underline-offset-2 hover:underline">
                          {m.phone}
                        </a>
                      </>
                    )}
                    {" · "}
                    {when(m.createdAt)}
                  </p>
                </div>
                <form action={markMessage} className="flex gap-2">
                  <input type="hidden" name="id" value={m.id} />
                  {m.status === "new" && (
                    <button name="status" value="read" className="btn btn-outline btn-sm">
                      Mark Read
                    </button>
                  )}
                  {m.status !== "archived" ? (
                    <button name="status" value="archived" className="btn btn-outline btn-sm">
                      Archive
                    </button>
                  ) : (
                    <button name="status" value="read" className="btn btn-outline btn-sm">
                      Move to Inbox
                    </button>
                  )}
                </form>
              </div>
              <p className="mt-4 whitespace-pre-wrap bg-paper p-4 text-sm leading-relaxed">{m.body}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <a className="btn btn-dark btn-sm" href={`mailto:${m.email}?subject=${encodeURIComponent("Re: " + subject)}`}>
                  Reply by Email
                </a>
                {m.phone && (
                  <a className="btn btn-outline btn-sm" target="_blank" rel="noopener noreferrer" href={`https://wa.me/${wa}`}>
                    Reply on WhatsApp
                  </a>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </>
  );
}
