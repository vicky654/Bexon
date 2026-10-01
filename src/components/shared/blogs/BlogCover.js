import coverImage from "@/libs/coverImage";
import Image from "next/image";

// Blog cover image. Covers stored in the site (e.g. the migrated old-site
// covers, up to ~1 MB PNGs) go through next/image so visitors get resized
// WebP/AVIF; anything else (the SVG fallback, external URLs) is a plain img.
// The box size comes from CSS (aspect-ratio + object-fit on the img).
export default function BlogCover({ src, alt = "", sizes = "(max-width: 991px) 100vw, 800px", priority = false, width = 1200, height = 675 }) {
	const url = coverImage(src);
	if (url.startsWith("/") && !url.endsWith(".svg")) {
		return <Image src={url} alt={alt} width={width} height={height} sizes={sizes} priority={priority} />;
	}
	// eslint-disable-next-line @next/next/no-img-element
	return <img src={url} alt={alt} loading={priority ? undefined : "lazy"} />;
}
