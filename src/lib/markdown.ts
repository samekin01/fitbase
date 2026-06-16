import type { ReactNode } from "react";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeSlug from "rehype-slug";
import rehypeReact from "rehype-react";
import * as prod from "react/jsx-runtime";

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

export async function renderMarkdown(md: string | null): Promise<{ content: ReactNode; toc: TocItem[] }> {
  if (!md) return { content: null, toc: [] };

  const file = await unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkRehype)
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
