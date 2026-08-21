import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../theme/app_colors.dart';
import '../theme/app_typography.dart';
import '../services/api_service.dart';
import '../models/media_item.dart';
import '../widgets/ui/index.dart';
import '../widgets/features/index.dart';
import '../widgets/movie_card.dart';

final _genresProvider = FutureProvider<List<Genre>>((ref) async {
  final api = ref.read(apiServiceProvider);
  final res = await api.getGenres();
  final data = res.data['data'] as List? ?? [];
  return data.map((e) => Genre.fromJson(e as Map<String, dynamic>)).toList();
});

final _categoryPageProvider = FutureProvider.family<
  ({List<MediaItem> items, int totalPages}),
  int
>((ref, genreId) async {
  final page = ref.watch(_categoryPageNumberProvider(genreId));
  final api = ref.read(apiServiceProvider);
  final res = await api.getCategoryMovies(genreId, page: page);
  final data = res.data['data'] as List? ?? [];
  final totalPages = res.data['total_pages'] as int? ?? 1;
  final items = data
      .map((e) => MediaItem.fromJson(e as Map<String, dynamic>))
      .toList();
  return (items: items, totalPages: totalPages);
});

final _categoryPageNumberProvider = StateProvider.family<int, int>((ref, _) => 1);

final _genreIdBySlugProvider = FutureProvider.family<int?, String>((ref, slug) async {
  final genres = await ref.watch(_genresProvider.future);
  final name = slug.replaceAll('-', ' ').toLowerCase();
  final match = genres.where((g) => g.name.toLowerCase() == name).toList();
  return match.isEmpty ? null : match.first.id;
});

const _genreIcons = <String, IconData>{
  'Action': Icons.sports_martial_arts,
  'Adventure': Icons.explore,
  'Animation': Icons.animation,
  'Comedy': Icons.mood,
  'Crime': Icons.local_police,
  'Documentary': Icons.description,
  'Drama': Icons.theater_comedy,
  'Family': Icons.family_restroom,
  'Fantasy': Icons.auto_stories,
  'History': Icons.history,
  'Horror': Icons.dangerous,
  'Music': Icons.music_note,
  'Mystery': Icons.search,
  'Romance': Icons.favorite,
  'Science Fiction': Icons.rocket_launch,
  'Sci-Fi': Icons.rocket_launch,
  'TV Movie': Icons.live_tv,
  'Thriller': Icons.bolt,
  'War': Icons.shield,
  'Western': Icons.landscape,
};

const _genreGradients = <String, List<Color>>{
  'Action': [Color(0x4DDC2626), Color(0x3392400E)],
  'Comedy': [Color(0x4DEAB308), Color(0x33713210)],
  'Drama': [Color(0x4D2563EB), Color(0x331E3A8A)],
  'Horror': [Color(0x4D9333EA), Color(0x334A0440)],
  'Science Fiction': [Color(0x4D06B6D4), Color(0x33164E63)],
  'Romance': [Color(0x4DEC4899), Color(0x33831D5C)],
  'Thriller': [Color(0x4DF97316), Color(0x337C2D12)],
  'Documentary': [Color(0x4D22C55E), Color(0x3314532D)],
  'Animation': [Color(0x4D6366F1), Color(0x333124E8)],
};

List<Color> _gradientFor(String name) {
  for (final entry in _genreGradients.entries) {
    if (name.toLowerCase().contains(entry.key.toLowerCase())) {
      return entry.value;
    }
  }
  return const [AppColors.surfaceContainerHigh, AppColors.surfaceContainer];
}

class CategoryScreen extends ConsumerWidget {
  final String? slug;

  const CategoryScreen({super.key, this.slug});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final isDesktop = MediaQuery.of(context).size.width >= 1024;
    final hPadding = isDesktop ? 64.0 : 16.0;

    if (slug != null) {
      return _GenreBrowse(slug: slug!, hPadding: hPadding, isDesktop: isDesktop);
    }

