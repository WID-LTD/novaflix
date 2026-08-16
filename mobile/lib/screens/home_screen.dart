import 'package:flutter/material.dart';
import 'dart:math' as math;
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../theme/app_colors.dart';
import '../theme/app_typography.dart';
import '../services/api_service.dart';
import '../models/media_item.dart';
import '../providers/store_provider.dart';
import '../providers/watchlist_provider.dart';
import '../providers/auth_provider.dart';
import '../providers/downloads_provider.dart';
import '../widgets/ui/index.dart';
import '../widgets/features/index.dart';

List<MediaItem> _shuffled(List<MediaItem> items) {
  final shuffled = [...items];
  for (var i = shuffled.length - 1; i > 0; i--) {
    final j = _rng.nextInt(i + 1);
    final tmp = shuffled[i];
    shuffled[i] = shuffled[j];
    shuffled[j] = tmp;
  }
  return shuffled;
}

final _rng = math.Random();

final _trendingProvider = FutureProvider<List<MediaItem>>((ref) async {
  final api = ref.read(apiServiceProvider);
  final res = await api.getTrending();
  final data = res.data['data'] as Map<String, dynamic>? ?? res.data as Map<String, dynamic>;
  final movies = (data['movies'] as List?)?.map((e) => MediaItem.fromJson(e as Map<String, dynamic>)).toList() ?? <MediaItem>[];
  final tv = (data['tv'] as List?)?.map((e) => MediaItem.fromJson(e as Map<String, dynamic>)).toList() ?? <MediaItem>[];
  return [...movies, ...tv];
});

final _nowPlayingProvider = FutureProvider<List<MediaItem>>((ref) async {
  final api = ref.read(apiServiceProvider);
  final res = await api.getNowPlaying();
  final data = res.data['data'] as List? ?? res.data as List;
  return data.map((e) => MediaItem.fromJson(e as Map<String, dynamic>)).toList();
});

final _horrorProvider = FutureProvider<List<MediaItem>>((ref) async {
  final api = ref.read(apiServiceProvider);
  final res = await api.getCategoryMovies(27, type: 'movie');
  final data = res.data['data'] as List? ?? res.data as List;
  return data.map((e) => MediaItem.fromJson(e as Map<String, dynamic>)).toList();
});

final _indieProvider = FutureProvider<List<MediaItem>>((ref) async {
  final api = ref.read(apiServiceProvider);
  final res = await api.getDiscover(withCompanies: '1549');
  final data = res.data['data'] as List? ?? res.data as List;
  return data.map((e) => MediaItem.fromJson(e as Map<String, dynamic>)).toList();
});

final _classicProvider = FutureProvider<List<MediaItem>>((ref) async {
  final api = ref.read(apiServiceProvider);
  final res = await api.getDiscover(
    sortBy: 'vote_average.desc',
    minVotes: 1000,
    primaryReleaseDateLte: '1999-12-31',
  );
  final data = res.data['data'] as List? ?? res.data as List;
  return data.map((e) => MediaItem.fromJson(e as Map<String, dynamic>)).toList();
});

final _animeProvider = FutureProvider<List<MediaItem>>((ref) async {
  final api = ref.read(apiServiceProvider);
  final res = await api.getDiscover(genreId: 16, withOriginalLanguage: 'ja');
  final data = res.data['data'] as List? ?? res.data as List;
  return data.map((e) => MediaItem.fromJson(e as Map<String, dynamic>)).toList();
});

final _newsProvider = FutureProvider<List<Map<String, dynamic>>>((ref) async {
  final api = ref.read(apiServiceProvider);
  final res = await api.getHomeNews();
  final articles = res.data['articles'] as List? ?? [];
  return articles.cast<Map<String, dynamic>>();
});

final _topRatedProvider = FutureProvider<List<MediaItem>>((ref) async {
  final api = ref.read(apiServiceProvider);
  final res = await api.getDiscover(
    sortBy: 'vote_average.desc',
    minVotes: 1000,
  );
  final data = res.data['data'] as List? ?? res.data as List;
  return data.map((e) => MediaItem.fromJson(e as Map<String, dynamic>)).toList();
});

