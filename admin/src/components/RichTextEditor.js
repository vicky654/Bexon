"use client";

import { useEffect, useRef, useState } from "react";
import { useEditor, EditorContent, NodeViewWrapper, ReactNodeViewRenderer } from "@tiptap/react";
import { Extension, Node, mergeAttributes } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import TiptapLink from "@tiptap/extension-link";
import TiptapImage from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import { Table, TableRow, TableHeader, TableCell } from "@tiptap/extension-table";
import { TextStyle } from "@tiptap/extension-text-style";
import Color from "@tiptap/extension-color";
import Highlight from "@tiptap/extension-highlight";
import TextAlign from "@tiptap/extension-text-align";
import { UploadIcon } from "@/components/Icons";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";
const ROW_COLUMN_OPTIONS = [2, 3, 4];
const MIN_IMAGE_WIDTH_PERCENT = 10;
const MIN_GAP_PX = 0;
const MAX_GAP_PX = 48;

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

/* ---------- Toolbar icons ---------- */

function Icon({ children, size = 17 }) {
	return (
		<svg
			width={size}
			height={size}
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="2.25"
			strokeLinecap="round"
			strokeLinejoin="round"
		>
			{children}
		</svg>
	);
}

const BoldIcon = () => (
	<Icon>
		<path d="M6 4h7a3.5 3.5 0 0 1 0 7H6z" />
		<path d="M6 11h8a3.5 3.5 0 0 1 0 7H6z" />
	</Icon>
);
const ItalicIcon = () => (
	<Icon>
		<line x1="19" y1="4" x2="11" y2="4" />
		<line x1="13" y1="20" x2="5" y2="20" />
		<line x1="15" y1="4" x2="9" y2="20" />
	</Icon>
);
const StrikeIcon = () => (
	<Icon>
		<path d="M6 12h12" />
		<path d="M16 6.5C15.3 5 13.8 4 12 4c-2.2 0-4 1.3-4 3s1.8 3 4 3.3" />
		<path d="M8 17.5c.7 1.5 2.2 2.5 4 2.5 2.2 0 4-1.3 4-3.3 0-1.2-.7-2.1-1.8-2.7" />
	</Icon>
);
const BulletListIcon = () => (
	<Icon>
		<circle cx="4.5" cy="6" r="1.2" fill="currentColor" stroke="none" />
		<circle cx="4.5" cy="12" r="1.2" fill="currentColor" stroke="none" />
		<circle cx="4.5" cy="18" r="1.2" fill="currentColor" stroke="none" />
		<line x1="9" y1="6" x2="20" y2="6" />
		<line x1="9" y1="12" x2="20" y2="12" />
		<line x1="9" y1="18" x2="20" y2="18" />
	</Icon>
);
const OrderedListIcon = () => (
	<Icon>
		<text x="1.5" y="8.5" fontSize="7" stroke="none" fill="currentColor">1</text>
		<text x="1.5" y="14.5" fontSize="7" stroke="none" fill="currentColor">2</text>
		<text x="1.5" y="20.5" fontSize="7" stroke="none" fill="currentColor">3</text>
		<line x1="9" y1="6" x2="20" y2="6" />
		<line x1="9" y1="12" x2="20" y2="12" />
		<line x1="9" y1="18" x2="20" y2="18" />
	</Icon>
);
const QuoteIcon = () => (
	<Icon>
		<path d="M7 7h4v5c0 3-1.5 4.5-4 5" />
		<path d="M15 7h4v5c0 3-1.5 4.5-4 5" />
	</Icon>
);
const TrashIcon = () => (
	<Icon>
		<path d="M3 6h18" />
		<path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
		<path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
		<path d="M10 11v6M14 11v6" />
	</Icon>
);
const LinkIcon = () => (
	<Icon>
		<path d="M9 17H7a5 5 0 0 1 0-10h2" />
		<path d="M15 7h2a5 5 0 0 1 0 10h-2" />
		<line x1="8" y1="12" x2="16" y2="12" />
	</Icon>
);
const ImageIcon = () => (
	<Icon>
		<rect x="3" y="4" width="18" height="16" rx="2" />
		<circle cx="8.5" cy="9.5" r="1.5" />
		<path d="m21 15-5-5-9 9" />
	</Icon>
);
const TableIcon = () => (
	<Icon>
		<rect x="3" y="4" width="18" height="16" rx="2" />
		<line x1="3" y1="10" x2="21" y2="10" />
		<line x1="9" y1="4" x2="9" y2="20" />
	</Icon>
);
const AlignLeftIcon = () => (
	<Icon>
		<line x1="4" y1="6" x2="20" y2="6" />
		<line x1="4" y1="12" x2="14" y2="12" />
		<line x1="4" y1="18" x2="17" y2="18" />
	</Icon>
);
const AlignCenterIcon = () => (
	<Icon>
		<line x1="4" y1="6" x2="20" y2="6" />
		<line x1="7" y1="12" x2="17" y2="12" />
		<line x1="5.5" y1="18" x2="18.5" y2="18" />
	</Icon>
);
const AlignRightIcon = () => (
	<Icon>
		<line x1="4" y1="6" x2="20" y2="6" />
		<line x1="10" y1="12" x2="20" y2="12" />
		<line x1="7" y1="18" x2="20" y2="18" />
	</Icon>
);
const UndoIcon = () => (
	<Icon>
		<path d="M9 14 4 9l5-5" />
		<path d="M4 9h10a6 6 0 0 1 0 12h-3" />
	</Icon>
);
const RedoIcon = () => (
	<Icon>
		<path d="m15 14 5-5-5-5" />
		<path d="M20 9H10a6 6 0 0 0 0 12h3" />
	</Icon>
);
const RowIcon = () => (
	<Icon>
		<rect x="3" y="6" width="7" height="12" rx="1.5" />
		<rect x="14" y="6" width="7" height="12" rx="1.5" />
	</Icon>
);
const GripIcon = () => (
	<svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
		<circle cx="8" cy="6" r="1.8" />
		<circle cx="16" cy="6" r="1.8" />
		<circle cx="8" cy="12" r="1.8" />
		<circle cx="16" cy="12" r="1.8" />
		<circle cx="8" cy="18" r="1.8" />
		<circle cx="16" cy="18" r="1.8" />
	</svg>
);
const ChevronIcon = ({ direction = "down" }) => (
	<Icon size={15}>
		{direction === "down" ? <polyline points="6 9 12 15 18 9" /> : <polyline points="18 15 12 9 6 15" />}
	</Icon>
);

