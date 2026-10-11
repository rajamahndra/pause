import Link from 'next/link';
import { notFound } from 'next/navigation';
import Markdown from 'react-markdown';
import rehypeSanitize from 'rehype-sanitize';
import { ArrowLeft } from 'lucide-react';
import { getArticle, getArticles } from '@/lib/education';
import { OfflineArticle } from '@/components/pwa';
export function generateStaticParams() {
  return getArticles().map((a) => ({ slug: a.slug }));
}
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const a = getArticle((await params).slug);
  return { title: a?.title ?? 'Bacaan' };
}
export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const a = getArticle((await params).slug);
  if (!a) notFound();
  return (
    <main id="main" className="narrow section education-article-page">
      <Link className="text-link back-link" href="/edukasi">
        <ArrowLeft size={16} /> Ruang belajar
      </Link>
      <span className="eyebrow">{a.category}</span>
      <h1 style={{ margin: '20px 0' }}>{a.title}</h1>
      <p>{a.excerpt}</p>
      <div className="notice">Materi edukasi prototipe; belum ditinjau tenaga profesional.</div>
      <article className="prose">
        <Markdown skipHtml rehypePlugins={[rehypeSanitize]}>
          {a.content}
        </Markdown>
      </article>
      <div className="source-list">
        <h2>Sumber bacaan</h2>
        <p>Sumber diperiksa: {a.sourceCheckedAt}. Pemeriksaan sumber bukan peninjauan klinis.</p>
        <ul>
          {a.sourceUrls.map((url) => (
            <li key={url}>
              <a href={url} target="_blank" rel="noopener noreferrer">
                {new URL(url).hostname.includes('nimh') ? 'National Institute of Mental Health' : 'NHS'} — {new URL(url).pathname.split('/').filter(Boolean).pop()?.replaceAll('-', ' ')}
              </a>
            </li>
          ))}
        </ul>
        <p>Status peninjauan klinis: belum ditinjau. Tidak ada reviewer klinis pada prototipe ini.</p>
      </div>
      <OfflineArticle slug={a.slug} />
      <Link href="/bantuan" className="text-link">
        Buka bantuan sekarang
      </Link>
    </main>
  );
}
