// Instagram-style videos on the home page ("Follow Us on Instagram").
//
// They live in the database (table `reels`) and are managed in Admin → Videos: upload a clip, give it a
// caption and link it to the product it shows, so tapping the video opens that product. Videos are
// self-hosted (an Instagram embed is Instagram's own player, which can't autoplay inline and sends
// visitors off the site).
//
// SEED_REELS are the starting rows, copied in once: TATTV's own @tattv.shop reels, saved in
// public/reels/<shortcode>.mp4 with a poster frame <shortcode>.jpg.

/** A video as the store shows it. */
export interface Reel {
  id: string;
  video: string;
  poster: string;
  caption: string;
  /** The product it links to; null when it isn't linked (or that product is hidden). */
  product: { slug: string; name: string } | null;
}

export const SEED_REELS: { id: string; caption: string; product?: string }[] = [
  { id: "C76dalUBMpN", caption: "Mesh bracelets, in three finishes", product: "mesh-inlay-bangle" },
  { id: "C79Hzt4BqAW", caption: "The Medusa ring" },
  { id: "C111dsaIQ-s", caption: "The cable collection", product: "twin-cable-bangle" },
  { id: "C8CLnp1BcUJ", caption: "Rings, studs and more", product: "curb-link-ring" },
  { id: "C2AArB7Pcue", caption: "Steel cuffs for every day" },
  { id: "C2kMLPpvO44", caption: "Matte gold cuffs" },
  { id: "C2cbHvVPibN", caption: "The gold buckle bracelet" },
  { id: "C1zEM7Cv4H3", caption: "Chrome and gloss black bracelets" },
  { id: "C2Ch0vFvtcB", caption: "The super fibre bracelet" },
  { id: "C1b6khSvBIX", caption: "Classic chains", product: "star-dog-tag-pendant" },
  { id: "C1jnCp5vpnM", caption: "The steel wallet" },
];

export const reelVideo = (id: string) => `/reels/${id}.mp4`;
export const reelPoster = (id: string) => `/reels/${id}.jpg`;
