import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../theme/app_colors.dart';
import '../theme/app_typography.dart';
import '../services/api_service.dart';
import '../models/media_item.dart';
import '../providers/store_provider.dart';
import '../providers/auth_provider.dart';
import '../providers/downloads_provider.dart';
import '../widgets/ui/index.dart';
import '../widgets/features/index.dart';

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

class HomeScreen extends ConsumerWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final trending = ref.watch(_trendingProvider);
    final nowPlaying = ref.watch(_nowPlayingProvider);
    final store = ref.watch(storeProvider);
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
            SliverToBoxAdapter(child: _buildContinueWatching(store.continueWatching)),
            SliverToBoxAdapter(
              child: trending.when(
                data: (items) {
                  final movies = items.where((m) => !m.isTV).toList();
                  return ContentRow(title: 'Trending Movies', items: movies.take(10).toList());
                },
                loading: () => const SizedBox(height: 220, child: LoadingSpinner(logo: true)),
                error: (_, __) => const SizedBox.shrink(),
              ),
            ),
            SliverToBoxAdapter(
              child: nowPlaying.when(
                data: (items) => ContentRow(title: 'Now Playing', items: items.take(10).toList()),
                loading: () => const SizedBox(height: 220, child: LoadingSpinner(logo: true)),
                error: (_, __) => const SizedBox.shrink(),
              ),
            ),
            SliverToBoxAdapter(
              child: trending.when(
                data: (items) {
                  final tvShows = items.where((m) => m.isTV).toList();
                  return ContentRow(title: 'Popular TV Shows', items: tvShows.take(10).toList());
                },
                loading: () => const SizedBox(height: 220),
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

  Widget _buildContinueWatching(List<ContinueWatchingItem> items) {
    if (items.isEmpty) return const SizedBox.shrink();
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
          child: Text('Continue Watching', style: AppTypography.headlineSm),
        ),
        SizedBox(
          height: 180,
          child: ListView.builder(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: 12),
            itemCount: items.length,
            itemBuilder: (_, i) {
              final item = items[i];
              return Padding(
                padding: const EdgeInsets.symmetric(horizontal: 4),
                child: SizedBox(
                  width: 160,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Expanded(
                        child: Container(
                          decoration: BoxDecoration(
                            color: AppColors.surfaceContainerHigh,
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: Stack(
                            alignment: Alignment.bottomCenter,
                            children: [
                              if (item.poster != null)
                                ClipRRect(
                                  borderRadius: BorderRadius.circular(8),
                                  child: Image.network(item.poster!, fit: BoxFit.cover, width: 160),
                                ),
                              Positioned(
                                bottom: 0,
                                left: 0,
                                right: 0,
                                child: ClipRRect(
                                  borderRadius: const BorderRadius.vertical(bottom: Radius.circular(8)),
                                  child: LinearProgressIndicator(
                                    value: item.duration > 0 ? item.progress / item.duration : 0,
                                    backgroundColor: Colors.white12,
                                    valueColor: AlwaysStoppedAnimation(AppColors.primary),
                                    minHeight: 3,
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                      const SizedBox(height: 6),
                      Text(item.title, style: AppTypography.bodySm, maxLines: 1, overflow: TextOverflow.ellipsis),
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
