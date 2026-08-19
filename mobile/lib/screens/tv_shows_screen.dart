import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../theme/app_colors.dart';
import '../theme/app_typography.dart';
import '../services/api_service.dart';
import '../models/media_item.dart';
import '../widgets/features/index.dart';
import '../widgets/ui/index.dart';

final _tvSearchProvider = FutureProvider.family<List<MediaItem>, String>((
  ref,
  keyword,
) async {
  if (keyword.isEmpty) return [];
  final api = ref.read(apiServiceProvider);
  final res = await api.searchMedia(keyword, type: 'tv');
  final data = res.data['data'] as List? ?? [];
  return data.map((e) => MediaItem.fromJson(e as Map<String, dynamic>)).toList();
});

final _tvTrendingProvider = FutureProvider<List<MediaItem>>((ref) async {
  final api = ref.read(apiServiceProvider);
  final res = await api.getTrending();
  final data = res.data['data'] as Map<String, dynamic>? ?? res.data as Map<String, dynamic>;
  final tv = (data['tv'] as List?)?.map((e) => MediaItem.fromJson(e as Map<String, dynamic>)).toList() ?? <MediaItem>[];
  return tv;
});

const _tabs = [
  ('all', 'All'),
  ('action', 'Action'),
  ('comedy', 'Comedy'),
  ('drama', 'Drama'),
  ('sci-fi', 'Sci-Fi'),
  ('horror', 'Horror'),
];

const _genreKeywords = {
  'action': 'mission impossible',
  'comedy': 'the office',
  'drama': 'this is us',
  'sci-fi': 'black mirror',
  'horror': 'the walking dead',
};

class TVShowsScreen extends ConsumerStatefulWidget {
  const TVShowsScreen({super.key});

  @override
  ConsumerState<TVShowsScreen> createState() => _TVShowsScreenState();
}

class _TVShowsScreenState extends ConsumerState<TVShowsScreen> {
  String _tab = 'all';

  @override
  Widget build(BuildContext context) {
    final trending = ref.watch(_tvTrendingProvider);
    final popular = ref.watch(_tvSearchProvider('game of thrones'));
    final topRated = ref.watch(_tvSearchProvider('breaking bad'));
    final newReleases = ref.watch(_tvSearchProvider('2024'));
    final genreItems = _tab == 'all'
        ? null
        : ref.watch(_tvSearchProvider(_genreKeywords[_tab]!));
    final isDesktop = MediaQuery.of(context).size.width >= 1024;
    final hPadding = isDesktop ? 64.0 : 16.0;

    return Scaffold(
      backgroundColor: AppColors.background,
      body: SingleChildScrollView(
        padding: EdgeInsets.fromLTRB(hPadding, isDesktop ? 40 : 24, hPadding, 48),
        child: Center(
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 1440),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    const Icon(Icons.tv, color: AppColors.primaryContainer, size: 32),
                    const SizedBox(width: 12),
                    Text('TV Shows', style: AppTypography.headlineLg),
                  ],
                ),
                const SizedBox(height: 16),
                AppTabs(
                  tabs: _tabs.map((t) => t.$2).toList(),
                  activeIndex: _tabs.indexWhere((t) => t.$1 == _tab),
                  onChanged: (i) => setState(() => _tab = _tabs[i].$1),
                ),
                const SizedBox(height: 24),
                if (_tab == 'all') ...[
                  _row('Trending', trending, () => context.go('/discover?sort=trending&type=tv')),
                  _row('Popular', popular, () => context.go('/discover?sort=popular&type=tv')),
                  _row('Top Rated', topRated, () => context.go('/discover?sort=top_rated&type=tv')),
                  _row('New Releases', newReleases, () => context.go('/discover?sort=newest&type=tv')),
                ] else
                  genreItems!.when(
                    data: (items) => ContentRow(
                      title: _tabs.firstWhere((t) => t.$1 == _tab).$2,
                      items: items.take(20).toList(),
                      onSeeAll: () => context.go('/discover?sort=trending&type=tv'),
                    ),
                    loading: () => const SizedBox(height: 220, child: LoadingSpinner()),
                    error: (_, _) => const SizedBox.shrink(),
                  ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _row(String title, AsyncValue<List<MediaItem>> items, VoidCallback? onSeeAll) {
    return items.when(
      data: (list) => ContentRow(
        title: title,
        items: list.take(20).toList(),
        onSeeAll: onSeeAll,
      ),
      loading: () => const SizedBox(height: 220, child: Center(child: LoadingSpinner(size: 28))),
      error: (_, _) => const SizedBox.shrink(),
    );
  }
}