class HomeScreen extends ConsumerWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final trending = ref.watch(_trendingProvider);
    final nowPlaying = ref.watch(_nowPlayingProvider);
    final horror = ref.watch(_horrorProvider);
    final indie = ref.watch(_indieProvider);
    final classic = ref.watch(_classicProvider);
    final anime = ref.watch(_animeProvider);
    final news = ref.watch(_newsProvider);
    final topRated = ref.watch(_topRatedProvider);
    final store = ref.watch(storeProvider);
    final watchlist = ref.watch(watchlistProvider);
    final netStatus = ref.watch(netStatusProvider);
    final dlState = ref.watch(downloadsProvider);
    final isOffline = netStatus == NetStatus.offline;
    final auth = ref.watch(authProvider);
    final hasDownloads = dlState.items.isNotEmpty;
    final isAuthed = auth.status == AuthStatus.authenticated;

    return Scaffold(
      backgroundColor: AppColors.background,
      body: RefreshIndicator(
        onRefresh: () async {
          ref.invalidate(_trendingProvider);
          ref.invalidate(_nowPlayingProvider);
          ref.invalidate(_horrorProvider);
          ref.invalidate(_indieProvider);
          ref.invalidate(_classicProvider);
          ref.invalidate(_animeProvider);
          ref.invalidate(_newsProvider);
          ref.invalidate(_topRatedProvider);
        },
        child: CustomScrollView(
          slivers: [
            SliverAppBar(
              backgroundColor: AppColors.background,
              expandedHeight: 420,
              pinned: false,
              floating: false,
              flexibleSpace: trending.when(
                data: (items) => HeroBanner(items: items.take(5).toList()),
                loading: () => AppSkeleton.hero(),
                error: (_, __) => const SizedBox(height: 400),
              ),
            ),
            SliverToBoxAdapter(child: _buildQuickActions(context)),
            if (isAuthed && isOffline && hasDownloads)
              SliverToBoxAdapter(child: _offlineCta(context, dlState)),
            SliverToBoxAdapter(child: _buildContinueWatching(context, store.continueWatching)),
            SliverToBoxAdapter(
              child: trending.when(
                data: (items) {
                  final movies = items.where((m) => !m.isTV).toList();
                  return ContentRow(
                    title: 'Trending Movies',
                    items: movies.take(10).toList(),
                    onSeeAll: () => context.go('/list/trending'),
                  );
                },
                loading: () => const SizedBox(height: 220, child: LoadingSpinner(logo: true)),
                error: (_, __) => const SizedBox.shrink(),
              ),
            ),
            SliverToBoxAdapter(
              child: news.when(
                data: (articles) => _HomeNewsRow(
                  articles: articles.take(12).toList(),
                  onSeeAll: () => context.go('/news'),
                ),
                loading: () => const SizedBox.shrink(),
                error: (_, __) => const SizedBox.shrink(),
              ),
            ),
            if (watchlist.movieIds.isNotEmpty || watchlist.tvIds.isNotEmpty)
              SliverToBoxAdapter(
                child: trending.when(
                  data: (items) => ContentRow(
                    title: 'Because You Watched',
                    items: _shuffled(items).take(10).toList(),
                    onSeeAll: () => context.go('/discover'),
                  ),
                  loading: () => const SizedBox.shrink(),
                  error: (_, __) => const SizedBox.shrink(),
                ),
              ),
            SliverToBoxAdapter(
              child: nowPlaying.when(
                data: (items) => ContentRow(
                  title: 'Now Playing',
                  items: items.take(10).toList(),
                  onSeeAll: () => context.go('/list/now-playing'),
                ),
                loading: () => const SizedBox(height: 220, child: LoadingSpinner(logo: true)),
                error: (_, __) => const SizedBox.shrink(),
              ),
            ),
            SliverToBoxAdapter(
              child: trending.when(
                data: (items) {
                  final tvShows = items.where((m) => m.isTV).toList();
                  return ContentRow(
                    title: 'Popular TV Shows',
                    items: tvShows.take(10).toList(),
                    onSeeAll: () => context.go('/list/tv-trending'),
                  );
                },
                loading: () => const SizedBox(height: 220),
                error: (_, __) => const SizedBox.shrink(),
              ),
            ),
            SliverToBoxAdapter(
              child: topRated.when(
                data: (items) => ContentRow(
                  title: 'Top Rated Movies',
                  items: _shuffled(items).take(10).toList(),
                  onSeeAll: () => context.go('/discover?sort=top_rated'),
                ),
                loading: () => const SizedBox.shrink(),
                error: (_, __) => const SizedBox.shrink(),
              ),
            ),
            SliverToBoxAdapter(
              child: horror.when(
                data: (items) => ContentRow(
                  title: 'Horror Movies',
                  items: items.take(10).toList(),
                  onSeeAll: () => context.go('/discover'),
                ),
                loading: () => const SizedBox.shrink(),
                error: (_, __) => const SizedBox.shrink(),
              ),
            ),
            SliverToBoxAdapter(
              child: indie.when(
                data: (items) => ContentRow(
                  title: 'Indie Films',
                  items: items.take(10).toList(),
                  onSeeAll: () => context.go('/discover'),
                ),
                loading: () => const SizedBox.shrink(),
                error: (_, __) => const SizedBox.shrink(),
              ),
            ),
            SliverToBoxAdapter(
              child: anime.when(
                data: (items) => ContentRow(
                  title: 'Anime',
                  items: items.take(10).toList(),
                  onSeeAll: () => context.go('/discover'),
                ),
                loading: () => const SizedBox.shrink(),
                error: (_, __) => const SizedBox.shrink(),
              ),
            ),
            SliverToBoxAdapter(
              child: classic.when(
                data: (items) => ContentRow(
                  title: 'Classic Movies',
                  items: items.take(10).toList(),
                  onSeeAll: () => context.go('/discover'),
                ),
                loading: () => const SizedBox.shrink(),
                error: (_, __) => const SizedBox.shrink(),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildQuickActions(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      child: Row(
        children: [
          _quickAction(Icons.explore, 'Discover', () => context.push('/discover')),
          const SizedBox(width: 12),
          _quickAction(Icons.tv, 'TV Shows', () => context.push('/tv-shows')),
          const SizedBox(width: 12),
          _quickAction(Icons.bookmark, 'Watchlist', () => context.push('/watchlist')),
          const SizedBox(width: 12),
          _quickAction(Icons.store, 'Store', () => context.push('/store')),
        ],
      ),
    );
  }

  Widget _offlineCta(BuildContext context, DownloadsState dlState) {
    final movies = dlState.items.where((i) => !i.isTv).toList();
    return Container(
      margin: const EdgeInsets.fromLTRB(16, 4, 16, 12),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [AppColors.primary, AppColors.primary.withValues(alpha: 0.6)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(14),
      ),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'You\'re offline',
                  style: TextStyle(color: Colors.white, fontWeight: FontWeight.w700, fontSize: 15),
                ),
                const SizedBox(height: 4),
                Text(
                  '${dlState.items.length} saved — watch your downloads anytime',
                  style: const TextStyle(color: Colors.white, fontSize: 12),
                ),
              ],
            ),
          ),
          FilledButton(
            onPressed: () => context.push('/downloads'),
            style: FilledButton.styleFrom(
              backgroundColor: Colors.black,
              foregroundColor: Colors.white,
            ),
            child: const Text('Go to Downloads'),
          ),
        ],
      ),
    );
  }

  Widget _quickAction(IconData icon, String label, VoidCallback onTap) {
    return Expanded(
      child: GestureDetector(
        onTap: onTap,
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 12),
          decoration: BoxDecoration(
            color: AppColors.surfaceContainerHigh,
            borderRadius: BorderRadius.circular(10),
          ),
          child: Column(
            children: [
              Icon(icon, color: AppColors.primary, size: 22),
              const SizedBox(height: 4),
              Text(label, style: AppTypography.labelSm),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildContinueWatching(BuildContext context, List<ContinueWatchingItem> items) {
    if (items.isEmpty) return const SizedBox.shrink();
    final isDesktop = MediaQuery.of(context).size.width >= 1024;
    final cardWidth = isDesktop ? 220.0 : 160.0;
    final hPadding = isDesktop ? 64.0 : 16.0;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: EdgeInsets.fromLTRB(hPadding, 8, hPadding, 12),
          child: Row(
            children: [
              Expanded(
                child: Text(
                  'Continue Watching',
                  style: AppTypography.headlineMd,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
              GestureDetector(
                onTap: () => context.go('/watchlist'),
                child: Text(
                  'View All',
                  style: AppTypography.labelMd.copyWith(
                    color: AppColors.primary,
                  ),
                ),
              ),
            ],
          ),
        ),
        SizedBox(
          height: cardWidth * 1.5 + 40,
          child: ListView.builder(
            scrollDirection: Axis.horizontal,
            padding: EdgeInsets.symmetric(horizontal: hPadding),
            itemCount: items.length,
            itemBuilder: (_, i) {
              final item = items[i];
              return Padding(
                padding: const EdgeInsets.only(right: 16),
                child: SizedBox(
                  width: cardWidth,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Expanded(
                        child: Container(
                          decoration: BoxDecoration(
                            color: AppColors.surfaceContainerHigh,
                            borderRadius: BorderRadius.circular(6),
                          ),
                          child: Stack(
                            alignment: Alignment.bottomCenter,
                            children: [
                              if (item.poster != null)
                                ClipRRect(
                                  borderRadius: BorderRadius.circular(6),
                                  child: Image.network(item.poster!, fit: BoxFit.cover, width: cardWidth),
                                ),
                              Positioned(
                                bottom: 0,
                                left: 0,
                                right: 0,
                                child: ClipRRect(
                                  borderRadius: const BorderRadius.vertical(bottom: Radius.circular(6)),
                                  child: LinearProgressIndicator(
                                    value: item.duration > 0 ? item.progress / item.duration : 0,
                                    backgroundColor: Colors.white24,
                                    valueColor: const AlwaysStoppedAnimation(Color(0xFFEF4444)),
                                    minHeight: 4,
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                      const SizedBox(height: 6),
                      Text(
                        item.title,
                        style: AppTypography.labelMd.copyWith(
                          color: AppColors.onSurface,
                          fontSize: 12.5,
                          fontWeight: FontWeight.w600,
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ],
                  ),
                ),
              );
            },
          ),
        ),
      ],
    );
  }
}

class _HomeNewsRow extends StatelessWidget {
  final List<Map<String, dynamic>> articles;
  final VoidCallback? onSeeAll;

  const _HomeNewsRow({required this.articles, this.onSeeAll});

  @override
  Widget build(BuildContext context) {
    if (articles.isEmpty) return const SizedBox.shrink();
    final isDesktop = MediaQuery.of(context).size.width >= 1024;
    final hPadding = isDesktop ? 64.0 : 16.0;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: EdgeInsets.fromLTRB(hPadding, 8, hPadding, 12),
          child: Row(
            children: [
              Expanded(
                child: Text(
                  'Latest Movie News',
                  style: AppTypography.headlineMd,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
              if (onSeeAll != null)
                GestureDetector(
                  onTap: onSeeAll,
                  child: Text(
                    'See All',
                    style: AppTypography.labelMd.copyWith(
                      color: AppColors.primary,
                    ),
                  ),
                ),
            ],
          ),
        ),
        SizedBox(
          height: isDesktop ? 240 : 220,
          child: ListView.builder(
            scrollDirection: Axis.horizontal,
            padding: EdgeInsets.symmetric(horizontal: hPadding),
            itemCount: articles.length,
            itemBuilder: (_, i) => Padding(
              padding: const EdgeInsets.only(right: 16),
              child: _HomeNewsCard(article: articles[i]),
            ),
          ),
        ),
      ],
    );
  }
}

class _HomeNewsCard extends StatelessWidget {
  final Map<String, dynamic> article;

  const _HomeNewsCard({required this.article});

  String _formatDate(String? raw) {
    if (raw == null || raw.isEmpty) return '';
    final dt = DateTime.tryParse(raw);
    if (dt == null) return '';
    return DateFormat('MMM d, yyyy').format(dt.toLocal());
  }

  @override
  Widget build(BuildContext context) {
    final isDesktop = MediaQuery.of(context).size.width >= 1024;
    final width = isDesktop ? 300.0 : 260.0;
    final url = article['url']?.toString() ?? '';
    final title = article['title']?.toString() ?? '';
    final imageUrl = article['image']?.toString();
    final source = article['source']?.toString() ?? '';
    final publishedAt = _formatDate(article['publishedAt']?.toString());
    final hasImage = imageUrl != null && imageUrl.isNotEmpty;

    return GestureDetector(
      onTap: () =>
          context.push('/news-article?url=${Uri.encodeComponent(url)}'),
      child: SizedBox(
        width: width,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            ClipRRect(
              borderRadius: BorderRadius.circular(12),
              child: SizedBox(
                width: width,
                height: width * 0.62,
                child: hasImage
                    ? CachedNetworkImage(
                        imageUrl: imageUrl,
                        fit: BoxFit.cover,
                        placeholder: (_, __) => const _HomeNewsFallback(),
                        errorWidget: (_, __, ___) => const _HomeNewsFallback(),
                      )
                    : const _HomeNewsFallback(),
              ),
            ),
            const SizedBox(height: 8),
            Text(
              source.isNotEmpty ? '$source · $publishedAt' : publishedAt,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: const TextStyle(
                fontSize: 11,
                fontWeight: FontWeight.w500,
                color: AppColors.onSurfaceVariant,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              title,
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
              style: TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.w600,
                height: 1.3,
                color: AppColors.onSurface,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _HomeNewsFallback extends StatelessWidget {
  const _HomeNewsFallback();

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
