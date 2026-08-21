import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../theme/app_colors.dart';
import '../theme/app_typography.dart';
import '../services/api_service.dart';
import '../models/media_item.dart';
import '../providers/watchlist_provider.dart';
import '../widgets/ui/index.dart';
import '../widgets/features/index.dart';

final _watchlistItemsProvider = FutureProvider<List<MediaItem>>((ref) async {
  final watchlist = ref.watch(watchlistProvider);
  final api = ref.read(apiServiceProvider);
  final items = <MediaItem>[];
  for (final w in watchlist.items) {
    try {
      final res = await api.getDetails(w.contentId, w.contentType);
      final data =
          res.data['data'] as Map<String, dynamic>? ??
          res.data as Map<String, dynamic>;
      final item = MediaItem.fromJson(data);
      items.add(item);
    } catch (_) {}
  }
  return items;
});

class WatchlistScreen extends ConsumerStatefulWidget {
  const WatchlistScreen({super.key});

  @override
  ConsumerState<WatchlistScreen> createState() => _WatchlistScreenState();
}

class _WatchlistScreenState extends ConsumerState<WatchlistScreen> {
  final _searchCtl = TextEditingController();
  String _search = '';
  String _filter = 'all';

  @override
  void dispose() {
    _searchCtl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final watchlist = ref.watch(watchlistProvider);
    final items = ref.watch(_watchlistItemsProvider);
    final total = watchlist.items.length;
    final isDesktop = MediaQuery.of(context).size.width >= 1024;
    final hPadding = isDesktop ? 64.0 : 16.0;

    return Scaffold(
      backgroundColor: AppColors.background,
      body: SingleChildScrollView(
        padding: EdgeInsets.fromLTRB(hPadding, isDesktop ? 40 : 24, hPadding, 48),
        child: Center(
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 1280),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    const Icon(Icons.bookmark, color: AppColors.primaryContainer, size: 32),
                    const SizedBox(width: 12),
                    Text('Watchlist', style: AppTypography.headlineLg),
                    const SizedBox(width: 8),
                    Padding(
                      padding: const EdgeInsets.only(top: 8),
                      child: Text(
                        '($total items)',
                        style: AppTypography.bodySm.copyWith(
                          color: AppColors.onSurfaceVariant,
                        ),
                      ),
                    ),
                  ],
                ),
                if (total > 0) ...[
                  const SizedBox(height: 20),
                  Wrap(
                    spacing: 16,
                    runSpacing: 12,
                    crossAxisAlignment: WrapCrossAlignment.center,
                    children: [
                      ConstrainedBox(
                        constraints: const BoxConstraints(maxWidth: 320, minWidth: 200),
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 12),
                          decoration: BoxDecoration(
                            color: AppColors.surfaceContainerHigh,
                            border: Border.all(color: Colors.white10),
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: Row(
                            children: [
                              const Icon(Icons.search, color: Colors.grey, size: 20),
                            const SizedBox(width: 8),
                            Expanded(
                              child: TextField(
                                controller: _searchCtl,
                                style: const TextStyle(
                                  color: AppColors.onSurface,
                                  fontSize: 14,
                                ),
                                decoration: const InputDecoration(
                                  hintText: 'Search watchlist...',
                                  hintStyle: TextStyle(color: Colors.grey),
                                  border: InputBorder.none,
                                  isDense: true,
                                ),
                                onChanged: (v) => setState(() => _search = v.trim().toLowerCase()),
                              ),
                            ),
                            if (_searchCtl.text.isNotEmpty)
                              IconButton(
                                icon: const Icon(Icons.close, color: AppColors.onSurfaceVariant, size: 18),
                                onPressed: () {
                                  _searchCtl.clear();
                                  setState(() => _search = '');
                                },
                              ),
                          ],
                        ),
                        ),
                      ),
                      AppTabs(
                        tabs: const ['All', 'Movies', 'TV Shows'],
                        activeIndex: _filter == 'all' ? 0 : _filter == 'movie' ? 1 : 2,
                        onChanged: (i) =>
                            setState(() => _filter = ['all', 'movie', 'tv'][i]),
                      ),
                    ],
                  ),
                  const SizedBox(height: 24),
                ],
                items.when(
                  data: (list) {
                    if (total == 0) {
                      return _emptyState(context);
                    }
                    final filtered = list.where((item) {
                      if (_filter == 'movie' && item.isTV) return false;
                      if (_filter == 'tv' && !item.isTV) return false;
                      if (_search.isNotEmpty &&
                          !item.title.toLowerCase().contains(_search)) {
                        return false;
                      }
                      return true;
                    }).toList();
                    if (filtered.isEmpty) {
                      return Padding(
                        padding: const EdgeInsets.symmetric(vertical: 80),
                        child: Column(
                          children: [
                            Text(
                              'No items match your search',
                              style: AppTypography.bodyMd.copyWith(
                                color: AppColors.onSurfaceVariant,
                              ),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              'Try a different filter',
                              style: AppTypography.bodySm.copyWith(
                                color: AppColors.onSurfaceVariant,
                              ),
                            ),
                          ],
                        ),
                      );
                    }
                    return LayoutBuilder(
                      builder: (context, constraints) => GridView.builder(
                        shrinkWrap: true,
                        physics: const NeverScrollableScrollPhysics(),
                        gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
                          crossAxisCount: gridColumnsForWidth(constraints.maxWidth),
                          childAspectRatio: 0.6,
                          crossAxisSpacing: 20,
                          mainAxisSpacing: 20,
                        ),
                        itemCount: filtered.length,
                        itemBuilder: (_, i) {
                          final item = filtered[i];
                          return _WatchlistPoster(
                            item: item,
                            onRemove: () => ref
                                .read(watchlistProvider.notifier)
                                .toggle(item.id, item.isTV ? 'tv' : 'movie'),
                          );
                        },
                      ),
                    );
                  },
                  loading: () => const SizedBox(
                    height: 300,
                    child: Center(child: LoadingSpinner()),
                  ),
                  error: (_, _) => const SizedBox.shrink(),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _emptyState(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 80),
      child: Column(
        children: [
          const Icon(Icons.bookmark_border, size: 64, color: AppColors.onSurfaceVariant),
          const SizedBox(height: 16),
          Text(
            'Your watchlist is empty',
            style: AppTypography.labelMd.copyWith(color: AppColors.onSurfaceVariant),
          ),
          const SizedBox(height: 8),
          Text(
            'Add movies and TV shows to keep track of what you want to watch',
            style: AppTypography.bodySm.copyWith(color: AppColors.onSurfaceVariant),
          ),
          const SizedBox(height: 24),
          AppButton(
            label: 'Browse Content',
            onPressed: () => context.go('/search'),
            fullWidth: false,
          ),
        ],
      ),
    );
  }
}

