import { randomUUID } from "node:crypto";

import pg from "pg";

import { SEEDED_DOC } from "./fixtures";

const { savedWord, savedMeaning, savedMeaningEn, unsavedWord } = SEEDED_DOC;

// The saved word opens a paragraph so a test can hover a highlight at the left edge.
export const ARTICLE_HTML = `
<p>${savedWord[0].toUpperCase()}${savedWord.slice(1)} operations can be retried safely. An ${savedWord} PUT request leaves the same state no matter how often it runs.</p>
<p>Batching requests raises ${unsavedWord}, but only when the server stays ${savedWord} under retries.</p>
<pre><code>PUT /orders/42  # ${savedWord} by design</code></pre>
`.trim();

/** Replaces the e2e user's rows with one document and one saved word. */
export async function seedDatabase(dbUrl: string, user: Readonly<{ id: string; email: string }>) {
  const db = new pg.Client({ connectionString: dbUrl });
  await db.connect();

  try {
    await db.query("BEGIN");
    // Documents and vocabulary cascade from the user row.
    await db.query(`DELETE FROM "User" WHERE email = $1 OR id = $2`, [user.email, user.id]);
    await db.query(`INSERT INTO "User" (id, email, "updatedAt") VALUES ($1, $2, now())`, [user.id, user.email]);

    const docId = randomUUID();
    await db.query(
      `INSERT INTO "Doc" (id, "userId", title, "sourceUrl", "siteName", "updatedAt") VALUES ($1, $2, $3, $4, $5, now())`,
      [docId, user.id, SEEDED_DOC.title, SEEDED_DOC.sourceUrl, "E2E Example"],
    );
    await db.query(
      `INSERT INTO "DocContent" (id, "docId", "htmlContent", "textContent", "wordCount") VALUES ($1, $2, $3, $4, $5)`,
      [randomUUID(), docId, ARTICLE_HTML, ARTICLE_HTML.replace(/<[^>]+>/g, " "), 40],
    );
    await db.query(
      `INSERT INTO "Vocabulary" (id, "userId", "docId", "sourceUrl", word, meaning, "meaningEn", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, $6, $7, now())`,
      [randomUUID(), user.id, docId, SEEDED_DOC.sourceUrl, savedWord, savedMeaning, savedMeaningEn],
    );
    await db.query("COMMIT");

    return { docId };
  } catch (error) {
    await db.query("ROLLBACK");
    throw error;
  } finally {
    await db.end();
  }
}

/** Removes one saved word, so a test that saves it starts clean on every attempt. */
export async function deleteVocabulary(dbUrl: string, userId: string, word: string) {
  const db = new pg.Client({ connectionString: dbUrl });
  await db.connect();
  try {
    await db.query(`DELETE FROM "Vocabulary" WHERE "userId" = $1 AND lower(word) = lower($2)`, [userId, word]);
  } finally {
    await db.end();
  }
}
