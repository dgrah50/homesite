import { z, defineCollection } from "astro:content";

// 2. Define a `type` and `schema` for each collection
const projectCollection = defineCollection({
  type: "content", // v2.5.0 and later
  schema: z.object({
    title: z.string(),
    tags: z.array(z.string()),
    image: z.string().optional(),
  }),
});

export const collections = { project: projectCollection };
