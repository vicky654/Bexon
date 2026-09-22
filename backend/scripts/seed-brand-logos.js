const fs = require("fs");
const path = require("path");
const prisma = require("../src/lib/prisma");

// These logo files live in the public frontend's own /public folder
// (not the backend's /uploads), so imageUrl must be an absolute URL
// pointing at that app's origin -- a relative path only resolves
// correctly when viewed on the frontend itself, not from the admin
// panel or any other origin.
const SITE_URL = process.env.SITE_URL || "http://localhost:4000";

async function main() {
	const existingCount = await prisma.brandLogo.count();
	if (existingCount > 0) {
		console.log(`BrandLogo table already has ${existingCount} rows, skipping seed.`);
		return;
	}

	const brandsPath = path.join(__dirname, "../../public/fakedata/brands.json");
	const brands = JSON.parse(fs.readFileSync(brandsPath, "utf8"));

	for (let i = 0; i < brands.length; i += 1) {
		const brand = brands[i];
		await prisma.brandLogo.create({
			data: {
				imageUrl: `${SITE_URL}${brand.img}`,
				alt: brand.alt || "",
				sortOrder: i,
			},
		});
	}

	console.log(`Seeded ${brands.length} brand logos.`);
}

main()
	.catch(err => {
		console.error(err);
		process.exitCode = 1;
	})
	.finally(() => prisma.$disconnect());
