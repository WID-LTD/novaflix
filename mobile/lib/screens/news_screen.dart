import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:intl/intl.dart';
import '../theme/app_colors.dart';
import '../theme/app_typography.dart';
import '../services/api_service.dart';
import '../widgets/ui/index.dart';

const _categories = [
  ('Movies', 'movies'),
  ('Entertainment', 'entertainment'),
  ('Technology', 'technology'),
  ('Business', 'business'),
  ('Sports', 'sports'),
  ('Top Stories', null),
];

final _categoryIndexProvider = StateProvider<int>((ref) => 0);

final _homeProvider = FutureProvider<List<Map<String, dynamic>>>((ref) async {
  final api = ref.read(apiServiceProvider);
  final res = await api.getHomeNews();
  final articles = res.data['articles'] as List? ?? [];
  return articles.cast<Map<String, dynamic>>();
});

final _articlesProvider = FutureProvider<List<Map<String, dynamic>>>((
  ref,
) async {
  final api = ref.read(apiServiceProvider);
  final category = _categories[ref.watch(_categoryIndexProvider)].$2;
  final res = await api.getNews(category: category);
  final articles = res.data['articles'] as List? ?? [];
  return articles.cast<Map<String, dynamic>>();
});

class NewsScreen extends ConsumerWidget {
  final String? articleUrl;

  const NewsScreen({super.key, this.articleUrl});

  Future<void> _refresh(WidgetRef ref) async {
    ref.invalidate(_homeProvider);
    ref.invalidate(_articlesProvider);
    await Future.wait([
      ref.read(_homeProvider.future).then((_) {}, onError: (Object _) {}),
      ref.read(_articlesProvider.future).then((_) {}, onError: (Object _) {}),
    ]);
  }

  String _formatDate(String? raw) {
    if (raw == null) return '';
    final dt = DateTime.tryParse(raw);
    if (dt == null) return '';
    return DateFormat('MMM d, yyyy').format(dt.toLocal());
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    if (articleUrl != null) {
      return _ArticleReader(articleUrl: articleUrl!);
    }
    final latest = ref.watch(_homeProvider);
    final articles = ref.watch(_articlesProvider);
    final activeTab = ref.watch(_categoryIndexProvider);

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(title: const Text('News')),
      body: latest.when(
        loading: () => const LoadingSpinner(logo: true),
        error: (e, _) => Center(
          child: Text(
            'Error: $e',
            style: const TextStyle(color: AppColors.error),
          ),
        ),
        data: (featured) => articles.when(
          loading: () => const LoadingSpinner(logo: true),
          error: (e, _) => Center(
            child: Text(
              'Error: $e',
              style: const TextStyle(color: AppColors.error),
            ),
          ),
          data: (items) => RefreshIndicator(
            onRefresh: () => _refresh(ref),
            child: featured.isEmpty && items.isEmpty
                ? LayoutBuilder(
                    builder: (context, constraints) => ListView(
                      physics: const AlwaysScrollableScrollPhysics(),
                      children: [
                        SizedBox(
                          height: constraints.maxHeight,
                          child: Center(
                            child: Column(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Icon(
                                  Icons.newspaper_outlined,
                                  size: 64,
                                  color: AppColors.onSurfaceVariant,
                                ),
                                SizedBox(height: 16),
                                Text(
                                  'No news right now',
                                  style: AppTypography.bodyMd.copyWith(
                                    color: AppColors.onSurfaceVariant,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                      ],
                    ),
                  )
                : ListView(
                    physics: const AlwaysScrollableScrollPhysics(),
                    padding: const EdgeInsets.only(bottom: 32),
                    children: [
                      if (featured.isNotEmpty) ...[
                        const _SectionTitle('Latest News'),
                        SizedBox(
                          height: 210,
                          child: ListView.separated(
                            scrollDirection: Axis.horizontal,
                            padding: const EdgeInsets.symmetric(horizontal: 16),
                            itemCount: featured.length,
                            separatorBuilder: (_, __) =>
                                const SizedBox(width: 12),
                            itemBuilder: (_, i) => _FeaturedArticleCard(
                              article: featured[i],
                              source: featured[i]['source']?.toString() ?? '',
                              publishedAt: _formatDate(
                                featured[i]['publishedAt']?.toString(),
                              ),
                            ),
                          ),
                        ),
                      ],
                      const _SectionTitle('Categories'),
                      Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 16),
                        child: AppTabs(
                          tabs: _categories.map((c) => c.$1).toList(),
                          activeIndex: activeTab,
                          onChanged: (i) =>
                              ref.read(_categoryIndexProvider.notifier).state =
                                  i,
                          scrollable: true,
                        ),
                      ),
                      const _SectionTitle('Articles'),
                      ...items.map(
                        (a) => _ArticleCard(
                          article: a,
                          title: a['title']?.toString() ?? '',
                          description: a['description']?.toString(),
                          source: a['source']?.toString() ?? '',
                          publishedAt: _formatDate(
                            a['publishedAt']?.toString(),
                          ),
                          url: a['url']?.toString() ?? '',
                        ),
                      ),
                    ],
                  ),
          ),
        ),
      ),
    );
  }
}

class _SectionTitle extends StatelessWidget {
  final String title;
  const _SectionTitle(this.title);

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 20, 16, 12),
      child: Text(
        title,
        style: AppTypography.headlineSm.copyWith(color: AppColors.onSurface),
      ),
    );
  }
}

