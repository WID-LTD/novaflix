import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:go_router/go_router.dart';
import '../services/api_service.dart';
import '../models/media_item.dart';
import '../theme/app_theme.dart';

class MovieListScreen extends ConsumerWidget {
  final String mediaType;

  const MovieListScreen({super.key, required this.mediaType});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final moviesAsync = ref.watch(_moviesProvider(mediaType));

    return Scaffold(
      backgroundColor: AppTheme.black,
      appBar: AppBar(
        title: Text(mediaType == 'movie' ? 'Movies' : 'TV Shows'),
      ),
      body: moviesAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(child: Text('Error: $e', style: const TextStyle(color: AppTheme.gray))),
        data: (movies) => GridView.builder(
          padding: const EdgeInsets.all(16),
          gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
            crossAxisCount: 3,
            crossAxisSpacing: 12,
            mainAxisSpacing: 12,
            childAspectRatio: 0.65,
          ),
          itemCount: movies.length,
          itemBuilder: (context, i) {
            final movie = movies[i];
            return GestureDetector(
              onTap: () => context.go('/movie/${movie.id}'),
              child: ClipRRect(
                borderRadius: BorderRadius.circular(8),
                child: movie.posterUrl != null
                    ? CachedNetworkImage(imageUrl: movie.posterUrl!, fit: BoxFit.cover)
                    : Container(color: AppTheme.card, child: const Center(child: Icon(Icons.movie, color: AppTheme.gray))),
              ),
            );
          },
        ),
      ),
    );
  }
}

final _moviesProvider = FutureProvider.family<List<MediaItem>, String>((ref, mediaType) async {
  final api = ref.read(apiServiceProvider);
  final res = mediaType == 'movie' ? await api.getNowPlaying() : await api.getTrending();
  final data = res.data as Map<String, dynamic>;
  final list = data['results'] as List;
  return list.map((e) => MediaItem.fromJson(e as Map<String, dynamic>)).toList();
});