/* ---------- Resizable / draggable image node ---------- */

const MIN_IMAGE_HEIGHT_PX = 60;
const MAX_IMAGE_HEIGHT_PX = 900;

function ResizableImageView({ node, updateAttributes, selected }) {
	const { src, alt, width, height, align, gap } = node.attrs;
	const wrapperRef = useRef(null);
	const [isResizing, setIsResizing] = useState(false);

	const startDrag = onMove => e => {
		e.preventDefault();
		e.stopPropagation();
		setIsResizing(true);

		const onMouseMove = moveEvent => onMove(moveEvent);
		const onMouseUp = () => {
			setIsResizing(false);
			document.removeEventListener("mousemove", onMouseMove);
			document.removeEventListener("mouseup", onMouseUp);
		};

		document.addEventListener("mousemove", onMouseMove);
		document.addEventListener("mouseup", onMouseUp);
	};

	// Width-only handle: drag horizontally.
	const onWidthResizeStart = e => {
		const container = wrapperRef.current?.parentElement;
		const containerWidth = container?.offsetWidth || 1;
		const startX = e.clientX;
		const startWidthPx = wrapperRef.current?.offsetWidth || 0;
		startDrag(moveEvent => {
			const deltaX = moveEvent.clientX - startX;
			const newWidthPx = Math.max(MIN_IMAGE_HEIGHT_PX, startWidthPx + deltaX);
			const newPercent = Math.min(100, Math.max(10, Math.round((newWidthPx / containerWidth) * 100)));
			updateAttributes({ width: `${newPercent}%` });
		})(e);
	};

	// Height-only handle: drag vertically, switches the image into a cropped fixed-height box.
	const onHeightResizeStart = e => {
		const startY = e.clientY;
		const startHeightPx = wrapperRef.current?.offsetHeight || 200;
		startDrag(moveEvent => {
			const deltaY = moveEvent.clientY - startY;
			const newHeightPx = Math.max(
				MIN_IMAGE_HEIGHT_PX,
				Math.min(MAX_IMAGE_HEIGHT_PX, startHeightPx + deltaY)
			);
			updateAttributes({ height: `${Math.round(newHeightPx)}px` });
		})(e);
	};

	// Corner handle: drag both axes to resize width and height together.
	const onCornerResizeStart = e => {
		const container = wrapperRef.current?.parentElement;
		const containerWidth = container?.offsetWidth || 1;
		const startX = e.clientX;
		const startY = e.clientY;
		const startWidthPx = wrapperRef.current?.offsetWidth || 0;
		const startHeightPx = wrapperRef.current?.offsetHeight || 200;
		startDrag(moveEvent => {
			const deltaX = moveEvent.clientX - startX;
			const deltaY = moveEvent.clientY - startY;
			const newWidthPx = Math.max(MIN_IMAGE_HEIGHT_PX, startWidthPx + deltaX);
			const newPercent = Math.min(100, Math.max(10, Math.round((newWidthPx / containerWidth) * 100)));
			const newHeightPx = Math.max(
				MIN_IMAGE_HEIGHT_PX,
				Math.min(MAX_IMAGE_HEIGHT_PX, startHeightPx + deltaY)
			);
			updateAttributes({ width: `${newPercent}%`, height: `${Math.round(newHeightPx)}px` });
		})(e);
	};

	const marginStyle =
		align === "center"
			? { marginLeft: "auto", marginRight: "auto" }
			: align === "right"
			? { marginLeft: "auto", marginRight: 0 }
			: { marginLeft: 0, marginRight: "auto" };

	const gapPx = gap || "16px";
	const isCropped = height && height !== "auto";

	return (
		<NodeViewWrapper
			ref={wrapperRef}
			className={`editor-image-wrapper${selected ? " editor-image-wrapper-selected" : ""}${
				isResizing ? " editor-image-wrapper-resizing" : ""
			}`}
			style={{ width, height, marginTop: gapPx, marginBottom: gapPx, ...marginStyle }}
		>
			<img
				src={src}
				alt={alt || ""}
				draggable={false}
				style={isCropped ? { height: "100%", objectFit: "cover" } : undefined}
			/>
			{selected ? (
				<>
					<div
						className="editor-image-drag-handle"
						data-tooltip="Drag to move this image"
						aria-label="Drag to move"
					>
						<GripIcon />
					</div>
					<div
						className="editor-image-resize-handle editor-image-resize-handle-width"
						onMouseDown={onWidthResizeStart}
						data-tooltip="Drag to resize width"
					/>
					<div
						className="editor-image-resize-handle editor-image-resize-handle-height"
						onMouseDown={onHeightResizeStart}
						data-tooltip="Drag to resize height"
					/>
					<div
						className="editor-image-resize-handle editor-image-resize-handle-corner"
						onMouseDown={onCornerResizeStart}
						data-tooltip="Drag to resize width & height"
					/>
				</>
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
					style: `width: ${attributes.width};`,
				}),
			},
			height: {
				default: "auto",
				parseHTML: element => element.style.height || "auto",
				renderHTML: attributes => ({
					style: `height: ${attributes.height};`,
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
				default: "16px",
				parseHTML: element => element.style.marginTop || "16px",
				renderHTML: attributes => ({
					style: `margin-top: ${attributes.gap}; margin-bottom: ${attributes.gap};`,
				}),
			},
		};
	},
	addNodeView() {
		return ReactNodeViewRenderer(ResizableImageView);
	},
});

