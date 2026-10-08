import { defineCollection, reference } from "astro:content";
import { glob, file } from "astro/loaders";
import { z } from "astro/zod";
import { iconNames } from "./components/atoms/icons";

/** Must be a key of src/components/atoms/icons.ts. */
const iconName = z.enum(iconNames);

const services = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/services" }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      order: z.number(),
      icon: iconName,
      /** Card copy (home, /servicos). */
      summary: z.string(),
      /** Lead under the h1 on the service page. */
      subtitle: z.string(),
      heroImage: image(),
      heroImageAlt: z.string(),
      included: z.array(z.string()),
      steps: z.array(z.object({ title: z.string(), description: z.string() })),
      seo: z.object({
        title: z.string(),
        description: z.string(),
      }),
    }),
});

/**
 * City landing pages served at the site root (e.g. /pintura-predial-canoas-rs). The file name is the URL.
 * Copy must be written for the city, not copied from the service page, so the two don't compete as duplicates.
 */
const localPages = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/local-pages" }),
  schema: ({ image }) =>
    z.object({
      service: reference("services"),
      city: z.string(),
      /** How people search for the service, e.g. "Manutenção Predial" (the service page may be named differently). */
      serviceName: z.string(),
      /** Short name used in breadcrumbs and cross links, e.g. "Pintura Predial em Canoas". */
      title: z.string(),
      h1: z.string(),
      subtitle: z.string(),
      heroImage: image(),
      heroImageAlt: z.string(),
      localFactors: z.object({
        heading: z.string(),
        items: z.array(z.object({ title: z.string(), description: z.string() })),
      }),
      /** A few points about the service, linking to its full page; not the service's `included` list. */
      highlights: z.array(z.string()).max(3),
      neighborhoods: z.array(z.string()),
      faqs: z.array(z.object({ question: z.string(), answer: z.string() })),
      seo: z.object({
        title: z.string(),
        description: z.string(),
      }),
    }),
});

const projects = defineCollection({
  loader: file("src/content/projects.json"),
  schema: ({ image }) =>
    z.object({
      order: z.number(),
      service: reference("services"),
      category: z.string(),
      title: z.string(),
      summary: z.string(),
      image: image(),
      imageAlt: z.string(),
    }),
});

const featuredProjects = defineCollection({
  loader: file("src/content/featured-projects.json"),
  schema: ({ image }) =>
    z.object({
      order: z.number(),
      category: z.string(),
      title: z.string(),
      image: image(),
      imageAlt: z.string(),
    }),
});

const posts = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/posts" }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      category: z.string(),
      publishedAt: z.coerce.date(),
      readingTime: z.string(),
      excerpt: z.string(),
      image: image(),
      imageAlt: z.string(),
      featured: z.boolean().default(false),
    }),
});

const testimonials = defineCollection({
  loader: file("src/content/testimonials.json"),
  schema: z.object({
    order: z.number(),
    rating: z.number().min(1).max(5),
    quote: z.string(),
    name: z.string(),
    role: z.string(),
  }),
});

const faqs = defineCollection({
  loader: file("src/content/faqs.json"),
  schema: z.object({
    order: z.number(),
    question: z.string(),
    answer: z.string(),
  }),
});

const regions = defineCollection({
  loader: file("src/content/regions.json"),
  schema: z.object({
    order: z.number(),
    name: z.string(),
    status: z.string(),
    description: z.string(),
    cities: z.array(z.string()),
  }),
});

export const collections = { services, localPages, projects, featuredProjects, posts, testimonials, faqs, regions };
