"use client";

import { useRef, useState } from "react";
import { useEditor, EditorContent, NodeViewWrapper, ReactNodeViewRenderer } from "@tiptap/react";
import { Extension } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import TiptapLink from "@tiptap/extension-link";
import TiptapImage from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import { Table, TableRow, TableHeader, TableCell } from "@tiptap/extension-table";
import { TextStyle } from "@tiptap/extension-text-style";
import Color from "@tiptap/extension-color";
import Highlight from "@tiptap/extension-highlight";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";
const GAP_PRESETS = { none: "0px", small: "8px", medium: "16px", large: "32px" };

async function uploadImageFile(file) {
	const formData = new FormData();
	formData.append("image", file);
	const res = await fetch(`${BACKEND_URL}/api/admin/upload`, {
		method: "POST",
		credentials: "include",
		body: formData,
	});
	const data = await res.json().catch(() => ({}));
	if (!res.ok) {
		throw new Error(data.message || "Image upload failed.");
	}
	return `${BACKEND_URL}${data.url}`;
}

function ResizableImageView({ node, updateAttributes, selected }) {
	const { src, alt, width, align, gap } = node.attrs;
	const wrapperRef = useRef(null);
	const [isResizing, setIsResizing] = useState(false);

	const handleResizeStart = e => {
		e.preventDefault();
		e.stopPropagation();
		const container = wrapperRef.current?.parentElement;
		const containerWidth = container?.offsetWidth || 1;
		const startX = e.clientX;
		const startWidthPx = wrapperRef.current?.offsetWidth || 0;
		setIsResizing(true);

		const onMouseMove = moveEvent => {
			const deltaX = moveEvent.clientX - startX;
			const newWidthPx = Math.max(60, startWidthPx + deltaX);
			const newPercent = Math.min(100, Math.max(10, Math.round((newWidthPx / containerWidth) * 100)));
			updateAttributes({ width: `${newPercent}%` });
		};

		const onMouseUp = () => {
			setIsResizing(false);
			document.removeEventListener("mousemove", onMouseMove);
			document.removeEventListener("mouseup", onMouseUp);
		};

		document.addEventListener("mousemove", onMouseMove);
		document.addEventListener("mouseup", onMouseUp);
	};

	const marginStyle =
		align === "center"
			? { marginLeft: "auto", marginRight: "auto" }
			: align === "right"
			? { marginLeft: "auto", marginRight: 0 }
			: { marginLeft: 0, marginRight: "auto" };

	const gapPx = GAP_PRESETS[gap] || GAP_PRESETS.medium;

	return (
		<NodeViewWrapper
			ref={wrapperRef}
			className={`editor-image-wrapper${selected ? " editor-image-wrapper-selected" : ""}${
				isResizing ? " editor-image-wrapper-resizing" : ""
			}`}
			style={{ width, marginTop: gapPx, marginBottom: gapPx, ...marginStyle }}
		>
			<img src={src} alt={alt || ""} draggable={false} />
			{selected ? (
				<div
					className="editor-image-resize-handle"
					onMouseDown={handleResizeStart}
					title="Drag to resize"
				/>
			) : null}
		</NodeViewWrapper>
	);
}

const ResizableImage = TiptapImage.extend({
	draggable: true,
	addAttributes() {
		return {
			...this.parent?.(),
			width: {
				default: "100%",
				parseHTML: element => element.style.width || "100%",
				renderHTML: attributes => ({
					style: `width: ${attributes.width}; height: auto;`,
				}),
			},
			align: {
				default: "left",
				parseHTML: element => element.getAttribute("data-align") || "left",
				renderHTML: attributes => {
					const margin =
						attributes.align === "center"
							? "margin-left: auto; margin-right: auto;"
							: attributes.align === "right"
							? "margin-left: auto; margin-right: 0;"
							: "margin-left: 0; margin-right: auto;";
					return {
						"data-align": attributes.align,
						style: `display: block; ${margin}`,
					};
				},
			},
			gap: {
				default: "medium",
				parseHTML: element => element.getAttribute("data-gap") || "medium",
				renderHTML: attributes => {
					const gapPx = GAP_PRESETS[attributes.gap] || GAP_PRESETS.medium;
					return {
						"data-gap": attributes.gap,
						style: `margin-top: ${gapPx}; margin-bottom: ${gapPx};`,
					};
				},
			},
		};
	},
	addNodeView() {
		return ReactNodeViewRenderer(ResizableImageView);
	},
});

