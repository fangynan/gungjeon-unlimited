# Part 1: Hero & Brand Story

## 1. Install
    npm i motion

## 2. Add tokens: append to `src/app/globals.css`
    @theme inline {
      --font-serif-display: var(--font-noto-serif-kr), "Nanum Myeongjo", Georgia, serif;
      --color-ink: #0b0908;     /* near-black, warm */
      --color-paper: #efe7da;   /* warm off-white text */
      --color-gold: #c9a45c;    /* muted luxury gold (replaces the bright #ECC94B on this page) */
      --color-ember: #9b1c1c;   /* deep red: selection / future accents */
      --ease-out-quart: cubic-bezier(0.25, 1, 0.5, 1);
    }

## 3. Move the home route
`(public)/page.tsx` and `(landing)/page.tsx` would both resolve to `/`.
1. Copy the tiers / house-rules sections out of `src/app/(public)/page.tsx` somewhere safe (Part 2 material).
2. Delete `src/app/(public)/page.tsx`.
3. Drop this `src/` tree into the repo.
Other public pages (/menu, /about, /contact, /table-availability) keep `(public)/layout.tsx` untouched.

## 4. Swap placeholders
Search the repo for `ASSET PLACEHOLDER`: two spots (Hero.tsx, BrandStory.tsx). Each has the exact `<Image/>` snippet.
