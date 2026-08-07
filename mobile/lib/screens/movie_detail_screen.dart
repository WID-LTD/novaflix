import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../theme/app_colors.dart';
import '../theme/app_typography.dart';
import '../services/api_service.dart';
import '../models/media_item.dart';
import '../providers/auth_provider.dart';
import '../providers/watchlist_provider.dart';
import '../providers/downloads_provider.dart';
import '../widgets/ui/index.dart';
import '../widgets/features/index.dart';

final _movieDetailProvider = FutureProvider.family<MediaItem?, int>((ref, id) async {
  final api = ref.read(apiServiceProvider);
  try {
    final res = await api.getDetails(id, 'movie');
    final data = res.data['data'] as Map<String, dynamic>? ?? res.data as Map<String, dynamic>;
    return MediaItem.fromJson(data);
  } catch (_) {
    return null;
  }
});

final _similarProvider = FutureProvider.family<List<MediaItem>, int>((ref, id) async {
  final api = ref.read(apiServiceProvider);
  try {
    final res = await api.getSimilarRecommendations(id);
    final data = res.data['data'] as List? ?? [];
    return data.map((e) => MediaItem.fromJson(e as Map<String, dynamic>)).toList();
  } catch (_) {
    return [];
  }
});

class MovieDetailScreen extends ConsumerWidget {
  final int movieId;

  const MovieDetailScreen({super.key, required this.movieId});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final detail = ref.watch(_movieDetailProvider(movieId));
    final similar = ref.watch(_similarProvider(movieId));