const FontSize = Extension.create({
	name: "fontSize",
	addOptions() {
		return { types: ["textStyle"] };
	},
	addGlobalAttributes() {
		return [
			{
				types: this.options.types,
				attributes: {
					fontSize: {
						default: null,
						parseHTML: element => element.style.fontSize || null,
						renderHTML: attributes => {
							if (!attributes.fontSize) return {};
							return { style: `font-size: ${attributes.fontSize}` };
						},
					},
				},
			},
		];
	},
	addCommands() {
		return {
			setFontSize:
				fontSize =>
				({ chain }) =>
					chain().setMark("textStyle", { fontSize }).run(),
			unsetFontSize:
				() =>
				({ chain }) =>
					chain().setMark("textStyle", { fontSize: null }).run(),
		};
	},
});

const FONT_SIZES = [
	{ label: "Small", value: "13px" },
	{ label: "Normal", value: "" },
	{ label: "Large", value: "20px" },
	{ label: "X-Large", value: "28px" },
];

const IMAGE_WIDTHS = [
	{ label: "25%", value: "25%" },
	{ label: "50%", value: "50%" },
	{ label: "75%", value: "75%" },
	{ label: "100%", value: "100%" },
];

const IMAGE_ALIGNS = [
	{ label: "Left", value: "left" },
	{ label: "Center", value: "center" },
	{ label: "Right", value: "right" },
];

const IMAGE_GAPS = [
	{ label: "None", value: "none" },
	{ label: "S", value: "small" },
	{ label: "M", value: "medium" },
	{ label: "L", value: "large" },
];

function ToolbarButton({ onClick, isActive, label, children }) {
	return (
		<button
			type="button"
			className={`editor-toolbar-btn${isActive ? " editor-toolbar-btn-active" : ""}`}
			onMouseDown={e => e.preventDefault()}
			onClick={onClick}
			aria-label={label}
			title={label}
		>
			{children}
		</button>
	);
}

