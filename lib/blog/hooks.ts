import { Pool } from 'pg';

export async function createPostForProject(project) {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.warn("DATABASE_URL not set in environment, skipping automated blog post creation for project:", project.title);
    return;
  }
  
  const pool = new Pool({ connectionString: url });
  
  try {
    const checkQuery = `SELECT id FROM posts WHERE slug = $1 LIMIT 1;`;
    const res = await pool.query(checkQuery, [project.blogPostSlug]);

    if (res.rowCount === 0) {
      const insertQuery = `
        INSERT INTO posts (id, slug, title, excerpt, content, "seriesId", status, "authorId", "createdAt", "updatedAt", "publishedAt")
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW(), NOW());
      `;
      // Note: Admin must exist in prod DB for 'admin' id. Wait, let's create a robust id
      const randomId = 'p_' + Math.random().toString(36).substring(2, 10);
      
      await pool.query(insertQuery, [
        randomId,
        project.blogPostSlug,
        `${project.title} Build Log`,
        `Automated placeholder for the ${project.title} project.`,
        `# Coming Soon\n\nThis post is coming soon.`,
        's_portfolio', // Assuming 's_portfolio' exists
        'draft',
        'fa1e0324-4d75-476c-92f1-7f1acbfd61fa' // use admin uuid from the db
      ]);
      console.log(`Created automated blog post entry for ${project.title}`);
    }
  } catch(e) {
    console.error("Failed to automatically create blog post", e);
  } finally {
    pool.end();
  }
}
