import { defineConfig } from "astro/config";
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";

import { loadMarkdowns } from "./load-md";

import tailwind from "@astrojs/tailwind";

export default defineConfig({
  site: "https://anyrobert.github.io",
  base: "blog",
  integrations: [mdx(), sitemap(), tailwind()],
  vite: {
    define: {
      MD_SOURCE: JSON.stringify(process.env.MD_SOURCE || "local"),
    },
    integrations: [
      {
        name: "dynamic-markdown-loader",
        hooks: {
          "astro:config:setup": async ({ injectRoute }) => {
            const markdownConfig = MarkdownSourceSchema.parse({
              source: import.meta.env.MARKDOWN_SOURCE,
              localPath: import.meta.env.LOCAL_MARKDOWN_PATH,
              githubRepoUrl: import.meta.env.REPO_URL,
              githubToken: import.meta.env.PAT,
            });

            const markdowns = await loadMarkdowns(markdownConfig);

            markdowns.forEach((markdown) => {
              injectRoute({
                pattern: `/blog/${markdown.slug}`,
                entrypoint: "src/pages/blog/[slug].astro",
                prerender: true,
                params: {
                  slug: markdown.slug,
                  content: markdown.content,
                },
              });
            });
          },
        },
      },
    ],
  },
});
