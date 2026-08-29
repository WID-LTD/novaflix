import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/media_item.dart';
import '../services/api_service.dart';
import '../theme/app_colors.dart';
import '../theme/app_typography.dart';
import '../core/responsive.dart';
import '../widgets/features/index.dart';
import '../widgets/ui/index.dart';

final _listProvider = FutureProvider.family<List<MediaItem>, String>((ref, kind) async {
  final api = ref.read(apiServiceProvider);
  switch (kind) {
    case 'trending':
      final res = await api.getTrending();
      final data = res.data['data'] as Map<String, dynamic>? ?? res.data as Map<String, dynamic>;
      return ((data['movies'] as List?) ?? <dynamic>[])
          .map((e) => MediaItem.fromJson(e as Map<String, dynamic>))
          .toList();
    case 'tv-trending':
      final res = await api.getTrending();
      final data = res.data['data'] as Map<String, dynamic>? ?? res.data as Map<String, dynamic>;
      return ((data['tv'] as List?) ?? <dynamic>[])
          .map((e) => MediaItem.fromJson(e as Map<String, dynamic>))
          .toList();
    case 'now-playing':
      final res = await api.getNowPlaying();
      final data = res.data['data'] as List? ?? res.data as List;
      return data.map((e) => MediaItem.fromJson(e as Map<String, dynamic>)).toList();
    default:
      return [];
  }
});

String _titleFor(String kind) {
  switch (kind) {
    case 'trending':
      return 'Trending Movies';
    case 'tv-trending':
      return 'Popular TV Shows';
    case 'now-playing':
      return 'Now Playing';
    default:
      return 'Movies';
  }
}

class MovieListScreen extends ConsumerWidget {
  final String kind;

  const MovieListScreen({super.key, required this.kind});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final items = ref.watch(_listProvider(kind));

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(title: Text(_titleFor(kind))),
      body: items.when(
        data: (list) {
          if (list.isEmpty) {
            return Center(
              child: Text('Nothing here yet', style: AppTypography.bodyMd.copyWith(color: AppColors.onSurfaceVariant)),
            );
          }
          return LayoutBuilder(
            builder: (context, constraints) {
              final columns = gridColumnsForWidth(constraints.maxWidth - 32);
              return GridView.builder(
                padding: const EdgeInsets.all(16),
                gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
                  crossAxisCount: columns,
                  childAspectRatio: gridAspectRatio(constraints.maxWidth, columns, spacing: 12),
                  crossAxisSpacing: 12,
                  mainAxisSpacing: 12,
                ),
                itemCount: list.length,
                itemBuilder: (_, i) => MovieCard(item: list[i]),
              );
            },
          );
        },
        loading: () => const LoadingSpinner(),
        error: (e, _) => Center(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Text('Failed to load: $e', style: AppTypography.bodyMd),
          ),
        ),
      ),
    );
  }
}
