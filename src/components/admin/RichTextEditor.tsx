"use client";

import { useRef, useState } from "react";
import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import TiptapImage from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import { TextStyle } from "@tiptap/extension-text-style";
import Color from "@tiptap/extension-color";
import { Markdown } from "tiptap-markdown";

const COLORS = ["#111827", "#DC2626", "#D97706", "#15803D", "#1D4ED8", "#7C3AED"];

function ToolbarButton({
  children,
  onClick,
  active,
  disabled,
  title,
}: {
  children: React.ReactNode;
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  title?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className="btn btn-secondary btn-sm"
      style={{
        backgroundColor: active ? "var(--color-gray-300)" : undefined,
        borderColor: active ? "var(--color-gray-400)" : undefined,
      }}
    >
      {children}
    </button>
  );
}

function Toolbar({
  editor,
  uploading,
  onPickImage,
}: {
  editor: Editor;
  uploading: boolean;
  onPickImage: () => void;
}) {
  return (
    <div
      style={{
        display: "flex",
        gap: "0.25rem",
        flexWrap: "wrap",
        alignItems: "center",
        padding: "0.5rem",
        border: "1px solid var(--color-gray-200)",
        borderRadius: "var(--radius-sm) var(--radius-sm) 0 0",
        backgroundColor: "var(--color-gray-50)",
      }}
    >
      <ToolbarButton title="太字" active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()}>
        <strong>B</strong>
      </ToolbarButton>
      <ToolbarButton title="斜体" active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()}>
        <em>I</em>
      </ToolbarButton>
      <ToolbarButton title="見出し2" active={editor.isActive("heading", { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>
        H2
      </ToolbarButton>
      <ToolbarButton title="見出し3" active={editor.isActive("heading", { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}>
        H3
      </ToolbarButton>
      <ToolbarButton title="箇条書き" active={editor.isActive("bulletList")} onClick={() => editor.chain().focus().toggleBulletList().run()}>
        ・リスト
      </ToolbarButton>
      <ToolbarButton title="番号付きリスト" active={editor.isActive("orderedList")} onClick={() => editor.chain().focus().toggleOrderedList().run()}>
        1.リスト
      </ToolbarButton>
      <ToolbarButton title="引用" active={editor.isActive("blockquote")} onClick={() => editor.chain().focus().toggleBlockquote().run()}>
        引用
      </ToolbarButton>
      <span style={{ width: "1px", height: "20px", backgroundColor: "var(--color-gray-300)", margin: "0 0.125rem" }} />
      {COLORS.map((c) => (
        <button
          key={c}
          type="button"
          title="文字色"
          onClick={() => editor.chain().focus().setColor(c).run()}
          style={{ width: "20px", height: "20px", borderRadius: "50%", backgroundColor: c, border: "1px solid var(--color-gray-300)", cursor: "pointer", padding: 0 }}
        />
      ))}
      <ToolbarButton title="文字色を解除" onClick={() => editor.chain().focus().unsetColor().run()}>
        色クリア
      </ToolbarButton>
      <span style={{ width: "1px", height: "20px", backgroundColor: "var(--color-gray-300)", margin: "0 0.125rem" }} />
      <ToolbarButton title="画像を挿入" disabled={uploading} onClick={onPickImage}>
        {uploading ? "アップロード中..." : "画像を挿入"}
      </ToolbarButton>
    </div>
  );
}

export function RichTextEditor({
  name,
  defaultValue,
  uploadAction,
  minHeight = 280,
}: {
  name: string;
  defaultValue?: string | null;
  uploadAction: (formData: FormData) => Promise<string>;
  minHeight?: number;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [markdown, setMarkdown] = useState(defaultValue ?? "");

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({ link: { openOnClick: false } }),
      TextStyle,
      Color,
      TiptapImage,
      Placeholder.configure({ placeholder: "本文を入力..." }),
      Markdown.configure({ html: true }),
    ],
    content: defaultValue ?? "",
    onUpdate: ({ editor }) => {
      setMarkdown((editor.storage as any).markdown.getMarkdown());
    },
  });

  async function handleImageFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !editor) return;
    setUploading(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.set("file", file);
      const url = await uploadAction(fd);
      editor.chain().focus().setImage({ src: url }).run();
      setMarkdown((editor.storage as any).markdown.getMarkdown());
    } catch (err: any) {
      setError(err.message ?? "アップロードに失敗しました");
    } finally {
      setUploading(false);
    }
  }

  if (!editor) return null;

  return (
    <div>
      <Toolbar editor={editor} uploading={uploading} onPickImage={() => fileInputRef.current?.click()} />
      <input ref={fileInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleImageFile} />
      {error && (
        <p style={{ fontSize: "0.8125rem", color: "var(--color-error)", marginTop: "0.5rem" }}>{error}</p>
      )}
      <div
        className="markdown-body rich-text-editor-content"
        style={{
          border: "1px solid var(--color-gray-200)",
          borderTop: "none",
          borderRadius: "0 0 var(--radius-sm) var(--radius-sm)",
          padding: "0.875rem 1rem",
          minHeight: `${minHeight}px`,
          backgroundColor: "var(--color-white)",
        }}
      >
        <EditorContent editor={editor} />
      </div>
      <input type="hidden" name={name} value={markdown} />
    </div>
  );
}