function Toolbar({ editor }) {
	const fileInputRef = useRef(null);
	const [isUploading, setIsUploading] = useState(false);

	if (!editor) return null;

	const setLink = () => {
		const previousUrl = editor.getAttributes("link").href;
		const url = window.prompt("Link URL", previousUrl || "https://");
		if (url === null) return;
		if (url === "") {
			editor.chain().focus().extendMarkRange("link").unsetLink().run();
			return;
		}
		editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
	};

	const insertImage = () => {
		const url = window.prompt("Image URL");
		if (!url) return;
		editor.chain().focus().setImage({ src: url, width: "100%" }).run();
	};

	const handleUploadClick = () => {
		fileInputRef.current?.click();
	};

	const handleFileSelected = async e => {
		const file = e.target.files?.[0];
		e.target.value = "";
		if (!file) return;
		setIsUploading(true);
		try {
			const url = await uploadImageFile(file);
			editor.chain().focus().setImage({ src: url, width: "100%" }).run();
		} catch (err) {
			window.alert(err.message);
		} finally {
			setIsUploading(false);
		}
	};

	const insertTable = () => {
		editor
			.chain()
			.focus()
			.insertTable({ rows: 3, cols: 3, withHeaderRow: true })
			.run();
	};

	const isImageActive = editor.isActive("image");
	const isTableActive = editor.isActive("table");
	const currentFontSize = editor.getAttributes("textStyle").fontSize || "";
	const currentColor = editor.getAttributes("textStyle").color || "#000000";

	return (
		<div className="editor-toolbar">
			<ToolbarButton
				label="Bold"
				isActive={editor.isActive("bold")}
				onClick={() => editor.chain().focus().toggleBold().run()}
			>
				<strong>B</strong>
			</ToolbarButton>
			<ToolbarButton
				label="Italic"
				isActive={editor.isActive("italic")}
				onClick={() => editor.chain().focus().toggleItalic().run()}
			>
				<em>I</em>
			</ToolbarButton>
			<ToolbarButton
				label="Strikethrough"
				isActive={editor.isActive("strike")}
				onClick={() => editor.chain().focus().toggleStrike().run()}
			>
				<s>S</s>
			</ToolbarButton>
			<ToolbarButton
				label="Highlight"
				isActive={editor.isActive("highlight")}
				onClick={() => editor.chain().focus().toggleHighlight().run()}
			>
				<span className="editor-highlight-swatch">H</span>
			</ToolbarButton>
			<span className="editor-toolbar-divider" />
			<ToolbarButton
				label="Heading 2"
				isActive={editor.isActive("heading", { level: 2 })}
				onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
			>
				H2
			</ToolbarButton>
			<ToolbarButton
				label="Heading 3"
				isActive={editor.isActive("heading", { level: 3 })}
				onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
			>
				H3
			</ToolbarButton>
			<select
				className="editor-toolbar-select"
				value={currentFontSize}
				onMouseDown={e => e.stopPropagation()}
				onChange={e => {
					const size = e.target.value;
					if (size) editor.chain().focus().setFontSize(size).run();
					else editor.chain().focus().unsetFontSize().run();
				}}
				aria-label="Font size"
			>
				{FONT_SIZES.map(size => (
					<option key={size.label} value={size.value}>
						{size.label}
					</option>
				))}
			</select>
			<label className="editor-toolbar-color" title="Text color">
				<span style={{ background: currentColor }} />
				<input
					type="color"
					value={currentColor}
					onChange={e => editor.chain().focus().setColor(e.target.value).run()}
				/>
			</label>
			<span className="editor-toolbar-divider" />
			<ToolbarButton
				label="Bullet list"
				isActive={editor.isActive("bulletList")}
				onClick={() => editor.chain().focus().toggleBulletList().run()}
			>
				•⁠ List
			</ToolbarButton>
			<ToolbarButton
				label="Numbered list"
				isActive={editor.isActive("orderedList")}
				onClick={() => editor.chain().focus().toggleOrderedList().run()}
			>
				1. List
			</ToolbarButton>
			<ToolbarButton
				label="Quote"
				isActive={editor.isActive("blockquote")}
				onClick={() => editor.chain().focus().toggleBlockquote().run()}
			>
				&ldquo;&rdquo;
			</ToolbarButton>
			<ToolbarButton
				label="Link"
				isActive={editor.isActive("link")}
				onClick={setLink}
			>
				Link
			</ToolbarButton>
			<span className="editor-toolbar-divider" />
			<ToolbarButton label="Insert image by URL" onClick={insertImage}>
				Image URL
			</ToolbarButton>
			<ToolbarButton label="Upload image" onClick={handleUploadClick}>
				{isUploading ? "Uploading..." : "Upload"}
			</ToolbarButton>
			<input
				ref={fileInputRef}
				type="file"
				accept="image/*"
				className="editor-file-input"
				onChange={handleFileSelected}
			/>
			<ToolbarButton label="Insert table" onClick={insertTable}>
				Table
			</ToolbarButton>
			<span className="editor-toolbar-divider" />
			<ToolbarButton
				label="Undo"
				onClick={() => editor.chain().focus().undo().run()}
			>
				↺
			</ToolbarButton>
			<ToolbarButton
				label="Redo"
				onClick={() => editor.chain().focus().redo().run()}
			>
				↻
			</ToolbarButton>

			{isImageActive ? (
				<div className="editor-subtoolbar">
					<span className="editor-subtoolbar-label">Width:</span>
					{IMAGE_WIDTHS.map(w => (
						<ToolbarButton
							key={w.value}
							label={`Set width ${w.label}`}
							isActive={editor.getAttributes("image").width === w.value}
							onClick={() =>
								editor.chain().focus().updateAttributes("image", { width: w.value }).run()
							}
						>
							{w.label}
						</ToolbarButton>
					))}
					<span className="editor-toolbar-divider" />
					<span className="editor-subtoolbar-label">Align:</span>
					{IMAGE_ALIGNS.map(a => (
						<ToolbarButton
							key={a.value}
							label={`Align ${a.label}`}
							isActive={editor.getAttributes("image").align === a.value}
							onClick={() =>
								editor.chain().focus().updateAttributes("image", { align: a.value }).run()
							}
						>
							{a.label}
						</ToolbarButton>
					))}
					<span className="editor-toolbar-divider" />
					<span className="editor-subtoolbar-label">Gap:</span>
					{IMAGE_GAPS.map(g => (
						<ToolbarButton
							key={g.value}
							label={`Gap ${g.label}`}
							isActive={editor.getAttributes("image").gap === g.value}
							onClick={() =>
								editor.chain().focus().updateAttributes("image", { gap: g.value }).run()
							}
						>
							{g.label}
						</ToolbarButton>
					))}
				</div>
			) : null}

			{isTableActive ? (
				<div className="editor-subtoolbar">
					<span className="editor-subtoolbar-label">Table:</span>
					<ToolbarButton label="Add row" onClick={() => editor.chain().focus().addRowAfter().run()}>
						+Row
					</ToolbarButton>
					<ToolbarButton label="Add column" onClick={() => editor.chain().focus().addColumnAfter().run()}>
						+Col
					</ToolbarButton>
					<ToolbarButton label="Delete row" onClick={() => editor.chain().focus().deleteRow().run()}>
						-Row
					</ToolbarButton>
					<ToolbarButton label="Delete column" onClick={() => editor.chain().focus().deleteColumn().run()}>
						-Col
					</ToolbarButton>
					<ToolbarButton label="Delete table" onClick={() => editor.chain().focus().deleteTable().run()}>
						Delete table
					</ToolbarButton>
				</div>
			) : null}
		</div>
	);
}

