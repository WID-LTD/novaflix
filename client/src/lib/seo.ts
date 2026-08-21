export interface SEOMeta {
  title: string;
  description: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  ogType?: string;
  ogUrl?: string;
  twitterCard?: string;
  twitterTitle?: string;
  twitterDescription?: string;
  twitterImage?: string;
  canonicalUrl?: string;
  publishedTime?: string;
  modifiedTime?: string;
  author?: string;
  section?: string;
  tags?: string[];
}

export function generateMovieMeta(movie: any, baseUrl: string = ''): SEOMeta {
  const url = `${baseUrl}/movie/${movie.id}`;
  const image = movie.backdrop || movie.poster;
  const description = movie.overview?.slice(0, 160) || `Watch ${movie.title} on NovaFlix`;

  return {
    title: `${movie.title} (${movie.year || new Date(movie.release_date)?.getFullYear() || ''}) | NovaFlix`,
    description,
    ogTitle: movie.title,
    ogDescription: description,
    ogImage: image,
    ogType: 'video.movie',
    ogUrl: url,
    twitterCard: 'summary_large_image',
    twitterTitle: movie.title,
    twitterDescription: description,
    twitterImage: image,
    canonicalUrl: url,
    publishedTime: movie.release_date,
    section: 'Movies',
    tags: movie.genres?.map(g => g.name) || [],
  };
}

export function generateTVMeta(tv: any, baseUrl: string = ''): SEOMeta {
  const url = `${baseUrl}/tv/${tv.id}`;
  const image = tv.backdrop || tv.poster;
  const description = tv.overview?.slice(0, 160) || `Watch ${tv.name} on NovaFlix`;

  return {
    title: `${tv.name} (${tv.first_air_date?.split('-')[0] || ''}) | NovaFlix`,
    description,
    ogTitle: tv.name,
    ogDescription: description,
    ogImage: image,
    ogType: 'video.tv_show',
    ogUrl: url,
    twitterCard: 'summary_large_image',
    twitterTitle: tv.name,
    twitterDescription: description,
    twitterImage: image,
    canonicalUrl: url,
    publishedTime: tv.first_air_date,
    section: 'TV Shows',
    tags: tv.genres?.map(g => g.name) || [],
  };
}

export function generateCelebrityMeta(celebrity: any, baseUrl: string = ''): SEOMeta {
  const url = `${baseUrl}/profile/${celebrity.id}`;
  const description = celebrity.bio?.slice(0, 160) || `Discover ${celebrity.name}'s filmography on NovaFlix`;

  return {
    title: `${celebrity.name} | NovaFlix`,
    description,
    ogTitle: celebrity.name,
    ogDescription: description,
    ogImage: celebrity.avatar,
    ogType: 'profile',
    ogUrl: url,
    twitterCard: 'summary_large_image',
    twitterTitle: celebrity.name,
    twitterDescription: description,
    twitterImage: celebrity.avatar,
    canonicalUrl: url,
    author: celebrity.name,
    section: 'Creators',
  };
}

export function generatePageMeta(title: string, description: string, image: string, url: string, type: string = 'website'): SEOMeta {
  return {
    title: `${title} | NovaFlix`,
    description: description.slice(0, 160),
    ogTitle: title,
    ogDescription: description.slice(0, 160),
    ogImage: image,
    ogType: type,
    ogUrl: url,
    twitterCard: 'summary_large_image',
    twitterTitle: title,
    twitterDescription: description.slice(0, 160),
    twitterImage: image,
    canonicalUrl: url,
  };
}

export function renderMetaTags(meta: SEOMeta): string {
  const tags = [
    `<title>${escapeHtml(meta.title)}</title>`,
    `<meta name="description" content="${escapeHtml(meta.description)}" />`,
    `<meta property="og:title" content="${escapeHtml(meta.ogTitle || meta.title)}" />`,
    `<meta property="og:description" content="${escapeHtml(meta.ogDescription || meta.description)}" />`,
    `<meta property="og:image" content="${escapeHtml(meta.ogImage || '')}" />`,
    `<meta property="og:type" content="${escapeHtml(meta.ogType || 'website')}" />`,
    `<meta property="og:url" content="${escapeHtml(meta.ogUrl || meta.canonicalUrl || '')}" />`,
    `<meta name="twitter:card" content="${escapeHtml(meta.twitterCard || 'summary_large_image')}" />`,
    `<meta name="twitter:title" content="${escapeHtml(meta.twitterTitle || meta.title)}" />`,
    `<meta name="twitter:description" content="${escapeHtml(meta.twitterDescription || meta.description)}" />`,
    `<meta name="twitter:image" content="${escapeHtml(meta.twitterImage || meta.ogImage || '')}" />`,
    `<link rel="canonical" href="${escapeHtml(meta.canonicalUrl || meta.ogUrl || '')}" />`,
  ];

  if (meta.publishedTime) {
    tags.push(`<meta property="article:published_time" content="${escapeHtml(meta.publishedTime)}" />`);
  }
  if (meta.modifiedTime) {
    tags.push(`<meta property="article:modified_time" content="${escapeHtml(meta.modifiedTime)}" />`);
  }
  if (meta.author) {
    tags.push(`<meta name="author" content="${escapeHtml(meta.author)}" />`);
  }
  if (meta.section) {
    tags.push(`<meta property="article:section" content="${escapeHtml(meta.section)}" />`);
  }
  if (meta.tags?.length) {
    meta.tags.forEach(tag => {
      tags.push(`<meta property="article:tag" content="${escapeHtml(tag)}" />`);
    });
  }

  return tags.join('\n');
}

function escapeHtml(text: string): string {
  return String(text)
    .replace(/&/g, '&')
    .replace(/</g, '<')
    .replace(/>/g, '>')
    .replace(/"/g, '"')
    .replace(/'/g, '&#039;');
}