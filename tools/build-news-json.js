/**
 * Build /data/news.json from news-*.html files (static site friendly).
 * Extracts:
 * - url: from filename
 * - title: <meta property="og:title"> or <title>
 * - image: <meta property="og:image"> (or og:image:secure_url)
 * - excerpt: meta description or first <p> (kept for future use; carousel can ignore)
 * - date: <meta name="article:published_time" content="YYYY-MM-DD">
 */

const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const outDir = path.join(ROOT, 'data');
const outFile = path.join(outDir, 'news.json');

function readFileSafe(fp) {
  try {
    return fs.readFileSync(fp, 'utf8');
  } catch {
    return '';
  }
}

function pick(html, regex) {
  const m = html.match(regex);
  return m && m[1] ? m[1].trim() : '';
}

function stripTags(s) {
  return (s || '')
    .replace(/<[^>]*>/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function formatDateLabel(iso) {
  // iso: YYYY-MM-DD
  if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return '';
  const [y, m, d] = iso.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
}

// Find all news articles in repo root: news-*.html
const files = fs
  .readdirSync(ROOT)
  .filter((f) => /^news-.*\.html$/i.test(f))
  .map((f) => path.join(ROOT, f));

const items = files.map((fp) => {
  const html = readFileSafe(fp);
  const filename = path.basename(fp);
  const url = `/${filename}`;

  // Title
  const ogTitle = pick(
    html,
    /<meta\s+property=["']og:title["']\s+content=["']([^"']+)["']\s*\/?>/i
  );
  const titleTag = pick(html, /<title>\s*([^<]+)\s*<\/title>/i);
  const title = stripTags(ogTitle || titleTag || filename);

  // Thumbnail image (for carousel)
  const ogImage =
    pick(
      html,
      /<meta\s+property=["']og:image["']\s+content=["']([^"']+)["']\s*\/?>/i
    ) ||
    pick(
      html,
      /<meta\s+property=["']og:image:secure_url["']\s+content=["']([^"']+)["']\s*\/?>/i
    );

  // Published date (YYYY-MM-DD)
  const dateIso =
    pick(
      html,
      /<meta\s+name=["']article:published_time["']\s+content=["'](\d{4}-\d{2}-\d{2})["']\s*\/?>/i
    ) ||
    pick(
      html,
      /<meta\s+property=["']article:published_time["']\s+content=["'](\d{4}-\d{2}-\d{2})["']\s*\/?>/i
    );

  // Excerpt (optional)
  const desc =
    pick(
      html,
      /<meta\s+name=["']description["']\s+content=["']([^"']+)["']\s*\/?>/i
    ) || stripTags(pick(html, /<p[^>]*>([\s\S]*?)<\/p>/i));

  return {
    url,
    title,
    image: ogImage || '',
    excerpt: desc ? stripTags(desc).slice(0, 180) : '',
    date: dateIso || '',
    dateLabel: formatDateLabel(dateIso || '')
  };
});

// Sort newest first (empty dates drop to bottom)
items.sort((a, b) => (b.date || '').localeCompare(a.date || ''));

if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(outFile, JSON.stringify(items, null, 2), 'utf8');

console.log(`Wrote ${outFile} (${items.length} items)`);
