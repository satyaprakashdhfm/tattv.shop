// PLACEHOLDER: sample reviews so the home page section can be reviewed before real ones exist.
// They are not from real customers. Replace them with genuine reviews (or hide the section by
// setting SHOW_REVIEWS to false) before launch, since showing invented reviews to shoppers misleads them.
// Set `verified: true` only on reviews from real, confirmed orders: it shows a "Verified" badge.

export const SHOW_REVIEWS = true;

/** Where "Read more reviews" goes (e.g. the Google reviews page once there is one). */
export const REVIEWS_URL = "https://www.instagram.com/tattv.shop/";

export interface Review {
  title: string;
  quote: string;
  name: string;
  city: string;
  verified: boolean;
}

export const REVIEWS: Review[] = [
  { title: "Still looks new", quote: "Wear it every day to the office and it still looks new. Feels solid on the wrist without being heavy.", name: "Rahul S.", city: "Hyderabad", verified: false },
  { title: "An easy gift", quote: "The finish is clean and the chain doesn't tangle. Arrived in a really nice pouch, which made it an easy gift.", name: "Karthik R.", city: "Bengaluru", verified: false },
  { title: "Sharper than the photos", quote: "Exactly the size I ordered and the detailing is sharper than in the photos. Already planning my next piece.", name: "Aditya M.", city: "Mumbai", verified: false },
  { title: "Slim and well made", quote: "Slim, well stitched and holds everything I need. The leather has started to soften nicely after a month.", name: "Vikram P.", city: "Chennai", verified: false },
  { title: "Work to weekend", quote: "Subtle enough for work and sharp for weekends. Delivery was quick and the packaging felt premium.", name: "Arjun T.", city: "Pune", verified: false },
  { title: "No-fuss exchange", quote: "Exchanged for a different size with no fuss. The second one fits perfectly and I get asked about it often.", name: "Nikhil K.", city: "Delhi", verified: false },
];