/* ---------- Image row (multiple images side by side) ---------- */

const ImageRow = Node.create({
	name: "imageRow",
	group: "block",
	content: "image+",
	draggable: true,
	addAttributes() {
		return {
			columns: {
				default: 2,
				parseHTML: element => Number(element.getAttribute("data-columns")) || 2,
				renderHTML: attributes => ({
					"data-columns": attributes.columns,
					style: `display: grid; grid-template-columns: repeat(${attributes.columns}, 1fr); gap: 12px;`,
				}),
			},
		};
	},
	parseHTML() {
		return [{ tag: "div[data-image-row]" }];
	},
	renderHTML({ HTMLAttributes }) {
		return ["div", mergeAttributes(HTMLAttributes, { "data-image-row": "", class: "editor-image-row" }), 0];
	},
});

/* ---------- Font size ---------- */

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

const IMAGE_ALIGNS = [
	{ label: "Left", value: "left" },
	{ label: "Center", value: "center" },
	{ label: "Right", value: "right" },
];

function ToolbarButton({ onClick, isActive, label, children }) {
	return (
		<button
			type="button"
			className={`editor-toolbar-btn${isActive ? " editor-toolbar-btn-active" : ""}`}
			onMouseDown={e => e.preventDefault()}
			onClick={onClick}
			aria-label={label}
			data-tooltip={label}
		>
			{children}
		</button>
	);
}

