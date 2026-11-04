"use client";
import Image, { type ImageProps } from "next/image";
import { useState } from "react";

/** next/image com fade-in suave ao carregar. */
export function SmoothImage({ className = "", alt, ...props }: ImageProps) {
  const [loaded, setLoaded] = useState(false);
  return (
    <Image
      {...props}
      alt={alt}
      className={`img-smooth ${loaded ? "is-loaded" : ""} ${className}`}
      onLoad={() => setLoaded(true)}
    />
  );
}
