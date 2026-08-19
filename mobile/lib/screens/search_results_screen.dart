import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../theme/app_colors.dart';
import '../theme/app_typography.dart';
import '../services/api_service.dart';
import '../models/media_item.dart';
import '../providers/auth_provider.dart';
import '../widgets/ui/index.dart';
import '../widgets/features/index.dart';
import '../widgets/movie_card.dart';

final _searchProvider = FutureProvider.family<List<MediaItem>, String>((
  ref,
  query,
) async {
  if (query.isEmpty) return [];
  final api = ref.read(apiServiceProvider);
  final res = await api.searchAll(query);
  final data = res.data['data'] as List? ?? res.data['results'] as List? ?? [];
  return data
      .map((e) => MediaItem.fromJson(e as Map<String, dynamic>))
      .toList();
});

final _forYouProvider = FutureProvider<List<MediaItem>>((ref) async {
  final api = ref.read(apiServiceProvider);
  try {
    final res = await api.getForYouRecommendations();
    final data = res.data['data'] as List? ?? res.data as List? ?? [];
    return data
        .map((e) => MediaItem.fromJson(e as Map<String, dynamic>))
        .toList();
  } catch (_) {
    return [];
  }
});

class SearchResultsScreen extends ConsumerStatefulWidget {
  final String? query;
  const SearchResultsScreen({super.key, this.query});

  @override
  ConsumerState<SearchResultsScreen> createState() =>
      _SearchResultsScreenState();
}

class _SearchResultsScreenState extends ConsumerState<SearchResultsScreen> {
  String _tab = 'all';

  List<MediaItem> _filter(List<MediaItem> items, String tab) {
    switch (tab) {
      case 'movie':
        return items.where((e) => e.isTV == false && e.source == 'tmdb').toList();
      case 'tv':
        return items.where((e) => e.isTV == true && e.source == 'tmdb').toList();
      case 'creator':
        return items
            .where((e) => e.source == 'creator' || e.source == 'archive')
            .toList();
      default:
        return items;
    }
  }

  @override
  Widget build(BuildContext context) {
    final q = widget.query ?? '';
    final results = ref.watch(_searchProvider(q));
    final forYou = ref.watch(_forYouProvider);
    final auth = ref.watch(authProvider);
    final isDesktop = MediaQuery.of(context).size.width >= 1024;
    final hPadding = isDesktop ? 64.0 : 16.0;

    return Scaffold(
      backgroundColor: AppColors.background,
      body: SingleChildScrollView(
        padding: EdgeInsets.fromLTRB(hPadding, isDesktop ? 40 : 24, hPadding, 48),
        child: Center(
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 1152),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    IconButton(
                      icon: const Icon(Icons.arrow_back, color: AppColors.onSurface),
                      onPressed: () => context.go('/search'),
                    ),
                    const SizedBox(width: 4),
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('Search Results', style: AppTypography.headlineMd),
                        const SizedBox(height: 2),
                        Text(
                          '\u201C$q\u201D',
                          style: AppTypography.bodySm.copyWith(
                            color: AppColors.onSurfaceVariant,
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
                const SizedBox(height: 20),
                AppTabs(
                  tabs: const ['All', 'Movies', 'TV Shows', 'Creator Content'],
                  activeIndex: _tab == 'all'
                      ? 0
                      : _tab == 'movie'
                          ? 1
                          : _tab == 'tv'
                              ? 2
                              : 3,
                  onChanged: (i) => setState(
                    () => _tab = ['all', 'movie', 'tv', 'creator'][i],
                  ),
                ),
                const SizedBox(height: 20),
                results.when(
                  data: (items) {
                    final filtered = _filter(items, _tab);
                    if (filtered.isEmpty) {
                      return Column(
                        children: [
                          const _EmptyResults(),
                          if (auth.status == AuthStatus.authenticated)
                            forYou.when(
                              data: (recs) {
                                if (recs.isEmpty) return const SizedBox.shrink();
                                return _recommendations(recs);
                              },
                              loading: () => const SizedBox.shrink(),
                              error: (_, _) => const SizedBox.shrink(),
                            ),
                        ],
                      );
                    }
                    return Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          '${filtered.length} result${filtered.length == 1 ? '' : 's'}',
                          style: AppTypography.bodySm.copyWith(
                            color: AppColors.onSurfaceVariant,
                          ),
                        ),
                        const SizedBox(height: 16),
                        GridView.builder(
                          shrinkWrap: true,
                          physics: const NeverScrollableScrollPhysics(),
                          gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
                            crossAxisCount: gridColumnsFor(
                              MediaQuery.of(context).size.width,
                            ),
                            childAspectRatio: 0.6,
                            crossAxisSpacing: 16,
                            mainAxisSpacing: 16,
                          ),
                          itemCount: filtered.length,
                          itemBuilder: (_, i) {
                            final item = filtered[i];
                            final isCreator = item.source == 'creator' ||
                                item.source == 'archive';
                            if (isCreator) return _CreatorCard(item: item);
                            return MovieCard(item: item);
                          },
                        ),
                      ],
                    );
                  },
                  loading: () => const SizedBox(
                    height: 400,
                    child: Center(child: LoadingSpinner()),
                  ),
                  error: (e, _) => Center(
                    child: Text(
                      'Error: $e',
                      style: const TextStyle(color: AppColors.error),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _recommendations(List<MediaItem> recs) {
    return Padding(
      padding: const EdgeInsets.only(top: 32),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Divider(color: Colors.white10, height: 1),
          const SizedBox(height: 32),
          Text('You May Want to Check Out', style: AppTypography.headlineMd),
          const SizedBox(height: 4),
          Text(
            'Personalized recommendations based on your watch history',
            style: AppTypography.bodySm.copyWith(color: AppColors.onSurfaceVariant),
          ),
          const SizedBox(height: 16),
          GridView.builder(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: gridColumnsFor(MediaQuery.of(context).size.width),
              childAspectRatio: 0.6,
              crossAxisSpacing: 16,
              mainAxisSpacing: 16,
            ),
            itemCount: recs.take(8).length,
            itemBuilder: (_, i) => MovieCard(item: recs[i]),
          ),
        ],
      ),
    );
  }
}

class _CreatorCard extends StatelessWidget {
  final MediaItem item;
  const _CreatorCard({required this.item});

