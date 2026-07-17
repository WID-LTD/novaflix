import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:go_router/go_router.dart';
import '../services/api_service.dart';
import '../models/media_item.dart';
import '../theme/app_theme.dart';

final _tvTrendingProvider = FutureProvider<List<MediaItem>>((ref) async {
  final api = ref.read(apiServiceProvider);
  final res = await api.getTrending();
  final data = res.data as Map<String, dynamic>;
  final list = (data['results'] as List?)?.where((e) => (e as Map<String, dynamic>)['media_type'] == 'tv') ?? [];
  return list.map((e) => MediaItem.fromJson(e as Map<String, dynamic>)).toList();
});

final _tvTopRatedProvider = FutureProvider<List<MediaItem>>((ref) async {
  final api = ref.read(apiServiceProvider);
  final res = await api.searchMedia('', type: 'tv');
  final data = res.data as Map<String, dynamic>;
  final list = (data['results'] as List?) ?? [];
  return list.map((e) => MediaItem.fromJson(e as Map<String, dynamic>)).toList();
});

class TVShowsScreen extends ConsumerWidget {
  const TVShowsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final trending = ref.watch(_tvTrendingProvider);
    final topRated = ref.watch(_tvTopRatedProvider);

    return Scaffold(
      backgroundColor: AppTheme.black,
      appBar: AppBar(title: const Text('TV Shows')),
      body: SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _ContentSection(title: 'Trending', asyncData: trending, onTap: (m) => context.go('/tv/${m.id}')),
            const SizedBox(height: 16),
            _ContentSection(title: 'Top Rated', asyncData: topRated, onTap: (m) => context.go('/tv/${m.id}')),
            const SizedBox(height: 24),
          ],
        ),
      ),
    );
  }
}

class _ContentSection extends StatelessWidget {
  final String title;
  final AsyncValue<List<MediaItem>> asyncData;
  final void Function(MediaItem) onTap;

  const _ContentSection({required this.title, required this.asyncData, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 16, 16, 12),
          child: Text(title, style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w700, color: AppTheme.white)),
        ),
        asyncData.when(
          loading: () => const SizedBox(height: 200, child: Center(child: CircularProgressIndicator())),
          error: (e, _) => Padding(
            padding: const EdgeInsets.all(16),
            child: Text('Error: $e', style: const TextStyle(color: AppTheme.gray)),
          ),
          data: (items) => SizedBox(
            height: 200,
            child: ListView.separated(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 16),
              itemCount: items.length,
              separatorBuilder: (_, __) => const SizedBox(width: 12),
              itemBuilder: (context, i) {
                final item = items[i];
                return GestureDetector(
                  onTap: () => onTap(item),
                  child: ClipRRect(
                    borderRadius: BorderRadius.circular(8),
                    child: SizedBox(
                      width: 130,
                      child: item.posterUrl != null
                          ? CachedNetworkImage(imageUrl: item.posterUrl!, fit: BoxFit.cover)
                          : Container(color: AppTheme.card, child: const Icon(Icons.tv, color: AppTheme.gray)),
                    ),
                  ),
                );
              },
            ),
          ),
        ),
      ],
    );
  }
}
