'use client';
import Link from 'next/link';
import { useState } from 'react';
import { Search, ArrowUpRight } from 'lucide-react';
import type { Article } from '@/lib/education';
export function EducationList({ articles }: { articles: Omit<Article, 'content'>[] }) {
  const [q, setQ] = useState('');
  const [category, setCategory] = useState('Semua');
  const categories = ['Semua', ...new Set(articles.map((a) => a.category))];
  const filtered = articles.filter((a) => (category === 'Semua' || a.category === category) && a.title.toLowerCase().includes(q.toLowerCase()));
  return (
    <>
      <div className="field">
        <label htmlFor="search">Temukan bacaan</label>
        <div className="search-box">
          <Search size={18} />
          <input id="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cari judul yang ingin kamu pahami…" maxLength={100} />
        </div>
      </div>
      <div className="category-tabs" aria-label="Kategori bacaan">
        {categories.map((c) => (
          <button className={'chip' + (category === c ? ' active' : '')} aria-pressed={category === c} key={c} onClick={() => setCategory(c)}>
            {c}
          </button>
        ))}
      </div>
      <div className="article-list">
        {filtered.map((a) => (
          <Link className="article-preview" key={a.slug} href={'/edukasi/' + a.slug}>
            <span className="eyebrow">{a.category}</span>
            <h3>{a.title}</h3>
            <p>{a.excerpt}</p>
            <span className="text-link">
              Baca perlahan <ArrowUpRight size={17} />
            </span>
          </Link>
        ))}
      </div>
      {!filtered.length && (
        <div className="empty-state">
          <h2>Belum menemukan bacaan.</h2>
          <p>Coba kata lain atau pilih semua kategori.</p>
        </div>
      )}
    </>
  );
}