  @override
  Widget build(BuildContext context) {
    final sourceLabel = item.source == 'archive' ? 'Archive' : 'Creator';
    return GestureDetector(
      onTap: () => context.go('/watch?id=${item.id}&type=movie'),
      child: Container(
        decoration: BoxDecoration(
          color: AppColors.surfaceContainerHigh,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: Colors.white.withValues(alpha: 0.05)),
        ),
        clipBehavior: Clip.antiAlias,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Expanded(
              child: Stack(
                fit: StackFit.expand,
                children: [
                  if (item.posterUrl != null)
                    CachedNetworkImage(
                      imageUrl: item.posterUrl!,
                      fit: BoxFit.cover,
                      errorWidget: (_, _, _) => _noPoster(),
                    )
                  else
                    _noPoster(),
                  Positioned(
                    top: 8,
                    left: 8,
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                      decoration: BoxDecoration(
                        color: AppColors.primaryContainer,
                        borderRadius: BorderRadius.circular(999),
                      ),
                      child: Text(
                        sourceLabel.toUpperCase(),
                        style: const TextStyle(
                          color: AppColors.onPrimaryContainer,
                          fontSize: 10,
                          fontWeight: FontWeight.w700,
                          letterSpacing: 1,
                        ),
                      ),
                    ),
                  ),
                  Positioned.fill(
                    child: Center(
                      child: Container(
                        width: 48,
                        height: 48,
                        decoration: BoxDecoration(
                          color: Colors.black.withValues(alpha: 0.5),
                          shape: BoxShape.circle,
                        ),
                        child: const Icon(Icons.play_circle, color: Colors.white, size: 28),
                      ),
                    ),
                  ),
                ],
              ),
            ),
            Padding(
              padding: const EdgeInsets.all(12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    item.title,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: AppTypography.labelMd.copyWith(color: AppColors.onSurface),
                  ),
                  if (item.year > 0) ...[
                    const SizedBox(height: 4),
                    Text(
                      '${item.year}',
                      style: const TextStyle(
                        color: AppColors.onSurfaceVariant,
                        fontSize: 12,
                      ),
                    ),
                  ],
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _noPoster() {
    return Container(
      color: AppColors.surfaceContainer,
      child: const Icon(Icons.movie, color: AppColors.onSurfaceVariant, size: 40),
    );
  }
}

class _EmptyResults extends StatelessWidget {
  const _EmptyResults();

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 48),
      child: Column(
        children: [
          const Icon(Icons.search, size: 64, color: AppColors.onSurfaceVariant),
          const SizedBox(height: 12),
          Text('No results found', style: AppTypography.labelMd.copyWith(color: AppColors.onSurfaceVariant)),
          const SizedBox(height: 4),
          Text('Try a different search term', style: AppTypography.bodySm.copyWith(color: AppColors.onSurfaceVariant)),
        ],
      ),
    );
  }
}