function RangeControl({ label, min, max, step = 1, value, unit = "", onChange, isAuto, onAutoClick }) {
	return (
		<div className="editor-range-control">
			<span className="editor-subtoolbar-label">{label}</span>
			{onAutoClick ? (
				<button
					type="button"
					className={`editor-toolbar-btn editor-range-auto-btn${isAuto ? " editor-toolbar-btn-active" : ""}`}
					onMouseDown={e => e.preventDefault()}
					onClick={onAutoClick}
				>
					Auto
				</button>
			) : null}
			<input
				type="range"
				className="editor-range-input"
				min={min}
				max={max}
				step={step}
				value={value}
				onMouseDown={e => e.stopPropagation()}
				onChange={e => onChange(Number(e.target.value))}
				aria-label={label}
			/>
			<span className="editor-range-value">{isAuto ? "Auto" : `${value}${unit}`}</span>
		</div>
	);
}

function Toolbar({ editor, isPinned, isCollapsed, onToggleCollapse }) {
	const fileInputRef = useRef(null);
	const rowFileInputRef = useRef(null);
	const [isUploading, setIsUploading] = useState(false);
	const [isRowUploading, setIsRowUploading] = useState(false);
	const [rowColumns, setRowColumns] = useState(2);

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

	const handleRowUploadClick = () => {
		rowFileInputRef.current?.click();
	};

	const handleRowFilesSelected = async e => {
		const files = Array.from(e.target.files || []);
		e.target.value = "";
		if (!files.length) return;
		setIsRowUploading(true);
		try {
			const urls = await Promise.all(files.map(uploadImageFile));
			editor
				.chain()
				.focus()
				.insertContent({
					type: "imageRow",
					attrs: { columns: rowColumns },
					content: urls.map(url => ({
						type: "image",
						attrs: { src: url, width: "100%", align: "left", gap: "0px" },
					})),
				})
				.run();
		} catch (err) {
			window.alert(err.message);
		} finally {
			setIsRowUploading(false);
		}
	};

	const insertTable = () => {
		editor
			.chain()
			.focus()
			.insertTable({ rows: 3, cols: 3, withHeaderRow: true })
			.run();
	};

	const removeImage = () => {
		editor.chain().focus().deleteSelection().run();
	};

	const isImageActive = editor.isActive("image");
	const isTableActive = editor.isActive("table");
	const isImageRowActive = editor.isActive("imageRow");
	const currentFontSize = editor.getAttributes("textStyle").fontSize || "";
	const currentColor = editor.getAttributes("textStyle").color || "#000000";

	const imageAttrs = isImageActive ? editor.getAttributes("image") : {};
	const imageWidthPercent = parseInt(imageAttrs.width, 10) || 100;
	const imageHeightRaw = imageAttrs.height || "auto";
	const imageHeightIsAuto = imageHeightRaw === "auto";
	const imageHeightPx = imageHeightIsAuto ? 320 : parseInt(imageHeightRaw, 10) || 320;
	const imageGapPx = parseInt(imageAttrs.gap, 10);
	const imageGapValue = Number.isNaN(imageGapPx) ? 16 : imageGapPx;

	return (
		<div className={`editor-toolbar${isCollapsed ? " editor-toolbar-collapsed" : ""}`}>
			<div className="editor-toolbar-group">
				<ToolbarButton
					label="Bold"
					isActive={editor.isActive("bold")}
					onClick={() => editor.chain().focus().toggleBold().run()}
				>
					<BoldIcon />
				</ToolbarButton>
				<ToolbarButton
					label="Italic"
					isActive={editor.isActive("italic")}
					onClick={() => editor.chain().focus().toggleItalic().run()}
				>
					<ItalicIcon />
				</ToolbarButton>
				<ToolbarButton
					label="Strikethrough"
					isActive={editor.isActive("strike")}
					onClick={() => editor.chain().focus().toggleStrike().run()}
				>
					<StrikeIcon />
				</ToolbarButton>
				<ToolbarButton
					label="Highlight"
					isActive={editor.isActive("highlight")}
					onClick={() => editor.chain().focus().toggleHighlight().run()}
				>
					<span className="editor-highlight-swatch">H</span>
				</ToolbarButton>
			</div>

			{isPinned ? (
				<button
					type="button"
					className="editor-toolbar-collapse-btn"
					onMouseDown={e => e.preventDefault()}
					onClick={onToggleCollapse}
					data-tooltip={isCollapsed ? "Show full toolbar" : "Collapse toolbar"}
					aria-label={isCollapsed ? "Show full toolbar" : "Collapse toolbar"}
					aria-expanded={!isCollapsed}
				>
					<ChevronIcon direction={isCollapsed ? "down" : "up"} />
					<span className="editor-toolbar-btn-text">{isCollapsed ? "More" : "Less"}</span>
				</button>
			) : null}

			{!isCollapsed ? (
				<>
			<div className="editor-toolbar-group">
				<ToolbarButton
					label="Undo"
					onClick={() => editor.chain().focus().undo().run()}
				>
					<UndoIcon />
				</ToolbarButton>
				<ToolbarButton
					label="Redo"
					onClick={() => editor.chain().focus().redo().run()}
				>
					<RedoIcon />
				</ToolbarButton>
			</div>

			<div className="editor-toolbar-group">
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
				<label className="editor-toolbar-color" data-tooltip="Text color">
					<span style={{ background: currentColor }} />
					<input
						type="color"
						value={currentColor}
						onChange={e => editor.chain().focus().setColor(e.target.value).run()}
					/>
				</label>
			</div>

			<div className="editor-toolbar-group">
				<ToolbarButton
					label="Align text left"
					isActive={editor.isActive({ textAlign: "left" })}
					onClick={() => editor.chain().focus().setTextAlign("left").run()}
				>
					<AlignLeftIcon />
				</ToolbarButton>
				<ToolbarButton
					label="Center text"
					isActive={editor.isActive({ textAlign: "center" })}
					onClick={() => editor.chain().focus().setTextAlign("center").run()}
				>
					<AlignCenterIcon />
				</ToolbarButton>
				<ToolbarButton
					label="Align text right"
					isActive={editor.isActive({ textAlign: "right" })}
					onClick={() => editor.chain().focus().setTextAlign("right").run()}
				>
					<AlignRightIcon />
				</ToolbarButton>
			</div>

			<div className="editor-toolbar-group">
				<ToolbarButton
					label="Bullet list"
					isActive={editor.isActive("bulletList")}
					onClick={() => editor.chain().focus().toggleBulletList().run()}
				>
					<BulletListIcon />
				</ToolbarButton>
				<ToolbarButton
					label="Numbered list"
					isActive={editor.isActive("orderedList")}
					onClick={() => editor.chain().focus().toggleOrderedList().run()}
				>
					<OrderedListIcon />
				</ToolbarButton>
				<ToolbarButton
					label="Quote"
					isActive={editor.isActive("blockquote")}
					onClick={() => editor.chain().focus().toggleBlockquote().run()}
				>
					<QuoteIcon />
				</ToolbarButton>
				<ToolbarButton
					label="Link"
					isActive={editor.isActive("link")}
					onClick={setLink}
				>
					<LinkIcon />
				</ToolbarButton>
			</div>

			<div className="editor-toolbar-group">
				<ToolbarButton label="Insert image by URL" onClick={insertImage}>
					<ImageIcon />
					<span className="editor-toolbar-btn-text">URL</span>
				</ToolbarButton>
				<ToolbarButton label="Upload image from your device" onClick={handleUploadClick}>
					<UploadIcon size={16} />
					<span className="editor-toolbar-btn-text">{isUploading ? "Uploading…" : "Upload"}</span>
				</ToolbarButton>
				<input
					ref={fileInputRef}
					type="file"
					accept="image/*"
					className="editor-file-input"
					onChange={handleFileSelected}
				/>
				<span className="editor-toolbar-divider" />
				<select
					className="editor-toolbar-select"
					value={rowColumns}
					onMouseDown={e => e.stopPropagation()}
					onChange={e => setRowColumns(Number(e.target.value))}
					aria-label="Images per row"
					title="Number of images to upload side by side"
				>
					{ROW_COLUMN_OPTIONS.map(n => (
						<option key={n} value={n}>
							{n} per row
						</option>
					))}
				</select>
				<ToolbarButton label="Upload a row of images side by side" onClick={handleRowUploadClick}>
					<RowIcon />
					<span className="editor-toolbar-btn-text">{isRowUploading ? "Uploading…" : "Image row"}</span>
				</ToolbarButton>
				<input
					ref={rowFileInputRef}
					type="file"
					accept="image/*"
					multiple
					className="editor-file-input"
					onChange={handleRowFilesSelected}
				/>
				<span className="editor-toolbar-divider" />
				<ToolbarButton label="Insert table" onClick={insertTable}>
					<TableIcon />
					<span className="editor-toolbar-btn-text">Table</span>
				</ToolbarButton>
			</div>

			{isImageActive ? (
				<div className="editor-image-panel">
					<div className="editor-image-panel-header">
						<span className="editor-image-panel-title">Image options</span>
						<ToolbarButton label="Remove image" onClick={removeImage}>
							<TrashIcon />
							<span className="editor-toolbar-btn-text">Remove image</span>
						</ToolbarButton>
					</div>

					<div className="editor-image-panel-section">
						<span className="editor-image-panel-section-label">Size</span>
						<div className="editor-image-panel-row">
							<RangeControl
								label="Width"
								min={MIN_IMAGE_WIDTH_PERCENT}
								max={100}
								unit="%"
								value={imageWidthPercent}
								onChange={v =>
									editor.chain().focus().updateAttributes("image", { width: `${v}%` }).run()
								}
							/>
							<RangeControl
								label="Height"
								min={MIN_IMAGE_HEIGHT_PX}
								max={MAX_IMAGE_HEIGHT_PX}
								step={10}
								unit="px"
								value={imageHeightPx}
								isAuto={imageHeightIsAuto}
								onChange={v =>
									editor.chain().focus().updateAttributes("image", { height: `${v}px` }).run()
								}
								onAutoClick={() =>
									editor.chain().focus().updateAttributes("image", { height: "auto" }).run()
								}
							/>
							<RangeControl
								label="Gap"
								min={MIN_GAP_PX}
								max={MAX_GAP_PX}
								step={2}
								unit="px"
								value={imageGapValue}
								onChange={v =>
									editor.chain().focus().updateAttributes("image", { gap: `${v}px` }).run()
								}
							/>
						</div>
					</div>

					<div className="editor-image-panel-section">
						<span className="editor-image-panel-section-label">Alignment</span>
						<div className="editor-image-panel-row">
							{IMAGE_ALIGNS.map(a => (
								<ToolbarButton
									key={a.value}
									label={`Align ${a.label}`}
									isActive={editor.getAttributes("image").align === a.value}
									onClick={() =>
										editor.chain().focus().updateAttributes("image", { align: a.value }).run()
									}
								>
									{a.value === "left" ? (
										<AlignLeftIcon />
									) : a.value === "center" ? (
										<AlignCenterIcon />
									) : (
										<AlignRightIcon />
									)}
									<span className="editor-toolbar-btn-text">{a.label}</span>
								</ToolbarButton>
							))}
						</div>
					</div>
				</div>
			) : null}

			{isImageRowActive ? (
				<div className="editor-image-panel">
					<div className="editor-image-panel-header">
						<span className="editor-image-panel-title">Image row options</span>
					</div>
					<div className="editor-image-panel-section">
						<span className="editor-image-panel-section-label">Images per row</span>
						<div className="editor-image-panel-row">
							{ROW_COLUMN_OPTIONS.map(n => (
								<ToolbarButton
									key={n}
									label={`${n} per row`}
									isActive={editor.getAttributes("imageRow").columns === n}
									onClick={() =>
										editor.chain().focus().updateAttributes("imageRow", { columns: n }).run()
									}
								>
									{n}
								</ToolbarButton>
							))}
						</div>
					</div>
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
					<span className="editor-toolbar-divider" />
					<span className="editor-subtoolbar-label">Cell text:</span>
					<ToolbarButton
						label="Align cell text left"
						isActive={editor.isActive({ textAlign: "left" })}
						onClick={() => editor.chain().focus().setTextAlign("left").run()}
					>
						<AlignLeftIcon />
					</ToolbarButton>
					<ToolbarButton
						label="Center cell text"
						isActive={editor.isActive({ textAlign: "center" })}
						onClick={() => editor.chain().focus().setTextAlign("center").run()}
					>
						<AlignCenterIcon />
					</ToolbarButton>
					<ToolbarButton
						label="Align cell text right"
						isActive={editor.isActive({ textAlign: "right" })}
						onClick={() => editor.chain().focus().setTextAlign("right").run()}
					>
						<AlignRightIcon />
					</ToolbarButton>
				</div>
			) : null}
				</>
			) : null}
		</div>
	);
}

