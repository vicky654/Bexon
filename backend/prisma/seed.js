require("dotenv").config();
const fs = require("fs");
const path = require("path");
const bcrypt = require("bcryptjs");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
	const adminEmail = process.env.ADMIN_EMAIL;
	const adminPassword = process.env.ADMIN_PASSWORD;

	if (!adminEmail || !adminPassword) {
		throw new Error(
			"ADMIN_EMAIL and ADMIN_PASSWORD must be set in backend/.env before seeding."
		);
	}

	const existingAdmin = await prisma.admin.findFirst();
	if (!existingAdmin) {
		const passwordHash = await bcrypt.hash(adminPassword, 10);
		await prisma.admin.create({ data: { email: adminEmail, passwordHash } });
		console.log(`Created admin account for ${adminEmail}`);
	} else {
		console.log("Admin account already exists, skipping.");
	}

	const existingBlogCount = await prisma.blog.count();
	if (existingBlogCount === 0) {
		const blogsJsonPath = path.join(
			__dirname,
			"../../public/fakedata/blogs.json"
		);
		const blogs = JSON.parse(fs.readFileSync(blogsJsonPath, "utf8"));

		for (const blog of blogs) {
			await prisma.blog.create({
				data: {
					slug: blog.slug,
					title: blog.title,
					excerpt: blog.desc || "",
					content: [blog.desc1, blog.desc2].filter(Boolean).join("\n\n"),
					img: blog.img || "",
					category: blog.category || "",
					tags: JSON.stringify(blog.tags || []),
					author: blog.author || "",
					authorRole: blog.author_role || "",
					status: blog.status || "",
					published: true,
				},
			});
		}
		console.log(`Imported ${blogs.length} blog posts from blogs.json`);
	} else {
		console.log("Blogs already exist, skipping import.");
	}
}

main()
	.catch(e => {
		console.error(e);
		process.exit(1);
	})
	.finally(async () => {
		await prisma.$disconnect();
	});