    final genres = ref.watch(_genresProvider);
    return Scaffold(
      backgroundColor: AppColors.background,
      body: SingleChildScrollView(
        padding: EdgeInsets.fromLTRB(hPadding, isDesktop ? 40 : 24, hPadding, 48),
        child: genres.when(
          data: (items) => Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  const Icon(Icons.category, color: AppColors.primaryContainer, size: 32),
                  const SizedBox(width: 12),
                  Text('Categories', style: AppTypography.headlineLg),
                ],
              ),
              const SizedBox(height: 24),
              LayoutBuilder(
                builder: (context, constraints) => GridView.builder(
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
                    crossAxisCount: (gridColumnsForWidth(constraints.maxWidth) + 1).clamp(2, 5),
                    crossAxisSpacing: 16,
                    mainAxisSpacing: 16,
                    childAspectRatio: 3.2,
                  ),
                itemCount: items.length,
                itemBuilder: (_, i) {
                  final genre = items[i];
                  final colors = _gradientFor(genre.name);
                  return InkWell(
                    onTap: () => context.go(
                      '/category/${genre.name.toLowerCase().replaceAll(' ', '-')}',
                    ),
                    borderRadius: BorderRadius.circular(16),
                    child: Ink(
                      decoration: BoxDecoration(
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(color: Colors.white.withValues(alpha: 0.05)),
                        gradient: LinearGradient(
                          begin: Alignment.topLeft,
                          end: Alignment.bottomRight,
                          colors: colors,
                        ),
                      ),
                      padding: const EdgeInsets.all(16),
                      child: Row(
                        children: [
                          Container(
                            width: 40,
                            height: 40,
                            decoration: BoxDecoration(
                              color: AppColors.surfaceContainer.withValues(alpha: 0.8),
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: Icon(
                              _genreIcons[genre.name] ?? Icons.theater_comedy,
                              color: AppColors.primaryContainer,
                              size: 20,
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Column(
                              mainAxisAlignment: MainAxisAlignment.center,
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  genre.name,
                                  style: AppTypography.labelMd.copyWith(
                                    color: AppColors.onSurface,
                                    fontWeight: FontWeight.w600,
                                  ),
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                ),
                                const SizedBox(height: 2),
                                Text(
                                  'Browse ${genre.name}',
                                  style: const TextStyle(
                                    color: AppColors.onSurfaceVariant,
                                    fontSize: 12,
                                  ),
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                ),
                              ],
                            ),
                          ),
                          const Icon(
                            Icons.chevron_right,
                            color: AppColors.onSurfaceVariant,
                            size: 20,
                          ),
                        ],
                      ),
                    ),
                  );
                },
              ),
              ),
            ],
          ),
          loading: () => const SizedBox(
            height: 400,
            child: Center(child: LoadingSpinner()),
          ),
          error: (_, __) => const Center(child: Text('Failed to load categories')),
        ),
      ),
    );
  }
}

class _GenreBrowse extends ConsumerWidget {
  final String slug;
  final double hPadding;
  final bool isDesktop;

  const _GenreBrowse({
    required this.slug,
    required this.hPadding,
    required this.isDesktop,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final genreId = ref.watch(_genreIdBySlugProvider(slug));
    final genreName = slug.replaceAll('-', ' ');

    return Scaffold(
      backgroundColor: AppColors.background,
      body: SingleChildScrollView(
        padding: EdgeInsets.fromLTRB(hPadding, isDesktop ? 40 : 24, hPadding, 48),
        child: genreId.when(
          data: (id) {
            if (id == null) {
              return const Center(child: Text('Category not found'));
            }
            final page = ref.watch(_categoryPageNumberProvider(id));
            final movies = ref.watch(_categoryPageProvider(id));
            return Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                GestureDetector(
                  onTap: () => context.go('/category'),
                  child: Padding(
                    padding: const EdgeInsets.all(8),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const Icon(
                          Icons.arrow_back,
                          size: 18,
                          color: AppColors.onSurfaceVariant,
                        ),
                        const SizedBox(width: 4),
                        Text(
                          'Categories',
                          style: AppTypography.labelMd.copyWith(
                            color: AppColors.onSurfaceVariant,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  genreName,
                  style: AppTypography.headlineLg,
                ),
                const SizedBox(height: 24),
                movies.when(
                  data: (result) {
                    if (result.items.isEmpty) {
                      return const Padding(
                        padding: EdgeInsets.symmetric(vertical: 40),
                        child: Center(
                          child: Text(
                            'No movies found in this category',
                            style: TextStyle(color: AppColors.onSurfaceVariant),
                          ),
                        ),
                      );
                    }
                    return LayoutBuilder(
                      builder: (context, constraints) => Column(
                        children: [
                          GridView.builder(
                            shrinkWrap: true,
                            physics: const NeverScrollableScrollPhysics(),
                            gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
                              crossAxisCount: gridColumnsForWidth(constraints.maxWidth),
                              childAspectRatio: 0.6,
                              crossAxisSpacing: 20,
                              mainAxisSpacing: 20,
                            ),
                            itemCount: result.items.length,
                            itemBuilder: (_, i) => MovieCard(item: result.items[i]),
                          ),
                          if (page < result.totalPages) ...[
                            const SizedBox(height: 24),
                            Center(
                              child: OutlinedButton(
                                onPressed: () {
                                  ref.read(_categoryPageNumberProvider(id).notifier).state = page + 1;
                                },
                                style: OutlinedButton.styleFrom(
                                  padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 12),
                                  side: BorderSide(color: Colors.white.withValues(alpha: 0.05)),
                                  shape: RoundedRectangleBorder(
                                    borderRadius: BorderRadius.circular(12),
                                  ),
                                ),
                                child: Text(
                                  'Load More',
                                  style: AppTypography.labelMd.copyWith(color: AppColors.onSurface),
                                ),
                              ),
                            ),
                          ],
                        ],
                      ),
                    );
                  },
                  loading: () => const SizedBox(
                    height: 400,
                    child: Center(child: LoadingSpinner()),
                  ),
                  error: (_, __) => const Center(child: Text('No results')),
                ),
              ],
            );
          },
          loading: () => const SizedBox(
            height: 400,
            child: Center(child: LoadingSpinner()),
          ),
          error: (_, __) => const Center(child: Text('Failed to load category')),
        ),
      ),
    );
  }
}