import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../providers/watchlist_provider.dart';
import '../theme/app_theme.dart';

class WatchlistScreen extends ConsumerWidget {
  const WatchlistScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final watchlist = ref.watch(watchlistProvider);
    final total = watchlist.movieIds.length + watchlist.tvIds.length;

    return Scaffold(
      backgroundColor: AppTheme.black,
      appBar: AppBar(title: const Text('My Watchlist')),
      body: total == 0
          ? Center(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(Icons.bookmark_border, size: 64, color: AppTheme.gray.withValues(alpha: 0.5)),
                  const SizedBox(height: 16),
                  const Text('Your watchlist is empty', style: TextStyle(color: AppTheme.gray, fontSize: 16)),
                  const SizedBox(height: 8),
                  Text('Add movies & TV shows to keep track', style: TextStyle(color: AppTheme.gray.withValues(alpha: 0.6), fontSize: 13)),
                ],
              ),
            )
          : ListView(
              padding: const EdgeInsets.all(16),
              children: [
                if (watchlist.movieIds.isNotEmpty) ...[
                  Text('Movies (${watchlist.movieIds.length})', style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w600, color: AppTheme.white)),
                  const SizedBox(height: 8),
                  ...watchlist.movieIds.map((id) => _WatchlistTile(id: id, type: 'movie')),
                  const SizedBox(height: 16),
                ],
                if (watchlist.tvIds.isNotEmpty) ...[
                  Text('TV Shows (${watchlist.tvIds.length})', style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w600, color: AppTheme.white)),
                  const SizedBox(height: 8),
                  ...watchlist.tvIds.map((id) => _WatchlistTile(id: id, type: 'tv')),
                ],
              ],
            ),
    );
  }
}

class _WatchlistTile extends StatelessWidget {
  final int id;
  final String type;

  const _WatchlistTile({required this.id, required this.type});

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      child: ListTile(
        title: Text('$type #$id', style: const TextStyle(color: AppTheme.white)),
        trailing: const Icon(Icons.arrow_forward_ios, size: 14, color: AppTheme.gray),
        onTap: () => context.go('/$type/$id'),
      ),
    );
  }
}
