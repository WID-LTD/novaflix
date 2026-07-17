import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:go_router/go_router.dart';
import '../services/api_service.dart';
import '../models/media_item.dart';
import '../theme/app_theme.dart';

final _movieDetailProvider = FutureProvider.family<MediaItem, int>((ref, id) async {
  final api = ref.read(apiServiceProvider);
  final res = await api.getDetails(id, 'movie');
  return MediaItem.fromJson(res.data as Map<String, dynamic>);
});

class MovieDetailScreen extends ConsumerWidget {
  final int movieId;
  const MovieDetailScreen({super.key, required this.movieId});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final movieAsync = ref.watch(_movieDetailProvider(movieId));

    return Scaffold(
      backgroundColor: AppTheme.black,
      body: movieAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(child: Text('Error: $e', style: const TextStyle(color: AppTheme.gray))),
        data: (movie) => CustomScrollView(
          slivers: [
            SliverAppBar(
              expandedHeight: 300,
              pinned: true,
              flexibleSpace: FlexibleSpaceBar(
                background: movie.backdropUrl != null
                    ? CachedNetworkImage(imageUrl: movie.backdropUrl!, fit: BoxFit.cover)
                    : Container(color: AppTheme.dark),
              ),
              leading: IconButton(
                icon: const Icon(Icons.arrow_back, color: AppTheme.white),
                onPressed: () => context.pop(),
              ),
              backgroundColor: AppTheme.dark,
            ),
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(movie.title, style: const TextStyle(
                      fontSize: 26, fontWeight: FontWeight.w700, color: AppTheme.white,
                    )),
                    const SizedBox(height: 8),
                    Row(
                      children: [
                        if (movie.voteAverage != null) ...[
                          const Icon(Icons.star, color: AppTheme.red, size: 18),
                          const SizedBox(width: 4),
                          Text('${movie.voteAverage!.toStringAsFixed(1)}/10', style: const TextStyle(color: AppTheme.gray)),
                          const SizedBox(width: 16),
                        ],
                        if (movie.releaseDate != null)
                          Text(movie.releaseDate!.substring(0, 4), style: const TextStyle(color: AppTheme.gray)),
                        if (movie.runtime != null) ...[
                          const SizedBox(width: 16),
                          Text('${movie.runtime! ~/ 60}h ${movie.runtime! % 60}m', style: const TextStyle(color: AppTheme.gray)),
                        ],
                      ],
                    ),
                    if (movie.genres != null && movie.genres!.isNotEmpty) ...[
                      const SizedBox(height: 12),
                      Wrap(
                        spacing: 8,
                        runSpacing: 4,
                        children: movie.genres!.map((g) => Container(
                          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                          decoration: BoxDecoration(
                            color: AppTheme.card,
                            borderRadius: BorderRadius.circular(16),
                          ),
                          child: Text(g.name, style: const TextStyle(color: AppTheme.gray, fontSize: 12)),
                        )).toList(),
                      ),
                    ],
                    const SizedBox(height: 24),
                    if (movie.overview != null && movie.overview!.isNotEmpty) ...[
                      Text('Overview', style: TextStyle(
                        fontSize: 18, fontWeight: FontWeight.w600,
                        color: AppTheme.white.withValues(alpha: 0.9),
                      )),
                      const SizedBox(height: 8),
                      Text(movie.overview!, style: const TextStyle(
                        color: AppTheme.gray, fontSize: 14, height: 1.5,
                      )),
                    ],
                    const SizedBox(height: 32),
                    SizedBox(
                      width: double.infinity,
                      height: 48,
                      child: ElevatedButton.icon(
                        onPressed: () {},
                        icon: const Icon(Icons.play_arrow),
                        label: const Text('Watch Now'),
                      ),
                    ),
                    const SizedBox(height: 100),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