class _ArticleImage extends StatelessWidget {
  final String? imageUrl;
  final double size;
  final double? borderRadius;

  const _ArticleImage({
    required this.imageUrl,
    this.size = 64,
    this.borderRadius,
  });

  @override
  Widget build(BuildContext context) {
    final child = imageUrl != null && imageUrl!.isNotEmpty
        ? CachedNetworkImage(
            imageUrl: imageUrl!,
            fit: BoxFit.cover,
            placeholder: (_, __) =>
                _ImageFallback(size: size, borderRadius: borderRadius),
            errorWidget: (_, __, ___) =>
                _ImageFallback(size: size, borderRadius: borderRadius),
          )
        : _ImageFallback(size: size, borderRadius: borderRadius);

    return ClipRRect(
      borderRadius: BorderRadius.circular(borderRadius ?? 8),
      child: child,
    );
  }
}

class _ImageFallback extends StatelessWidget {
  final double size;
  final double? borderRadius;

  const _ImageFallback({this.size = 64, this.borderRadius});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: size,
      height: size,
      color: AppColors.surfaceContainerHighest,
      child: const Center(
        child: Icon(
          Icons.image_not_supported_outlined,
          size: 22,
          color: AppColors.onSurfaceVariant,
        ),
      ),
    );
  }
}

class _FeaturedArticleCard extends StatelessWidget {
  final Map<String, dynamic> article;
  final String source;
  final String publishedAt;

  const _FeaturedArticleCard({
    required this.article,
    required this.source,
    required this.publishedAt,
  });

