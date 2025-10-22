// src/lib/utils/slugify.ts

/**
 * Converts a string into a URL-friendly slug
 * Example: "Hello World!" => "hello-world"
 */
export const slugify = (text: string): string => {
  return text
    .toString() // Ensure string
    .normalize("NFD") // Decompose accented characters
    .replace(/[\u0300-\u036f]/g, "") // Remove diacritics
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "") // Remove invalid chars
    .replace(/\s+/g, "-") // Replace spaces with -
    .replace(/-+/g, "-"); // Collapse multiple -
};
