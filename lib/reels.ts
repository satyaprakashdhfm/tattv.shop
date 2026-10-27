// Instagram reels on the home page (@tattv.shop).
//
// These are self-hosted copies (public/reels/<id>.mp4 + a poster <id>.jpg), not Instagram embeds:
// an embed is Instagram's own player, which can't autoplay inline and sends visitors off the site.
// Every reel here was posted by @tattv.shop itself.
//
// To add one: save the mp4 and a poster frame to public/reels/<shortcode>.mp4 / .jpg (the shortcode
// is the part after /reel/ or /p/ in the Instagram URL) and add a row below. Keep clips short: each
// one is downloaded by every visitor who scrolls past it. An empty list hides the section.

export interface Reel {
  /** Instagram shortcode, also the file name in public/reels/. */
  id: string;
  caption: string;
}

export const REELS: Reel[] = [
  { id: "C76dalUBMpN", caption: "Mesh bracelets, in three finishes" },
  { id: "C79Hzt4BqAW", caption: "The Medusa ring" },
  { id: "C111dsaIQ-s", caption: "The cable collection" },
  { id: "C8CLnp1BcUJ", caption: "Rings, studs and more" },
  { id: "C2AArB7Pcue", caption: "Steel cuffs for every day" },
  { id: "C2kMLPpvO44", caption: "Matte gold cuffs" },
  { id: "C2cbHvVPibN", caption: "The gold buckle bracelet" },
  { id: "C1zEM7Cv4H3", caption: "Chrome and gloss black bracelets" },
  { id: "C2Ch0vFvtcB", caption: "The super fibre bracelet" },
  { id: "C1b6khSvBIX", caption: "Classic chains" },
  { id: "C1jnCp5vpnM", caption: "The steel wallet" },
];

export const reelVideo = (id: string) => `/reels/${id}.mp4`;
export const reelPoster = (id: string) => `/reels/${id}.jpg`;
export const reelUrl = (id: string) => `https://www.instagram.com/reel/${id}/`;
