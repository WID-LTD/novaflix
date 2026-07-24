import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../theme/app_colors.dart';
import '../theme/app_typography.dart';
import '../services/api_service.dart';
import '../models/media_item.dart';
import '../widgets/ui/index.dart';
import '../widgets/features/index.dart';

final _discoverTypeProvider = StateProvider<String>((ref) => 'movie');
final _discoverGenreProvider = StateProvider<int?>((ref) => null);
final _discoverPageProvider = StateProvider<int>((ref) => 1);

final _genresProvider = FutureProvider<List<Map<String, dynamic>>>((ref) async {
  final api = ref.read(apiServiceProvider);
  final res = await api.getGenres(type: 'movie');
  final data = res.data['data'] as List? ?? [];
  return data.cast<Map<String, dynamic>>();
});

final _discoverResultsProvider = FutureProvider.family<List<MediaItem>, void>((ref, _) async {
  final api = ref.read(apiServiceProvider);
  final type = ref.watch(_discoverTypeProvider);
  final genreId = ref.watch(_discoverGenreProvider);
  final page = ref.watch(_discoverPageProvider);

  if (genreId != null) {
    final res = await api.getCategoryMovies(genreId, type: type, page: page);
    final data = res.data['data'] as List? ?? [];
    return data.map((e) => MediaItem.fromJson(e as Map<String, dynamic>)).toList();
  }
  final res = await api.searchMedia('', type: type);
  final data = res.data['data'] as List? ?? [];
  return data.map((e) => MediaItem.fromJson(e as Map<String, dynamic>)).toList();
});

class DiscoverScreen extends ConsumerWidget {
  const DiscoverScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final type = ref.watch(_discoverTypeProvider);
    final genres = ref.watch(_genresProvider);
    final results = ref.watch(_discoverResultsProvider(null));

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(title: const Text('Discover')),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            child: Row(
              children: [
                Expanded(
                  child: AppDropdown(
                    value: type == 'movie' ? 'Movies' : 'TV Shows',
                    items: ['Movies', 'TV Shows'],
                    onChanged: (v) {
                      ref.read(_discoverTypeProvider.notifier).state = v == 'Movies' ? 'movie' : 'tv';
                      ref.read(_discoverPageProvider.notifier).state = 1;
                    },
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: genres.when(
                    data: (items) => AppDropdown(
                      value: ref.watch(_discoverGenreProvider)?.toString() ?? 'All Genres',
                      items: ['All Genres', ...items.map((g) => g['name'] as String)],
                      onChanged: (v) {
                        if (v == 'All Genres') {
                          ref.read(_discoverGenreProvider.notifier).state = null;
                        } else {
                          final genre = items.firstWhere((g) => g['name'] == v);
                          ref.read(_discoverGenreProvider.notifier).state = genre['id'] as int;
                        }
                        ref.read(_discoverPageProvider.notifier).state = 1;
                      },
                    ),
                    loading: () => const SizedBox(height: 48),
                    error: (_, __) => const SizedBox(height: 48),
                  ),
                ),
              ],
            ),
          ),
          Expanded(
            child: results.when(
              data: (items) {
                if (items.isEmpty) return const Center(child: Text('No results'));
                return GridView.builder(
                  padding: const EdgeInsets.symmetric(horizontal: 12),
                  gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                    crossAxisCount: 3,
                    childAspectRatio: 0.65,
                    crossAxisSpacing: 8,
                    mainAxisSpacing: 8,
                  ),
                  itemCount: items.length,
                  itemBuilder: (_, i) => MovieCard(item: items[i]),
                );
              },
              loading: () => const Center(child: CircularProgressIndicator()),
              error: (e, _) => Center(child: Text('Error: $e')),
            ),
          ),
        ],
      ),
    );
  }
}
