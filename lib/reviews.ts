// Reviews live in the database and are managed in Admin → Reviews (lib/server/reviews.ts): customers
// rate delivered orders, and the admin can also write, edit, hide or delete any review.
//
// PLACEHOLDER: SAMPLE_REVIEWS are copied in once as published "sample" reviews so the section can be
// seen before real ones exist. They are not from real customers: hide or delete them in the admin
// before launch, since showing invented reviews to shoppers misleads them.

/** Where "Read more reviews" goes (e.g. the Google reviews page once there is one). */
export const REVIEWS_URL = "https://www.instagram.com/tattv.shop/";

export interface Review {
  title: string;
  quote: string;
  name: string;
  city: string;
  /** Stars, 1 to 5 (the samples are 5). */
  rating?: number;
  /** From a real, delivered order: shows a "Verified" badge. */
  verified: boolean;
}

export const SAMPLE_REVIEWS: Review[] = [
  { title: "Still looks new", quote: "Wear it every day to the office and it still looks new. Feels solid on the wrist without being heavy.", name: "Rahul S.", city: "Hyderabad", verified: false },
  { title: "An easy gift", quote: "The finish is clean and the chain doesn't tangle. Arrived in a really nice pouch, which made it an easy gift.", name: "Karthik R.", city: "Bengaluru", verified: false },
  { title: "Sharper than the photos", quote: "Exactly the size I ordered and the detailing is sharper than in the photos. Already planning my next piece.", name: "Aditya M.", city: "Mumbai", verified: false },
  { title: "Slim and well made", quote: "Slim, well stitched and holds everything I need. The leather has started to soften nicely after a month.", name: "Vikram P.", city: "Chennai", verified: false },
  { title: "Work to weekend", quote: "Subtle enough for work and sharp for weekends. Delivery was quick and the packaging felt premium.", name: "Arjun T.", city: "Pune", verified: false },
  { title: "No-fuss exchange", quote: "Exchanged for a different size with no fuss. The second one fits perfectly and I get asked about it often.", name: "Nikhil K.", city: "Delhi", verified: false },
];
