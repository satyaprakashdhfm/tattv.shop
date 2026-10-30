"use client";

import { useActionState, useState } from "react";
import { Star } from "lucide-react";
import { saveReviewAction } from "../../actions";

export interface ReviewFormValues {
  id: string;
  rating: number;
  title: string;
  body: string;
  name: string;
  city: string;
  status: "pending" | "published" | "hidden";
}

/** Edit a review (stars, words, how it is signed, and whether it shows), or write a new one. */
export function ReviewForm({ review, returnTo }: { review?: ReviewFormValues; returnTo: string }) {
  const [state, action, pending] = useActionState(saveReviewAction, null);
  const [rating, setRating] = useState(review?.rating ?? 5);
  return (
    <form action={action} className="adm-card grid max-w-3xl gap-4 sm:grid-cols-2">
      {review && <input type="hidden" name="id" value={review.id} />}
      <input type="hidden" name="returnTo" value={returnTo} />
      <input type="hidden" name="rating" value={rating} />
      <div className="sm:col-span-2">
        <p className="adm-label">Stars</p>
        <div className="flex gap-1" role="radiogroup" aria-label="Stars">
          {[1, 2, 3, 4, 5].map((n) => (
            <button key={n} type="button" role="radio" aria-checked={rating === n} aria-label={`${n} star${n === 1 ? "" : "s"}`} onClick={() => setRating(n)} className="p-0.5">
              <Star size={26} strokeWidth={1.3} className={n <= rating ? "fill-[#b8862b] text-[#b8862b]" : "text-line"} />
            </button>
          ))}
        </div>
      </div>
      <div className="sm:col-span-2">
        <label htmlFor="r-title" className="adm-label">
          Title
        </label>
        <input id="r-title" name="title" defaultValue={review?.title} maxLength={80} placeholder="Still looks new" className="adm-input" />
      </div>
      <div className="sm:col-span-2">
        <label htmlFor="r-body" className="adm-label">
          Review
        </label>
        <textarea id="r-body" name="body" rows={4} defaultValue={review?.body} maxLength={1000} className="adm-input" />
      </div>
      <div>
        <label htmlFor="r-name" className="adm-label">
          Name shown *
        </label>
        <input id="r-name" name="name" defaultValue={review?.name} required maxLength={60} placeholder="Rahul S." className="adm-input" />
      </div>
      <div>
        <label htmlFor="r-city" className="adm-label">
          City
        </label>
        <input id="r-city" name="city" defaultValue={review?.city} maxLength={60} placeholder="Hyderabad" className="adm-input" />
      </div>
      <div>
        <label htmlFor="r-status" className="adm-label">
          Show on the home page
        </label>
        <select id="r-status" name="status" defaultValue={review?.status ?? "published"} className="adm-input">
          <option value="published">Yes, on the site</option>
          <option value="hidden">No, hidden</option>
          <option value="pending">Not yet (to review)</option>
        </select>
      </div>
      <div className="flex flex-wrap items-center gap-4 sm:col-span-2">
        <button className="btn btn-dark btn-sm" disabled={pending}>
          {pending ? "Saving…" : review ? "Save Review" : "Add Review"}
        </button>
        {state?.error && (
          <p role="alert" className="adm-error">
            {state.error}
          </p>
        )}
      </div>
    </form>
  );
}
