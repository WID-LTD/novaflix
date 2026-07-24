import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../theme/app_colors.dart';
import '../theme/app_typography.dart';
import '../providers/watchlist_provider.dart';
import '../widgets/ui/index.dart';

class WatchlistScreen extends ConsumerWidget {
  const WatchlistScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final watchlist = ref.watch(watchlistProvider);

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(title: Text('Watchlist (${watchlist.movieIds.length + watchlist.tvIds.length})')),
      body: watchlist.movieIds.isEmpty && watchlist.tvIds.isEmpty
          ? Center(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(Icons.bookmark_border, size: 64, color: AppColors.onSurfaceVariant),
                  const SizedBox(height: 16),
                  Text('Your watchlist is empty', style: AppTypography.bodyLg.copyWith(color: AppColors.onSurfaceVariant)),
                  const SizedBox(height: 16),
                  AppButton(label: 'Browse Content', onPressed: () => context.push('/discover'), fullWidth: false),
                ],
              ),
            )
          : ListView(
              padding: const EdgeInsets.all(16),
              children: [
                if (watchlist.movieIds.isNotEmpty) ...[
                  Text('Movies (${watchlist.movieIds.length})', style: AppTypography.headlineSm),
                  const SizedBox(height: 8),
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: watchlist.movieIds.map((id) => _watchlistItem(context, id, 'movie', ref)).toList(),
                  ),
                  const SizedBox(height: 24),
                ],
                if (watchlist.tvIds.isNotEmpty) ...[
                  Text('TV Shows (${watchlist.tvIds.length})', style: AppTypography.headlineSm),
                  const SizedBox(height: 8),
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: watchlist.tvIds.map((id) => _watchlistItem(context, id, 'tv', ref)).toList(),
                  ),
                ],
              ],
            ),
    );
  }

  Widget _watchlistItem(BuildContext context, int id, String type, WidgetRef ref) {
    return GestureDetector(
      onTap: () => context.push(type == 'movie' ? '/movie/$id' : '/tv/$id'),
      child: Container(
        width: 150,
        height: 220,
        decoration: BoxDecoration(
          color: AppColors.surfaceContainerHigh,
          borderRadius: BorderRadius.circular(8),
        ),
        child: Stack(
          children: [
            Center(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(type == 'movie' ? Icons.movie : Icons.tv, size: 32, color: AppColors.onSurfaceVariant),
                  const SizedBox(height: 8),
                  Text('#$id', style: AppTypography.bodySm),
                  Text(type == 'movie' ? 'Movie' : 'TV Show', style: const TextStyle(color: AppColors.onSurfaceVariant, fontSize: 12)),
                ],
              ),
            ),
            Positioned(
              top: 4,
              right: 4,
              child: GestureDetector(
                onTap: () => ref.read(watchlistProvider.notifier).toggle(id, type),
                child: Container(
                  padding: const EdgeInsets.all(4),
                  decoration: BoxDecoration(
                    color: Colors.black54,
                    borderRadius: BorderRadius.circular(4),
                  ),
                  child: const Icon(Icons.close, size: 16, color: Colors.white),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
