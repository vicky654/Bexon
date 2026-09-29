// Usage: node scripts/import-images.mjs <old-relative-src> <site-relative-dest> [...]
// e.g.  node scripts/import-images.mjs DPCM.1.png products/consent-management.webp
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const OLD_IMAGES = "C:/Users/Vicky/Desktop/dpdp-WebSite/assets/images";
const DEST_ROOT = path.resolve("public/images/site");
const args = process.argv.slice(2);
if (!args.length || args.length % 2) {
	console.error("Pass pairs: <source> <dest.webp>");
	process.exit(1);
}

for (let i = 0; i < args.length; i += 2) {
	const source = path.join(OLD_IMAGES, args[i]);
	const dest = path.join(DEST_ROOT, args[i + 1]);
	if (!dest.endsWith(".webp")) throw new Error(`Destination must be .webp: ${args[i + 1]}`);
	fs.mkdirSync(path.dirname(dest), { recursive: true });
	await sharp(source).resize({ width: 1600, withoutEnlargement: true }).webp({ quality: 80 }).toFile(dest);
	const kb = Math.round(fs.statSync(dest).size / 1024);
	console.log(`${args[i]} -> images/site/${args[i + 1]} (${kb} KB)`);
}
