/**
 * The ADMIN half of the "articles" plugin — real React this time.
 *
 * This is a separate module from the server half (articles.ts). The browser
 * bundle imports THIS; the Node server imports articles.ts. Neither pulls in
 * the other's dependencies — the server/admin split in action.
 *
 * It still declares the same DATA shape (menu + components + routes); the only
 * change from the HTML version is that components are React components.
 */

import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import { InjectionZone } from '../client/injection.js';
import { Table, TextInput } from '../design-system/index.js';
import type { AdminPlugin } from '../client/types.js';

const API = 'http://localhost:1337';

interface Article {
  id: number;
  title: string;
}

/** A reusable UI component (registered into the app's component library). */
function ArticleCard({ id, title }: { id: number; title: string }) {
  return (
    <div style={{ border: '1px solid #ddd', borderRadius: 8, padding: 12, marginBottom: 8 }}>
      <strong>#{id}</strong> <Link to={`/articles/${id}`}>{title}</Link>
      <p>MuhammedNur Damlahi</p>
    </div>
  );
}

/** List page — fetches all articles, filters them, and shows them in a Table. */
function ArticlesPage() {
  const [articles, setArticles] = useState<Article[] | null>(null);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    fetch(`${API}/articles`)
      .then((r) => r.json())
      .then(setArticles);
  }, []);

  if (!articles) return <p>Loading…</p>;

  const visible = articles.filter((a) => a.title.toLowerCase().includes(filter.toLowerCase()));

  return (
    <div>
      <h1>Articles</h1>

      {/* All from the shared design-system. The filter input selects its text
          on keyboard focus — the behaviour contributed upstream to Strapi. */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, alignItems: 'center' }}>
        <TextInput
          placeholder="Filter by title…"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        />
        {/* Other plugins can add components (e.g. an Export button) right here,
            without this file knowing about them. */}
        <InjectionZone name="articles.list.actions" />
      </div>

      <Table<Article>
        columns={[
          { key: 'id', header: 'ID' },
          {
            key: 'title',
            header: 'Title',
            render: (a) => <Link to={`/articles/${a.id}`}>{a.title}</Link>,
          },
        ]}
        rows={visible}
      />
    </div>
  );
}

/** Detail page — reads the :id route param and fetches that one article. */
function ArticleDetailPage() {
  const { id } = useParams();
  const [article, setArticle] = useState<Article | { error: string } | null>(null);

  useEffect(() => {
    fetch(`${API}/articles/${id}`)
      .then((r) => r.json())
      .then(setArticle);
  }, [id]);

  if (!article) return <p>Loading…</p>;
  if ('error' in article) return <p>Not found.</p>;

  return (
    <div>
      <h1>{article.title}</h1>
      <p>Article #{article.id}</p>
      <Link to="/articles">← Back</Link>
    </div>
  );
}

const articlesAdmin: AdminPlugin = {
  name: 'articles',
  menu: [{ to: '/articles', label: 'Articles' }],
  components: { ArticleCard },
  routes: [
    { path: '/articles', component: ArticlesPage },
    { path: '/articles/:id', component: ArticleDetailPage },
  ],
};

export default articlesAdmin;
