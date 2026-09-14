const EXPORT_FIELDS = [
	"title",
	"slug",
	"excerpt",
	"content",
	"img",
	"category",
	"tags",
	"author",
	"authorRole",
	"status",
	"published",
];

export function downloadJsonFile(filename, data) {
	const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
	const url = URL.createObjectURL(blob);
	const link = document.createElement("a");
	link.href = url;
	link.download = filename;
	document.body.appendChild(link);
	link.click();
	document.body.removeChild(link);
	URL.revokeObjectURL(url);
}

export function exportBlogs(blogs) {
	const cleaned = blogs.map(blog => {
		const entry = {};
		EXPORT_FIELDS.forEach(field => {
			entry[field] = blog[field] ?? (field === "tags" ? [] : "");
		});
		return entry;
	});
	downloadJsonFile(`blogs-export-${new Date().toISOString().slice(0, 10)}.json`, cleaned);
}

export function downloadSampleImportFile() {
	const sample = [
		{
			title: "Sample Post Title",
			slug: "sample-post-title",
			excerpt: "A short one or two sentence summary shown in blog listings.",
			content:
				"<p>Write your post content here. This field accepts HTML — the same HTML the rich text editor produces (paragraphs, headings, lists, images, tables, etc.).</p>",
			img: "https://example.com/image.jpg",
			category: "Business",
			tags: ["Business", "Strategy"],
			author: "Jane Doe",
			authorRole: "Editor",
			status: "Tutorial",
			published: true,
		},
		{
			title: "Second Sample Post",
			slug: "second-sample-post",
			excerpt: "Another example row so you can see the array format.",
			content: "<p>More example content.</p>",
			img: "",
			category: "Marketing",
			tags: ["Marketing"],
			author: "",
			authorRole: "",
			status: "",
			published: false,
		},
	];
	downloadJsonFile("blogs-import-sample.json", sample);
}

export function parseImportFile(file) {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onload = () => {
			try {
				const parsed = JSON.parse(reader.result);
				if (!Array.isArray(parsed)) {
					reject(new Error("Import file must contain a JSON array of posts."));
					return;
				}
				resolve(parsed);
			} catch {
				reject(new Error("That file isn't valid JSON."));
			}
		};
		reader.onerror = () => reject(new Error("Could not read the selected file."));
		reader.readAsText(file);
	});
}
