import pool from '../config/database.js';

const CACHE_TTL = 3600000; // 1 hour
let sitemapCache = null;
let sitemapCacheTime = 0;

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function slug(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

export async function sitemapXml(req, res) {
  try {
    const now = Date.now();
    
    // Return cached if valid
    if (sitemapCache && now - sitemapCacheTime < CACHE_TTL) {
      res.set('Content-Type', 'application/xml');
      res.set('Cache-Control', 'public, max-age=3600');
      return res.send(sitemapCache);
    }

    const baseUrl = process.env.APP_URL || 'https://nova-flix.com.ng';
    const tmdb = req.app.locals.tmdb;
    const urls = [];

    // Static pages
    const staticPages = [
      { url: baseUrl, changefreq: 'daily', priority: 1.0 },
      { url: `${baseUrl}/home`, changefreq: 'daily', priority: 0.9 },
      { url: `${baseUrl}/search`, changefreq: 'weekly', priority: 0.8 },
      { url: `${baseUrl}/tv-shows`, changefreq: 'weekly', priority: 0.8 },
      { url: `${baseUrl}/discover`, changefreq: 'weekly', priority: 0.7 },
      { url: `${baseUrl}/hooks`, changefreq: 'daily', priority: 0.9 },
      { url: `${baseUrl}/creators`, changefreq: 'weekly', priority: 0.7 },
      { url: `${baseUrl}/live-events`, changefreq: 'daily', priority: 0.8 },
      { url: `${baseUrl}/news`, changefreq: 'hourly', priority: 0.8 },
      { url: `${baseUrl}/archive`, changefreq: 'weekly', priority: 0.6 },
      { url: `${baseUrl}/trivia`, changefreq: 'daily', priority: 0.6 },
      { url: `${baseUrl}/forum`, changefreq: 'daily', priority: 0.6 },
      { url: `${baseUrl}/pricing`, changefreq: 'monthly', priority: 0.5 },
    ];

    for (const page of staticPages) {
      urls.push(page);
    }

    // Dynamic movie pages from TMDB trending + popular
    if (tmdb) {
      try {
        const [movieTrending, moviePopular, tvTrending, tvPopular] = await Promise.allSettled([
          tmdb.get('/trending/movie/week', { params: { language: 'en-US' } }),
          tmdb.get('/movie/popular', { params: { language: 'en-US', page: 1 } }),
          tmdb.get('/trending/tv/week', { params: { language: 'en-US' } }),
          tmdb.get('/tv/popular', { params: { language: 'en-US', page: 1 } }),
        ]);

        const movies = [
          ...(movieTrending.status === 'fulfilled' ? movieTrending.value.data.results || [] : []),
          ...(moviePopular.status === 'fulfilled' ? moviePopular.value.data.results || [] : []),
        ];

        const uniqueMovies = new Map();
        for (const movie of movies) {
          if (movie.id && !uniqueMovies.has(movie.id)) {
            uniqueMovies.set(movie.id, movie);
          }
        }

        for (const movie of Array.from(uniqueMovies.values()).slice(0, 1000)) {
          urls.push({
            url: `${baseUrl}/movie/${movie.id}`,
            lastmod: movie.release_date || new Date().toISOString().split('T')[0],
            changefreq: 'weekly',
            priority: 0.8,
          });
        }

        const tvShows = [
          ...(tvTrending.status === 'fulfilled' ? tvTrending.value.data.results || [] : []),
          ...(tvPopular.status === 'fulfilled' ? tvPopular.value.data.results || [] : []),
        ];

        const uniqueTv = new Map();
        for (const tv of tvShows) {
          if (tv.id && !uniqueTv.has(tv.id)) {
            uniqueTv.set(tv.id, tv);
          }
        }

        for (const tv of Array.from(uniqueTv.values()).slice(0, 500)) {
          urls.push({
            url: `${baseUrl}/tv/${tv.id}`,
            lastmod: tv.first_air_date || new Date().toISOString().split('T')[0],
            changefreq: 'weekly',
            priority: 0.8,
          });
        }
      } catch (err) {
        console.error('[sitemap] TMDB fetch error:', err.message);
      }
    }

    // Creator profiles from database
    try {
      const { rows: creators } = await pool.query(
        `SELECT u.id, u.name FROM users u 
         JOIN creator_profiles cp ON cp.user_id = u.id 
         WHERE u.role = 'creator' AND cp.tmdb_person_id IS NOT NULL`
      );

      for (const creator of creators) {
        urls.push({
          url: `${baseUrl}/profile/${creator.id}`,
          changefreq: 'daily',
          priority: 0.7,
        });
      }
    } catch (err) {
      console.error('[sitemap] Creator fetch error:', err.message);
    }

    // Generate XML
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls.map(u => `  <url>
    <loc>${u.url}</loc>
    ${u.lastmod ? `    <lastmod>${u.lastmod}</lastmod>` : ''}
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`).join('\n')}
</urlset>`;

    // Cache the result
    sitemapCache = xml;
    sitemapCacheTime = now;

    res.set('Content-Type', 'application/xml');
    res.set('Cache-Control', 'public, max-age=3600');
    res.send(xml);
  } catch (err) {
    console.error('[sitemap] Error:', err.message);
    res.status(500).send('<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>');
  }
}

export async function robotsTxt(req, res) {
  try {
    const baseUrl = process.env.APP_URL || 'https://nova-flix.com.ng';
    const robots = `User-agent: *
Allow: /

Sitemap: ${baseUrl}/sitemap.xml
`;
    res.set('Content-Type', 'text/plain');
    res.set('Cache-Control', 'public, max-age=86400');
    res.send(robots);
  } catch (err) {
    res.status(500).send('User-agent: *\nAllow: /\n');
  }
}