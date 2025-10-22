// scripts/seed.ts
import { db } from "../src/lib/db";
import {
  users,
  posts,
  categories,
  postCategories,
  postStats,
  postDrafts,
} from "../src/lib/db/schema/index";
import { hash } from "bcryptjs";

async function seed() {
  console.log("🌱 Starting database seed...");

  try {
    // Clear existing data (be careful in production!)
    console.log("🗑️  Clearing existing data...");
    await db.delete(postCategories);
    await db.delete(postStats);
    await db.delete(posts);
    await db.delete(postDrafts);
    await db.delete(categories);
    await db.delete(users);

    // Hash password for all users
    const hashedPassword = await hash("password123", 12);

    // Insert users
    console.log("👥 Creating users...");
    const [adminUser, editorUser, authorUser] = await db
      .insert(users)
      .values([
        {
          id: "11111111-1111-1111-1111-111111111111",
          email: "admin@blog.com",
          username: "admin",
          passwordHash: hashedPassword,
          name: "Admin User",
          bio: "Platform administrator with full access to all features.",
          role: "admin",
          emailVerified: true,
        },
        {
          id: "22222222-2222-2222-2222-222222222222",
          email: "editor@blog.com",
          username: "editor",
          passwordHash: hashedPassword,
          name: "Editor User",
          bio: "Content editor responsible for reviewing and publishing posts.",
          role: "editor",
          emailVerified: true,
        },
        {
          id: "33333333-3333-3333-3333-333333333333",
          email: "author@blog.com",
          username: "author",
          passwordHash: hashedPassword,
          name: "Author User",
          bio: "Blog content creator and writer.",
          role: "user",
          emailVerified: true,
        },
      ])
      .returning();

    // Insert categories
  console.log(`🔐 Admin account ready: ${adminUser.email}`);

  console.log("📂 Creating categories...");
    const [tech, webDev, js, ts, nextjs] = await db
      .insert(categories)
      .values([
        {
          id: "44444444-4444-4444-4444-444444444444",
          name: "Technology",
          slug: "technology",
          description: "Posts about latest technology trends and innovations",
          color: "#3B82F6",
        },
        {
          id: "55555555-5555-5555-5555-555555555555",
          name: "Web Development",
          slug: "web-development",
          description: "Frontend, backend, and full-stack development topics",
          color: "#10B981",
        },
        {
          id: "66666666-6666-6666-6666-666666666666",
          name: "JavaScript",
          slug: "javascript",
          description: "Everything about JavaScript and its ecosystem",
          color: "#F59E0B",
        },
        {
          id: "77777777-7777-7777-7777-777777777777",
          name: "TypeScript",
          slug: "typescript",
          description: "TypeScript tips, tricks, and best practices",
          color: "#6366F1",
        },
        {
          id: "88888888-8888-8888-8888-888888888888",
          name: "Next.js",
          slug: "nextjs",
          description: "Next.js framework tutorials and guides",
          color: "#000000",
        },
      ])
      .returning();

    // Insert posts
    console.log("📝 Creating posts...");
    const samplePosts = await db
      .insert(posts)
      .values([
        {
          id: "99999999-9999-9999-9999-999999999999",
          authorId: authorUser.id,
          title: "Getting Started with Next.js 15",
          slug: "getting-started-with-nextjs-15",
          content: `# Welcome to Next.js 15\n\nNext.js 15 introduces exciting new features...`,
          excerpt:
            "Learn how to get started with the latest version of Next.js...",
          tags: JSON.stringify(["nextjs", "react", "javascript"]),
          status: "published",
          publishedAt: new Date("2024-01-15"),
          isFeatured: true,
          readTimeMinutes: 5,
        },
        {
          id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
          authorId: editorUser.id,
          title: "TypeScript Best Practices for 2024",
          slug: "typescript-best-practices-2024",
          content: `# TypeScript Best Practices\n\nTypeScript continues to evolve...`,
          excerpt: "Discover the latest TypeScript best practices...",
          tags: JSON.stringify(["typescript", "javascript", "best-practices"]),
          status: "published",
          publishedAt: new Date("2024-01-10"),
          isFeatured: true,
          readTimeMinutes: 8,
        },
        {
          id: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
          authorId: authorUser.id,
          title: "Building a Blog with Drizzle ORM and Next.js",
          slug: "building-blog-with-drizzle-orm-nextjs",
          content: `# Drizzle ORM for Blogging\n\nDrizzle ORM is a fantastic choice...`,
          excerpt: "Learn how to build a modern blogging platform...",
          tags: JSON.stringify(["drizzle", "orm", "nextjs", "database"]),
          status: "draft",
          publishedAt: null,
          isFeatured: false,
          readTimeMinutes: 6,
        },
      ])
      .returning();

    // Insert drafts
    console.log("📝 Creating drafts...");
    await db.insert(postDrafts).values([
      {
        id: "dddddddd-dddd-dddd-dddd-dddddddddddd",
        authorId: authorUser.id,
        title: "Advanced React Patterns in 2025",
        content: `# Advanced React Patterns\n\nExploring the latest patterns...`,
        excerpt: "Deep dive into advanced React patterns for modern applications",
        tags: JSON.stringify(["react", "patterns", "advanced"]),
        categories: JSON.stringify([webDev.id, js.id]),
        metaTitle: "Advanced React Patterns 2025",
        metaDescription: "Learn advanced React patterns and best practices",
      },
      {
        id: "eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee",
        authorId: editorUser.id,
        title: "Database Design Best Practices",
        content: `# Database Design Best Practices\n\nWhen designing databases...`,
        excerpt: "Essential best practices for database design and optimization",
        tags: JSON.stringify(["database", "design", "best-practices"]),
        categories: JSON.stringify([tech.id]),
        metaTitle: "Database Design Best Practices",
        metaDescription: "Comprehensive guide to database design principles",
      },
    ]);

    // Associate posts with categories
    console.log("🔗 Linking posts to categories...");
    await db.insert(postCategories).values([
      { postId: samplePosts[0].id, categoryId: webDev.id },
      { postId: samplePosts[0].id, categoryId: nextjs.id },
      { postId: samplePosts[1].id, categoryId: webDev.id },
  { postId: samplePosts[1].id, categoryId: js.id },
  { postId: samplePosts[1].id, categoryId: ts.id },
      { postId: samplePosts[2].id, categoryId: tech.id },
      { postId: samplePosts[2].id, categoryId: webDev.id },
    ]);

    // Add post statistics
    console.log("📊 Adding post statistics...");
    await db.insert(postStats).values([
      {
        postId: samplePosts[0].id,
        views: 1542,
        likes: 42,
        commentsCount: 8,
        shares: 15,
      },
      {
        postId: samplePosts[1].id,
        views: 2897,
        likes: 87,
        commentsCount: 12,
        shares: 23,
      },
      {
        postId: samplePosts[2].id,
        views: 0,
        likes: 0,
        commentsCount: 0,
        shares: 0,
      },
    ]);

    console.log("✅ Database seeded successfully!");
    console.log(`
📊 Seed Summary:
  👥 Users: 3 (admin, editor, author)
  📂 Categories: 5
  📝 Posts: 3 (2 published, 1 draft)
  📝 Drafts: 2
  🔗 Post-Category relationships: 7
  📊 Post statistics: 3

🔑 Default Login Credentials:
  Admin: admin@blog.com / password123
  Editor: editor@blog.com / password123  
  Author: author@blog.com / password123
    `);
  } catch (error) {
    console.error("❌ Seeding failed:", error);
    throw error;
  }
}

// Run seed if called directly
if (require.main === module) {
  seed()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

export { seed };
