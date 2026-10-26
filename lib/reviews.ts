// PLACEHOLDER: sample reviews so the home page section can be reviewed before real ones exist.
// They are not from real customers. Replace them with genuine reviews (or hide the section by
// setting SHOW_REVIEWS to false) before launch, since showing invented reviews to shoppers misleads them.

export const SHOW_REVIEWS = true;

export interface Review {
  name: string;
  city: string;
  /** Product slug the review is about. */
  product: string;
  quote: string;
}

export const REVIEWS: Review[] = [
  {
    name: "Rahul S.",
    city: "Hyderabad",
    product: "mesh-inlay-bangle",
    quote: "Wear it every day to the office and it still looks new. Feels solid on the wrist without being heavy.",
  },
  {
    name: "Karthik R.",
    city: "Bengaluru",
    product: "star-dog-tag-pendant",
    quote: "The finish is clean and the chain doesn't tangle. Arrived in a really nice pouch, which made it an easy gift.",
  },
  {
    name: "Aditya M.",
    city: "Mumbai",
    product: "curb-link-ring",
    quote: "Exactly the size I ordered and the detailing is sharper than in the photos. Already planning my next piece.",
  },
  {
    name: "Vikram P.",
    city: "Chennai",
    product: "leather-card-wallet",
    quote: "Slim, well stitched and holds everything I need. The leather has started to soften nicely after a month.",
  },
  {
    name: "Arjun T.",
    city: "Pune",
    product: "onyx-stud-earrings",
    quote: "Subtle enough for work and sharp for weekends. Delivery was quick and the packaging felt premium.",
  },
  {
    name: "Nikhil K.",
    city: "Delhi",
    product: "twin-cable-bangle",
    quote: "Exchanged for a different size with no fuss. The second one fits perfectly and I get asked about it often.",
  },
];
