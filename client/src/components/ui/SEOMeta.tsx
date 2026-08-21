import { useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { generateMovieMeta, generateTVMeta, generateCelebrityMeta, generatePageMeta } from '../../lib/seo';

interface SEOMetaProps {
  type?: 'movie' | 'tv' | 'celebrity' | 'page';
  data?: any;
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: 'website' | 'article' | 'profile' | 'video.movie' | 'video.tv_show';
  publishedTime?: string;
  modifiedTime?: string;
  author?: string;
  section?: string;
  tags?: string[];
}

export default function SEOMeta({
  type = 'page',
  data,
  title,
  description,
  image,
  url,
  type: pageType = 'website',
  publishedTime,
  modifiedTime,
  author,
  section,
  tags,
}: SEOMetaProps) {
  const baseUrl = import.meta.env.VITE_APP_URL || window.location.origin;
  const canonicalUrl = url || window.location.href;

  const getMeta = () => {
    switch (type) {
      case 'movie':
        return data ? generateMovieMeta(data, baseUrl) : generatePageMeta(title, description, image, canonicalUrl, pageType);
      case 'tv':
        return data ? generateTVMeta(data, baseUrl) : generatePageMeta(title, description, image, canonicalUrl, pageType);
      case 'celebrity':
        return data ? generateCelebrityMeta(data, baseUrl) : generatePageMeta(title, description, image, canonicalUrl, pageType);
      default:
        return generatePageMeta(title, description, image, canonicalUrl, pageType, publishedTime, modifiedTime, author, tags);
    }
  };

  const meta = getMeta();

  return (
    <Helmet>
      <title>{meta.title}</title>
      <meta name="description" content={meta.description} />
      <meta property="og:title" content={meta.ogTitle || meta.title} />
      <meta property="og:description" content={meta.ogDescription || meta.description} />
      <meta property="og:image" content={meta.ogImage || ''} />
      <meta property="og:type" content={meta.ogType || 'website'} />
      <meta property="og:url" content={meta.ogUrl || meta.canonicalUrl || ''} />
      <meta name="twitter:card" content={meta.twitterCard || 'summary_large_image'} />
      <meta name="twitter:title" content={meta.twitterTitle || meta.title} />
      <meta name="twitter:description" content={meta.twitterDescription || meta.description} />
      <meta name="twitter:image" content={meta.twitterImage || meta.ogImage || ''} />
      <link rel="canonical" href={meta.canonicalUrl || meta.ogUrl || ''} />
      {meta.publishedTime && <meta property="article:published_time" content={meta.publishedTime} />}
      {meta.modifiedTime && <meta property="article:modified_time" content={meta.modifiedTime} />}
      {meta.author && <meta name="author" content={meta.author} />}
      {meta.section && <meta property="article:section" content={meta.section} />}
      {meta.tags?.map((tag, i) => <meta key={i} property="article:tag" content={tag} />)}
    </Helmet>
  );
}

export default SEOMeta;