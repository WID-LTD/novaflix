import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../theme/app_colors.dart';
import '../theme/app_typography.dart';
import '../services/api_service.dart';
import '../models/media_item.dart';
import '../widgets/ui/index.dart';
import '../widgets/features/index.dart';

final _genresProvider = FutureProvider<List<Genre>>((ref) async {
  final api = ref.read(apiServiceProvider);
  final res = await api.getGenres();
  final data = res.data['data'] as List? ?? [];
  return data.map((e) => Genre.fromJson(e as Map<String, dynamic>)).toList();
});

final _categoryMoviesProvider = FutureProvider.family<List<MediaItem>, int>((ref, genreId) async {
  final api = ref.read(apiServiceProvider);
  final res = await api.getCategoryMovies(genreId);
  final data = res.data['data'] as List? ?? [];
  return data.map((e) => MediaItem.fromJson(e as Map<String, dynamic>)).toList();
});

class CategoryScreen extends ConsumerWidget {
  final String? slug;

  const CategoryScreen({super.key, this.slug});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final genres = ref.watch(_genresProvider);

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(title: const Text('Categories')),
      body: genres.when(
        data: (items) => GridView.builder(
          padding: const EdgeInsets.all(16),
          gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
            crossAxisCount: (gridColumnsFor(MediaQuery.sizeOf(context).width) / 2).ceil(),
            childAspectRatio: 1.5,
            crossAxisSpacing: 12, mainAxisSpacing: 12,
          ),
          itemCount: items.length,
          itemBuilder: (_, i) {
            final genre = items[i];
            return GestureDetector(
              onTap: () => _showCategoryDetail(context, ref, genre),
              child: Container(
                decoration: BoxDecoration(
                  color: AppColors.surfaceContainerHigh,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: AppColors.outlineVariant),
                ),
                child: Center(
                  child: Text(genre.name, style: AppTypography.bodyLg.copyWith(fontWeight: FontWeight.w600),
                    textAlign: TextAlign.center),
                ),
              ),
            );
          },
        ),
        loading: () => const LoadingSpinner(logo: true),
        error: (_, __) => const Center(child: Text('Failed to load categories')),
      ),
    );
  }

  void _showCategoryDetail(BuildContext context, WidgetRef ref, Genre genre) {
    Navigator.of(context).push(MaterialPageRoute(
      builder: (_) => Scaffold(
        backgroundColor: AppColors.background,
        appBar: AppBar(title: Text(genre.name)),
        body: ref.watch(_categoryMoviesProvider(genre.id)).when(
          data: (items) => GridView.builder(
            padding: const EdgeInsets.all(12),
            gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: gridColumnsFor(MediaQuery.sizeOf(context).width),
              childAspectRatio: 0.65,
              crossAxisSpacing: 8, mainAxisSpacing: 8,
            ),
            itemCount: items.length,
            itemBuilder: (_, i) => MovieCard(item: items[i]),
          ),
          loading: () => const LoadingSpinner(logo: true),
          error: (_, __) => const Center(child: Text('No results')),
        ),
      ),
    ));
  }
}