class _WatchlistPoster extends StatelessWidget {
  final MediaItem item;
  final VoidCallback onRemove;

  const _WatchlistPoster({required this.item, required this.onRemove});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () => context.push('/${item.isTV ? 'tv' : 'movie'}/${item.id}'),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Expanded(
            child: Stack(
              fit: StackFit.expand,
              children: [
                ClipRRect(
                  borderRadius: BorderRadius.circular(8),
                  child: item.posterUrl != null
                      ? CachedNetworkImage(
                          imageUrl: item.posterUrl!,
                          fit: BoxFit.cover,
                          errorWidget: (_, _, _) => _posterFallback(),
                        )
                      : _posterFallback(),
                ),
                Positioned(
                  top: 8,
                  right: 8,
                  child: InkWell(
                    onTap: onRemove,
                    child: Container(
                      padding: const EdgeInsets.all(6),
                      decoration: BoxDecoration(
                        color: Colors.black.withValues(alpha: 0.6),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: const Icon(
                        Icons.delete_outline,
                        color: Colors.white,
                        size: 16,
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 8),
          Text(
            item.title,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: AppTypography.labelMd.copyWith(color: AppColors.onSurface),
          ),
          const SizedBox(height: 4),
          Row(
            children: [
              if (item.year > 0) ...[
                Text(
                  '${item.year}',
                  style: const TextStyle(
                    color: AppColors.onSurfaceVariant,
                    fontSize: 12,
                  ),
                ),
                const SizedBox(width: 8),
              ],
              AppBadge(label: item.isTV ? 'TV' : 'Movie'),
            ],
          ),
        ],
      ),
    );
  }

  Widget _posterFallback() {
    return Container(
      color: AppColors.surfaceContainer,
      child: Center(
        child: Text(
          item.title,
          textAlign: TextAlign.center,
          style: AppTypography.bodySm.copyWith(
            color: AppColors.onSurfaceVariant,
          ),
        ),
      ),
    );
  }
}