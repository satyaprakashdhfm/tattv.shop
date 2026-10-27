import { getMedia } from "@/lib/server/catalog";

// Photos uploaded in the admin (/media/<id>.webp). Each upload gets a new id, so they cache for a year.
export async function GET(_req: Request, { params }: { params: Promise<{ file: string }> }) {
  const { file } = await params;
  const media = await getMedia(String(file).replace(/\.webp$/, ""));
  if (!media) return new Response("Not found", { status: 404 });
  return new Response(new Uint8Array(media.data), {
    headers: { "Content-Type": media.mime, "Cache-Control": "public, max-age=31536000, immutable" },
  });
}
