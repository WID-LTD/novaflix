import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:go_router/go_router.dart';
import '../services/api_service.dart';
import '../models/media_item.dart';
import '../theme/app_theme.dart';

final _genresProvider = FutureProvider<List<Genre>>((ref) async {
  final api = ref.read(apiServiceProvider);
  final res = await api.getGenres();
  final data = res.data as Map<String, dynamic>;
  final list = (data['genres'] as List?) ?? [];
  return list.map((e) => Genre.fromJson(e as Map<String, dynamic>)).toList();
});

class CategoryScreen extends ConsumerWidget {
  const CategoryScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final genres = ref.watch(_genresProvider);

    return Scaffold(
      backgroundColor: AppTheme.black,
      appBar: AppBar(title: const Text('Categories')),
      body: genres.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(child: Text('Error: $e', style: const TextStyle(color: AppTheme.gray))),
        data: (list) => GridView.builder(
          padding: const EdgeInsets.all(16),
          gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
            crossAxisCount: 2,
            crossAxisSpacing: 16,
            mainAxisSpacing: 16,
            childAspectRatio: 1.5,
          ),
          itemCount: list.length,
          itemBuilder: (context, i) {
            final genre = list[i];
            return GestureDetector(
              onTap: () => context.go('/category/${genre.id}'),
              child: Container(
                decoration: BoxDecoration(
                  color: AppTheme.card,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: AppTheme.darkGray),
                ),
                child: Center(
                  child: Text(genre.name, textAlign: TextAlign.center, style: const TextStyle(
                    color: AppTheme.white, fontWeight: FontWeight.w600, fontSize: 16,
                  )),
                ),
              ),
            );
          },
        ),
      ),
    );
  }
}

class CategoryDetailScreen extends ConsumerWidget {
  final int genreId;
  final String genreName;
  const CategoryDetailScreen({super.key, required this.genreId, required this.genreName});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final movies = ref.watch(_categoryMoviesProvider(genreId));

    return Scaffold(
      backgroundColor: AppTheme.black,
      appBar: AppBar(title: Text(genreName)),
      body: movies.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(child: Text('Error: $e', style: const TextStyle(color: AppTheme.gray))),
        data: (list) => list.isEmpty
            ? const Center(child: Text('No movies found', style: TextStyle(color: AppTheme.gray)))
            : GridView.builder(
                padding: const EdgeInsets.all(16),
                gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                  crossAxisCount: 3, crossAxisSpacing: 12, mainAxisSpacing: 12, childAspectRatio: 0.65,
                ),
                itemCount: list.length,
                itemBuilder: (context, i) {
                  final item = list[i];
                  return GestureDetector(
                    onTap: () => context.go('/movie/${item.id}'),
                    child: ClipRRect(
                      borderRadius: BorderRadius.circular(8),
                      child: item.posterUrl != null
                          ? CachedNetworkImage(imageUrl: item.posterUrl!, fit: BoxFit.cover)
                          : Container(color: AppTheme.card, child: const Icon(Icons.movie, color: AppTheme.gray)),
                    ),
                  );
                },
              ),
      ),
    );
  }
}

final _categoryMoviesProvider = FutureProvider.family<List<MediaItem>, int>((ref, genreId) async {
  final api = ref.read(apiServiceProvider);
  final res = await api.getCategoryMovies(genreId);
  final data = res.data as Map<String, dynamic>;
  final list = (data['results'] as List?) ?? [];
  return list.map((e) => MediaItem.fromJson(e as Map<String, dynamic>)).toList();
});
