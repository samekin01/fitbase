import type { ReactNode } from "react";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeRaw from "rehype-raw";
import rehypeSanitize, { defaultSchema } from "rehype-sanitize";
import rehypeSlug from "rehype-slug";
import rehypeReact from "rehype-react";
import * as prod from "react/jsx-runtime";

// 本文中の文字色変更（リッチテキストエディタ由来の <span style="color:..."> ）のみを
// HTMLとして許可する。それ以外の危険なタグ・属性（script、on*イベント等）は除去する。
const sanitizeSchema = {
  ...defaultSchema,
  tagNames: [...(defaultSchema.tagNames ?? []), "span"],
  attributes: {
    ...defaultSchema.attributes,
    span: [...((defaultSchema.attributes as any)?.span ?? []), "style"],
  },
};

const COLOR_STYLE_RE = /^color:\s*(#[0-9a-fA-F]{3,8}|rgb\([\d,\s]+\)|[a-zA-Z]+)\s*;?\s*$/;

function rehypeRestrictStyle() {
  return (tree: any) => {
    function visit(node: any) {
      if (node.type === "element" && typeof node.properties?.style === "string") {
        const match = COLOR_STYLE_RE.exec(node.properties.style.trim());
        if (match) {
          node.properties.style = `${match[0].replace(/;?\s*$/, "")};`;
        } else {
          delete node.properties.style;
        }
      }
      (node.children ?? []).forEach(visit);
    }
    visit(tree);
  };
}

export type TocItem = { id: string; text: string; depth: number };

function nodeText(node: any): string {
  if (node.type === "text") return node.value;
  return (node.children ?? []).map(nodeText).join("");
}

function rehypeToc() {
  return (tree: any, file: any) => {
    const items: TocItem[] = [];
    function visit(node: any) {
      if (node.type === "element" && /^h[23]$/.test(node.tagName)) {
        const id = node.properties?.id;
        if (id) items.push({ id, text: nodeText(node), depth: Number(node.tagName[1]) });
      }
      (node.children ?? []).forEach(visit);
    }
    visit(tree);
    file.data.toc = items;
  };
}

// JSON-LDのdescriptionなど、装飾なしのプレーンテキストが必要な場所向けの簡易変換。
export function stripMarkdownToPlainText(md: string | null): string {
  if (!md) return "";
  return md
    .replace(/<[^>]+>/g, "")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/(\*\*|__)(.*?)\1/g, "$2")
    .replace(/(\*|_)(.*?)\1/g, "$2")
    .replace(/^>\s?/gm, "")
    .replace(/\s*\n\s*/g, " ")
    .trim();
}

export async function renderMarkdown(md: string | null): Promise<{ content: ReactNode; toc: TocItem[] }> {
  if (!md) return { content: null, toc: [] };

  const file = await unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeRaw)
    .use(rehypeSanitize, sanitizeSchema as any)
    .use(rehypeRestrictStyle)
    .use(rehypeSlug)
    .use(rehypeToc)
    .use(rehypeReact, {
      Fragment: prod.Fragment,
      jsx: prod.jsx,
      jsxs: prod.jsxs,
    } as any)
    .process(md);

  return { content: file.result as ReactNode, toc: (file.data as any).toc ?? [] };
}