  @override
  Widget build(BuildContext context) {
    final url = article['url']?.toString() ?? '';
    final title = article['title']?.toString() ?? '';
    final imageUrl = article['image']?.toString();
    final hasImage = imageUrl != null && imageUrl.isNotEmpty;

    return GestureDetector(
      onTap: () =>
          context.push('/news-article?url=${Uri.encodeComponent(url)}'),
      child: SizedBox(
        width: 250,
        height: 210,
        child: ClipRRect(
          borderRadius: BorderRadius.circular(12),
          child: Stack(
            fit: StackFit.expand,
            children: [
              if (hasImage)
                CachedNetworkImage(
                  imageUrl: imageUrl!,
                  fit: BoxFit.cover,
                  placeholder: (_, _) => const _FeaturedFallback(),
                  errorWidget: (_, _, _) => const _FeaturedFallback(),
                )
              else
                const _FeaturedFallback(),
              DecoratedBox(
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.topCenter,
                    end: Alignment.bottomCenter,
                    colors: [
                      Colors.transparent,
                      Colors.black.withValues(alpha: 0.75),
                    ],
                    stops: const [0.4, 1.0],
                  ),
                ),
              ),
              Positioned(
                left: 12,
                right: 12,
                bottom: 12,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(
                      title,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                        fontSize: 15,
                        fontWeight: FontWeight.w700,
                        color: AppColors.white,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      source.isNotEmpty
                          ? '$source · $publishedAt'
                          : publishedAt,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.w500,
                        color: AppColors.onSurfaceVariant,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _FeaturedFallback extends StatelessWidget {
  const _FeaturedFallback();

  @override
  Widget build(BuildContext context) {
    return const ColoredBox(
      color: AppColors.surfaceContainerHigh,
      child: Center(
        child: Icon(
          Icons.newspaper,
          size: 40,
          color: AppColors.onSurfaceVariant,
        ),
      ),
    );
  }
}

class _ArticleCard extends StatelessWidget {
  final Map<String, dynamic> article;
  final String title;
  final String? description;
  final String source;
  final String publishedAt;
  final String url;

  const _ArticleCard({
    required this.article,
    required this.title,
    this.description,
    required this.source,
    required this.publishedAt,
    required this.url,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () =>
          context.push('/news-article?url=${Uri.encodeComponent(url)}'),
      child: Container(
        margin: const EdgeInsets.fromLTRB(16, 0, 16, 12),
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: AppColors.surfaceContainerHigh,
          borderRadius: BorderRadius.circular(12),
        ),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _ArticleImage(imageUrl: article['image']?.toString()),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: AppTypography.bodyMd.copyWith(
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    source.isEmpty ? publishedAt : '$source · $publishedAt',
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: AppTypography.labelSm.copyWith(
                      color: AppColors.onSurfaceVariant,
                    ),
                  ),
                  if (description != null && description!.isNotEmpty) ...[
                    const SizedBox(height: 4),
                    Text(
                      description!,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: AppTypography.bodySm.copyWith(
                        color: AppColors.onSurfaceVariant,
                      ),
                    ),
                  ],
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

final _articleProvider = FutureProvider.family<Map<String, dynamic>, String>((
  ref,
  url,
) async {
  final api = ref.read(apiServiceProvider);
  final res = await api.getNewsArticle(url);
  final data = res.data as Map<String, dynamic>;
  return data['article'] as Map<String, dynamic>? ?? {};
});

class _ArticleReader extends ConsumerWidget {
  final String articleUrl;

  const _ArticleReader({required this.articleUrl});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final article = ref.watch(_articleProvider(articleUrl));

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(title: const Text('Article')),
      body: article.when(
        loading: () => const LoadingSpinner(logo: true),
        error: (e, _) => Center(
          child: Text(
            'Could not load article',
            style: const TextStyle(color: AppColors.error),
          ),
        ),
        data: (a) {
          final title = a['title']?.toString() ?? 'Untitled';
          final image = a['image']?.toString();
          final source = a['source']?.toString() ?? '';
          final publishedAt = a['publishedAt']?.toString();
          final content =
              a['content']?.toString() ?? a['description']?.toString() ?? '';

          return ListView(
            padding: const EdgeInsets.all(16),
            children: [
              if (source.isNotEmpty)
                Row(
                  children: [
                    AppBadge(label: source.toUpperCase()),
                    const Spacer(),
                    Text(
                      _timeAgo(publishedAt),
                      style: const TextStyle(
                        color: AppColors.onSurfaceVariant,
                        fontSize: 12,
                      ),
                    ),
                  ],
                ),
              const SizedBox(height: 12),
              Text(title, style: AppTypography.headlineMd),
              const SizedBox(height: 16),
              if (image != null && image.isNotEmpty)
                ClipRRect(
                  borderRadius: BorderRadius.circular(12),
                  child: CachedNetworkImage(
                    imageUrl: image,
                    height: 200,
                    width: double.infinity,
                    fit: BoxFit.cover,
                  ),
                ),
              const SizedBox(height: 16),
              Text(content, style: AppTypography.bodyMd.copyWith(height: 1.6)),
              const SizedBox(height: 24),
              Center(
                child: Text(
                  'Provided by $source · Curated for NovaFlix',
                  style: const TextStyle(
                    color: AppColors.onSurfaceVariant,
                    fontSize: 11,
                  ),
                ),
              ),
            ],
          );
        },
      ),
    );
  }

  String _timeAgo(String? raw) {
    if (raw == null || raw.isEmpty) return '';
    final dt = DateTime.tryParse(raw);
    if (dt == null) return '';
    final diff = DateTime.now().difference(dt.toLocal());
    if (diff.inMinutes < 1) return 'now';
    if (diff.inHours < 1) return '${diff.inMinutes}m ago';
    if (diff.inDays < 1) return '${diff.inHours}h ago';
    return '${diff.inDays}d ago';
  }
}
