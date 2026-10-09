import type { Metadata } from "next";
import { RESTAURANT } from "@/lib/restaurant-info";

export const metadata: Metadata = {
  title: "Contact | Gungjeon Unlimited",
};

const MAPS_URL =
  "https://www.google.com/maps/search/?api=1&query=" +
  encodeURIComponent(`${RESTAURANT.addressLine1}, Valenzuela City`);

export default function ContactPage() {
  return (
    <main>
      <section className="bg-neutral-900 px-4 py-12 text-center text-white">
        <div className="mx-auto max-w-3xl space-y-3">
          <h1 className="text-4xl font-bold text-white sm:text-5xl">Get In Touch</h1>
          <p className="text-sm text-neutral-200 sm:text-base">
            Questions about our menu or your visit? Call or email us, or drop by.
          </p>
        </div>
      </section>

      <section className="mx-auto grid max-w-4xl gap-4 px-4 py-10 sm:grid-cols-2">
        <div className="space-y-3 rounded-lg border border-neutral-300 p-4">
          <h2 className="text-xl font-bold text-neutral-900">Address</h2>
          <p className="text-neutral-800">
            {RESTAURANT.addressLine1}
            <br />
            {RESTAURANT.addressLine2}
          </p>
          <a
            href={MAPS_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block rounded-full border border-neutral-400 px-5 py-2 text-sm font-semibold text-neutral-900 hover:bg-neutral-100"
          >
            Get directions
          </a>
        </div>

        <div className="space-y-3 rounded-lg border border-neutral-300 p-4">
          <h2 className="text-xl font-bold text-neutral-900">Opening hours</h2>
          <p className="text-neutral-800">Open daily</p>
          <p className="text-2xl font-bold text-neutral-900">{RESTAURANT.hours}</p>
        </div>

        <div className="space-y-3 rounded-lg border border-neutral-300 p-4">
          <h2 className="text-xl font-bold text-neutral-900">Phone</h2>
          <p className="text-neutral-800">{RESTAURANT.phone}</p>
          <a
            href={`tel:${RESTAURANT.phoneLink}`}
            className="inline-block rounded-full bg-red-700 px-5 py-2 text-sm font-semibold text-white hover:bg-red-800"
          >
            Call us
          </a>
        </div>

        <div className="space-y-3 rounded-lg border border-neutral-300 p-4">
          <h2 className="text-xl font-bold text-neutral-900">Email</h2>
          <p className="break-all text-neutral-800">{RESTAURANT.email}</p>
          <a
            href={`mailto:${RESTAURANT.email}?subject=${encodeURIComponent("Hello Gungjeon Unlimited")}`}
            className="inline-block rounded-full bg-red-700 px-5 py-2 text-sm font-semibold text-white hover:bg-red-800"
          >
            Send an email
          </a>
        </div>
      </section>
    </main>
  );
}