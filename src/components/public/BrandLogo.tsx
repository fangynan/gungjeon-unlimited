// src/components/public/BrandLogo.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";

type Props = {
  /** Sets the size, e.g. "size-10". The logo is square and uses object-contain. */
  className?: string;
  sizes?: string;
  priority?: boolean;
};

/**
 * Same logo as the hero: public/images/logo.png (transparent PNG, light or gold).
 * Until the file exists, a dashed gold "Logo" circle is shown instead.
 */
export default function BrandLogo({ className = "size-10", sizes = "48px", priority }: Props) {
  const [failed, setFailed] = useState(false);
  const ref = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const img = ref.current;
    if (img && img.complete && img.naturalWidth === 0) setFailed(true);
  }, []);

  return (
    <span className={`relative block shrink-0 ${className}`}>
      {failed ? (
        <span
          aria-hidden
          className="flex size-full animate-pulse items-center justify-center rounded-full border border-dashed border-gold/60 bg-neutral-800 font-mono text-[9px] uppercase tracking-widest text-neutral-300 motion-reduce:animate-none"
        >
          Logo
        </span>
      ) : (
        <Image
          ref={ref}
          src="/images/logo.png"
          alt="" // decorative: the restaurant name is always next to it
          fill
          sizes={sizes}
          priority={priority}
          className="object-contain"
          onError={() => setFailed(true)}
        />
      )}
    </span>
  );
}