function buildImageNode(url) {
	return {
		type: "image",
		attrs: { src: url, width: "100%", align: "left", gap: "16px" },
	};
}

function countWordsAndChars(text) {
	const trimmed = text.trim();
	return {
		words: trimmed ? trimmed.split(/\s+/).length : 0,
		chars: text.length,
	};
}

export default function RichTextEditor({ content, onChange, placeholder }) {
	const sentinelRef = useRef(null);
	const [isPinned, setIsPinned] = useState(false);
	const [manualExpand, setManualExpand] = useState(false);
	const [counts, setCounts] = useState({ words: 0, chars: 0 });

	useEffect(() => {
		const el = sentinelRef.current;
		if (!el || typeof IntersectionObserver === "undefined") return undefined;

		const observer = new IntersectionObserver(
			([entry]) => {
				const pinned = !entry.isIntersecting;
				setIsPinned(pinned);
				if (!pinned) setManualExpand(false);
			},
			{ threshold: 0, rootMargin: "-13px 0px 0px 0px" }
		);
		observer.observe(el);
		return () => observer.disconnect();
	}, []);

	const editor = useEditor({
		extensions: [
			StarterKit.configure({ link: false }),
			TiptapLink.configure({ openOnClick: false, autolink: true }),
			ResizableImage,
			ImageRow,
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
			TextAlign.configure({ types: ["heading", "paragraph"], alignments: ["left", "center", "right"] }),
		],
		content: content || "",
		immediatelyRender: false,
		shouldRerenderOnTransaction: true,
		onCreate: ({ editor }) => {
			setCounts(countWordsAndChars(editor.getText()));
		},
		onUpdate: ({ editor }) => {
			onChange(editor.getHTML());
			setCounts(countWordsAndChars(editor.getText()));
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
							const node = view.state.schema.nodes.image.create(buildImageNode(url).attrs);
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
								const node = view.state.schema.nodes.image.create(buildImageNode(url).attrs);
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

	const isCollapsed = isPinned && !manualExpand;

	return (
		<div className="editor-wrap">
			<div ref={sentinelRef} className="editor-toolbar-sentinel" />
			<Toolbar
				editor={editor}
				isPinned={isPinned}
				isCollapsed={isCollapsed}
				onToggleCollapse={() => setManualExpand(v => !v)}
			/>
			<EditorContent editor={editor} className="editor-content" />
			<div className="editor-footer">
				<span>{counts.words} {counts.words === 1 ? "word" : "words"}</span>
				<span>{counts.chars} {counts.chars === 1 ? "character" : "characters"}</span>
			</div>
		</div>
	);
}
