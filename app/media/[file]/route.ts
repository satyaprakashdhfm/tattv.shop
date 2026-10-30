import { query } from "@/lib/server/db";

// Photos and videos uploaded in the admin (/media/<id>.webp, .mp4, .webm). Each upload gets a new id,
// so they cache for a year. Videos are sent in parts when the browser asks for a range (Safari needs
// this to play them), reading only that part from the database.
export async function GET(req: Request, { params }: { params: Promise<{ file: string }> }) {
  const { file } = await params;
  const id = String(file).replace(/\.(webp|mp4|webm)$/, "");
  const head = await query<{ mime: string; size: number }>("SELECT mime, octet_length(data) AS size FROM media WHERE id = $1", [id]);
  if (!head.rowCount) return new Response("Not found", { status: 404 });
  const { mime, size } = head.rows[0];
  const headers = { "Content-Type": mime, "Cache-Control": "public, max-age=31536000, immutable", "Accept-Ranges": "bytes" };

  const range = /^bytes=(\d*)-(\d*)$/.exec(req.headers.get("range") || "");
  let start = 0;
  let end = size - 1;
  if (range && (range[1] || range[2])) {
    start = range[1] ? Number(range[1]) : Math.max(0, size - Number(range[2]));
    end = range[1] && range[2] ? Math.min(Number(range[2]), size - 1) : size - 1;
    if (start >= size || start > end) return new Response(null, { status: 416, headers: { "Content-Range": `bytes */${size}` } });
  }
  const part = await query<{ data: Buffer }>("SELECT substring(data FROM $2 FOR $3) AS data FROM media WHERE id = $1", [id, start + 1, end - start + 1]);
  const body = new Uint8Array(part.rows[0].data);
  if (range && (range[1] || range[2])) {
    return new Response(body, { status: 206, headers: { ...headers, "Content-Range": `bytes ${start}-${end}/${size}`, "Content-Length": String(body.length) } });
  }
  return new Response(body, { headers: { ...headers, "Content-Length": String(size) } });
}