export default function RichTextEditor({ content, onChange, placeholder }) {
	const editor = useEditor({
		extensions: [
			StarterKit.configure({ link: false }),
			TiptapLink.configure({ openOnClick: false, autolink: true }),
			ResizableImage,
			Placeholder.configure({
				placeholder: placeholder || "Write your post content...",
			}),
			Table.configure({ resizable: false }),
			TableRow,
			TableHeader,
			TableCell,
			TextStyle,
			Color,
			FontSize,
			Highlight.configure({ multicolor: false }),
		],
		content: content || "",
		immediatelyRender: false,
		onUpdate: ({ editor }) => {
			onChange(editor.getHTML());
		},
		editorProps: {
			handleDrop: (view, event, slice, moved) => {
				const files = event.dataTransfer?.files;
				if (!moved && files && files.length > 0 && files[0].type.startsWith("image/")) {
					event.preventDefault();
					const file = files[0];
					const coords = { left: event.clientX, top: event.clientY };
					const dropPos = view.posAtCoords(coords)?.pos ?? view.state.selection.from;

					uploadImageFile(file)
						.then(url => {
							const node = view.state.schema.nodes.image.create({
								src: url,
								width: "100%",
								align: "left",
								gap: "medium",
							});
							view.dispatch(view.state.tr.insert(dropPos, node));
						})
						.catch(err => window.alert(err.message));

					return true;
				}
				return false;
			},
			handlePaste: (view, event) => {
				const items = event.clipboardData?.items;
				if (!items) return false;

				for (const item of items) {
					if (item.type.startsWith("image/")) {
						const file = item.getAsFile();
						if (!file) continue;
						event.preventDefault();

						uploadImageFile(file)
							.then(url => {
								const node = view.state.schema.nodes.image.create({
									src: url,
									width: "100%",
									align: "left",
									gap: "medium",
								});
								view.dispatch(view.state.tr.replaceSelectionWith(node));
							})
							.catch(err => window.alert(err.message));

						return true;
					}
				}
				return false;
			},
		},
	});

	return (
		<div className="editor-wrap">
			<Toolbar editor={editor} />
			<EditorContent editor={editor} className="editor-content" />
		</div>
	);
}
