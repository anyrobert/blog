import { z } from "zod";
import axios from "axios";
import path from "node:path";
import fs from "node:fs";
import { parse } from "yaml";

const MarkdownSourceSchema = z.object({
  source: z.enum(["local", "remote", "both"]).default("local"),
  localPath: z.string(),
  githubRepoUrl: z.string().url(),
  githubToken: z.string().optional(),
});

export async function loadMarkdowns(
  config: z.infer<typeof MarkdownSourceSchema>
) {
  let markdowns: Array<{
    slug: string;
    content: string;
    frontmatter?: Record<string, any>;
  }> = [];

  if (config.source === "local" || config.source === "both") {
    const localMarkdowns = await fetchLocalMarkdowns(config.localPath);
    markdowns.push(...localMarkdowns);
  }

  if (config.source === "remote" || config.source === "both") {
    const remoteMarkdowns = await fetchGitHubMarkdowns(
      config.githubRepoUrl,
      config.githubToken
    );
    markdowns.push(...remoteMarkdowns);
  }

  return markdowns;
}

async function fetchLocalMarkdowns(localPath: string) {
  try {
    const files = fs
      .readdirSync(localPath)
      .filter((file) => file.endsWith(".md"));

    const contents = await Promise.all(
      files.map(async (file) => {
        const fullPath = path.join(localPath, file);
        const content = fs.readFileSync(fullPath, "utf-8");

        const frontmatter = content.match(/^---\n([\s\S]*)\n---/);

        return {
          slug: file.replace(".md", ""),
          content: content.replace(frontmatter?.[0] || "", ""),
          frontmatter: parse(frontmatter?.[1]?.trim() || ""),
        };
      })
    );

    return contents;
  } catch (error) {
    console.error("Erro ao carregar Markdowns locais:", error);
    return [];
  }
}

async function fetchGitHubMarkdowns(repoUrl: string, token?: string) {
  try {
    const headers = token ? { Authorization: `token ${token}` } : {};

    const response = await axios.get(repoUrl, { headers });

    const markdownFiles = response.data.tree.filter(
      (file: any) => file.path.endsWith(".md") && file.path.startsWith("Blog/")
    );

    console.log(markdownFiles);

    const mdContents = await Promise.all(
      markdownFiles.map(async (file: any) => {
        const fileResponse = await axios.get(file.url, { headers });
        const decodedContent = Buffer.from(
          fileResponse.data.content,
          "base64"
        ).toString("utf-8");

        const frontmatter = decodedContent.match(/^---\n([\s\S]*)\n---/);

        return {
          slug: file.path.replace(".md", "").replace("Blog/", ""),
          content: decodedContent.replace(frontmatter?.[0] || "", ""),
          frontmatter: parse(frontmatter?.[1]?.trim() || ""),
        };
      })
    );

    return mdContents;
  } catch (error) {
    console.error("Erro ao buscar Markdowns do GitHub:", error);
    return [];
  }
}
