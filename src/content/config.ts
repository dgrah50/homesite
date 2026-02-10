import { z, defineCollection } from "astro:content";
import { glob } from "astro/loaders";

const projectCollection = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/projects" }),
  schema: z.object({
    title: z.string(),
    pubDate: z.date(),
    description: z.string(),
  }),
});

const thoughtsCollection = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/thoughts" }),
  schema: z.object({
    title: z.string(),
    pubDate: z.date(),
    description: z.string(),
  }),
});

export const collections = {
  projects: projectCollection,
  thoughts: thoughtsCollection,
};