    return Scaffold(
      backgroundColor: AppColors.background,
      body: detail.when(
        loading: () => const LoadingSpinner(logo: true),
        error: (err, _) => Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(Icons.error_outline, size: 48, color: AppColors.error),
              const SizedBox(height: 16),
              Text('Error loading details', style: AppTypography.bodyMd),
              const SizedBox(height: 16),
              AppButton(label: 'Go Back', onPressed: () => context.pop(), fullWidth: false),
            ],
          ),
        ),
        data: (item) {
          if (item == null) {
            return const Center(child: Text('Item not found'));
          }
          return CustomScrollView(
            slivers: [
              SliverAppBar(
                expandedHeight: 400,
                pinned: true,
                backgroundColor: AppColors.background,
                flexibleSpace: FlexibleSpaceBar(
                  background: Stack(
                    fit: StackFit.expand,
                    children: [
                      if (item.backdropUrl != null)
                        CachedNetworkImage(imageUrl: item.backdropUrl!, fit: BoxFit.cover)
                      else
                        Container(color: AppColors.surfaceContainerHigh),
                      Container(
                        decoration: BoxDecoration(
                          gradient: LinearGradient(
                            begin: Alignment.topCenter,
                            end: Alignment.bottomCenter,
                            colors: [Colors.transparent, AppColors.background],
                          ),
                        ),
                      ),
                      Positioned(
                        left: 16,
                        right: 16,
                        bottom: 24,
                        child: Row(
                          children: [
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(item.title, style: AppTypography.headlineMd.copyWith(color: Colors.white)),
                                  const SizedBox(height: 8),
                                  Row(
                                    children: [
                                      RatingBadge(rating: item.voteAverage ?? 0),
                                      const SizedBox(width: 12),
                                      Text('${item.year}', style: const TextStyle(color: Colors.white70)),
                                      if (item.runtime != null) ...[
                                        const SizedBox(width: 12),
                                        Text('${item.runtime! ~/ 60}h ${item.runtime! % 60}m', style: const TextStyle(color: Colors.white70)),
                                      ],
                                    ],
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Expanded(
                            child: AppButton(
                              label: 'Watch Now',
                              onPressed: () => context.push('/watch?id=${item.id}&type=${item.mediaType ?? 'movie'}'),
                            ),
                          ),
                          const SizedBox(width: 12),
                          Consumer(
                            builder: (_, ref2, __) {
                              final watchlist = ref2.watch(watchlistProvider);
                              final inWatchlist = watchlist.isInWatchlist(item.id, item.isTV ? 'tv' : 'movie');
                              return Container(
                                width: 48,
                                height: 48,
                                decoration: BoxDecoration(
                                  color: AppColors.surfaceContainerHigh,
                                  borderRadius: BorderRadius.circular(8),
                                ),
                                child: IconButton(
                                  icon: Icon(
                                    inWatchlist ? Icons.bookmark : Icons.bookmark_border,
                                    color: inWatchlist ? AppColors.primary : AppColors.onSurfaceVariant,
                                  ),
                                  onPressed: () => ref2.read(watchlistProvider.notifier).toggle(item.id, item.isTV ? 'tv' : 'movie'),
                                ),
                              );
                            },
                          ),
                          const SizedBox(width: 12),
                          Container(
                            width: 48,
                            height: 48,
                            decoration: BoxDecoration(
                              color: AppColors.surfaceContainerHigh,
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: IconButton(
                              icon: const Icon(Icons.download_outlined, color: AppColors.onSurfaceVariant),
                              onPressed: () => _handleDownload(context, ref, item),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 24),
                      if (item.overview != null && item.overview!.isNotEmpty) ...[
                        Text('Synopsis', style: AppTypography.headlineSm),
                        const SizedBox(height: 8),
                        Text(item.overview!, style: AppTypography.bodyMd.copyWith(color: AppColors.onSurfaceVariant)),
                      ],
                      const SizedBox(height: 24),
                      if (item.genres != null && item.genres!.isNotEmpty) ...[
                        Text('Genres', style: AppTypography.headlineSm),
                        const SizedBox(height: 8),
                        Wrap(
                          spacing: 8,
                          runSpacing: 8,
                          children: item.genres!.map((g) => Container(
                            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                            decoration: BoxDecoration(
                              color: AppColors.surfaceContainerHigh,
                              borderRadius: BorderRadius.circular(20),
                              border: Border.all(color: AppColors.outlineVariant),
                            ),
                            child: Text(g.name, style: AppTypography.bodySm),
                          )).toList(),
                        ),
                      ],
                      const SizedBox(height: 24),
                      if (item.voteAverage != null) ...[
                        Row(
                          children: [
                            const Text('Rating: ', style: TextStyle(fontWeight: FontWeight.w600)),
                            Text('${item.voteAverage!.toStringAsFixed(1)}/10', style: AppTypography.bodyMd),
                          ],
                        ),
                      ],
                      const SizedBox(height: 24),
                      if (item.seasons != null && item.seasons!.isNotEmpty) ...[
                        Text('Seasons', style: AppTypography.headlineSm),
                        const SizedBox(height: 8),
                        SeasonEpisodeSelector(
                          showId: item.id,
                          seasons: item.seasons!,
                        ),
                      ],
                      const SizedBox(height: 24),
                      CommentSection(
                        contentId: item.id,
                        contentType: item.isTV ? 'tv' : 'movie',
                      ),
                      const SizedBox(height: 24),
                      similar.when(
                        data: (items) => items.isNotEmpty
                            ? ContentRow(title: 'More Like This', items: items)
                            : const SizedBox.shrink(),
                        loading: () => const SizedBox(height: 200, child: LoadingSpinner(logo: true)),
                        error: (_, __) => const SizedBox.shrink(),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          );
        },
      ),
    );
  }

  Future<void> _handleDownload(BuildContext context, WidgetRef ref, MediaItem item) async {
    final auth = ref.read(authProvider);
    if (auth.status != AuthStatus.authenticated) {
      context.push('/login');
      return;
    }
    if (!(auth.user?.isPremium ?? false)) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Downloads are available on Premium plans'),
          backgroundColor: Colors.redAccent,
        ),
      );
      context.push('/pricing');
      return;
    }
    if (item.isTV) {
      final seasons = item.seasons;
      if (seasons == null || seasons.isEmpty) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('No seasons available to download')),
        );
        return;
      }
      final allEpisodes = <Map<String, dynamic>>[];
      for (final s in seasons) {
        final seasonNum = s.seasonNumber;
        final episodeCount = s.episodeCount ?? 0;
        for (var e = 1; e <= episodeCount; e++) {
          allEpisodes.add({'season': seasonNum, 'episode': e});
        }
      }
      if (allEpisodes.isEmpty) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('No episodes available to download')),
        );
        return;
      }
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Downloading ${item.title} (${allEpisodes.length} episodes)...'),
          duration: const Duration(seconds: 3),
        ),
      );
      ref.read(downloadsProvider.notifier).startDownload(
            contentId: item.id,
            type: 'tv',
            title: item.title,
            poster: item.posterUrl,
            backdrop: item.backdropUrl,
            episodes: allEpisodes,
          );
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Downloading ${item.title}...'), duration: const Duration(seconds: 3)),
      );
      ref.read(downloadsProvider.notifier).startDownload(
            contentId: item.id,
            type: 'movie',
            title: item.title,
            poster: item.posterUrl,
            backdrop: item.backdropUrl,
          );
    }
  }
}
