import rss from "@astrojs/rss";

import { SITE_TITLE, SITE_DESCRIPTION } from "../consts";
import { loadMarkdowns } from "../utils/markdown";

export async function GET(context) {
  const markdowns = await loadMarkdowns({
    source: import.meta.env.MARKDOWN_SOURCE || "local",
    localPath: import.meta.env.LOCAL_MARKDOWN_PATH,
    githubRepoUrl: import.meta.env.GITHUB_REPO_URL || "",
    githubToken: import.meta.env.GITHUB_TOKEN,
  });

  return rss({
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    site: context.site,
    items: markdowns.map((markdown) => ({
      link: `/blog/${markdown.slug}/`,
    })),
  });
}
