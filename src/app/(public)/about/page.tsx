import type { Metadata } from "next";
import Link from "next/link";
import { RESTAURANT } from "@/lib/restaurant-info";

export const metadata: Metadata = {
  title: "About | Gungjeon Unlimited",
};

const HIGHLIGHTS = [
  {
    title: "Unlimited grill",
    text: "Pork, beef and grilled chicken fillet in many flavors, from BBQ and Teriyaki to Spicy Korean and Salt and Pepper.",
  },
  {
    title: "Side dishes and sauces",
    text: "Kimchi, japchae, fishcake, rice, fluffy egg and more, with Ssamjang, Teriyaki and Special Vinegar for dipping.",
  },
  {
    title: "Seafood and favorites",
    text: "Our Royal Feast adds salmon sashimi, roast beef, crabs, shrimp, mussels, squid and seafood paluto.",
  },
];

const GOOD_TO_KNOW = [
  "No left-over policy",
  "Left-overs are charged ₱1 per gram",
  "1 Unli set per table",
];

export default function AboutPage() {
  return (
    <main>
      <section className="bg-neutral-900 px-4 py-12 text-center text-white">
        <div className="mx-auto max-w-3xl space-y-3">
          <h1 className="text-4xl font-bold text-white sm:text-5xl">About Gungjeon Unlimited</h1>
          <p className="text-sm text-neutral-200 sm:text-base">
            Good food. More choices. Unlimited!
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-4xl space-y-8 px-4 py-10">
        <div className="space-y-3">
          <h2 className="text-2xl font-bold text-neutral-900">Who we are</h2>
          <p className="text-neutral-800">
            Gungjeon Unlimited is an eat-all-you-can Korean barbecue restaurant in Palasan,
            Valenzuela City. Pick your meats, grill them, dip them in your favorite sauce, and
            enjoy, as much as you like.
          </p>
        </div>

        <div className="space-y-3">
          <h2 className="text-2xl font-bold text-neutral-900">What you can enjoy</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            {HIGHLIGHTS.map((h) => (
              <div key={h.title} className="rounded-lg border border-neutral-300 p-4">
                <h3 className="text-lg font-semibold text-neutral-900">{h.title}</h3>
                <p className="mt-1 text-sm text-neutral-700">{h.text}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <h2 className="text-2xl font-bold text-neutral-900">Good to know</h2>
          <ul className="grid gap-2 sm:grid-cols-3">
            {GOOD_TO_KNOW.map((g) => (
              <li
                key={g}
                className="rounded-lg border border-neutral-300 bg-neutral-50 px-3 py-2 text-sm text-neutral-800"
              >
                {g}
              </li>
            ))}
          </ul>
        </div>

        <div className="space-y-3 rounded-lg border border-neutral-300 p-4">
          <h2 className="text-2xl font-bold text-neutral-900">Visit us</h2>
          <p className="text-neutral-800">
            {RESTAURANT.addressLine1}, {RESTAURANT.addressLine2}
            <br />
            Open daily, {RESTAURANT.hours}
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              href="/menu"
              className="rounded-full bg-red-700 px-6 py-3 text-center font-semibold text-white hover:bg-red-800"
            >
              See the Menu
            </Link>
            <Link
              href="/table-availability"
              className="rounded-full border border-neutral-400 px-6 py-3 text-center font-semibold text-neutral-900 hover:bg-neutral-100"
            >
              Check Table Availability
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}