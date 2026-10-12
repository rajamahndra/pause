import 'server-only';
import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';
export type Article = {
  slug: string;
  title: string;
  category: string;
  excerpt: string;
  sourceUrls: string[];
  sourceCheckedAt: string;
  clinicalReviewStatus: string;
  clinicalReviewedAt: string | null;
  clinicalReviewer: string | null;
  content: string;
};
export function getArticles(): Article[] {
  return fs
    .readdirSync(path.join(process.cwd(), 'content/education'))
    .filter((f) => f.endsWith('.md'))
    .map((f) => {
      const { data, content } = matter(fs.readFileSync(path.join(process.cwd(), 'content/education', f), 'utf8'));
      return { ...data, content } as Article;
    });
}
export function getArticle(slug: string) {
  return getArticles().find((a) => a.slug === slug);
}
