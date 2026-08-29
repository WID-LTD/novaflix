import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../core/responsive.dart';
import '../theme/app_colors.dart';
import '../theme/app_typography.dart';
import '../services/api_service.dart';
import '../models/media_item.dart';
import '../widgets/ui/index.dart';
import '../widgets/features/index.dart';
import '../widgets/movie_card.dart';

const _sortOptions = [
  ('trending', 'Trending'),
  ('top_rated', 'Top Rated'),
  ('popular', 'Most Popular'),
  ('newest', 'Newest'),
];

const _genreOptions = <(int?, String)>[
  (null, 'All Genres'),
  (28, 'Action'),
  (35, 'Comedy'),
  (18, 'Drama'),
  (27, 'Horror'),
  (10749, 'Romance'),
  (878, 'Sci-Fi'),
  (53, 'Thriller'),
  (16, 'Animation'),
  (99, 'Documentary'),
];

const _sortByFor = {
  'trending': {'movie': 'popularity.desc', 'tv': 'popularity.desc'},
  'top_rated': {'movie': 'vote_average.desc', 'tv': 'vote_average.desc'},
  'popular': {'movie': 'popularity.desc', 'tv': 'popularity.desc'},
  'newest': {'movie': 'primary_release_date.desc', 'tv': 'first_air_date.desc'},
};

List<MediaItem> _parseList(dynamic raw) {
  return (raw as List? ?? [])
      .cast<Map<String, dynamic>>()
      .map((e) => MediaItem.fromJson(e))
      .toList();
}

final _discoverResultsProvider =
    FutureProvider.family<List<MediaItem>, (String, String, int?, String)>(
  (ref, key) async {
    final (type, sort, genreId, query) = key;
    final api = ref.read(apiServiceProvider);
    try {
      if (query.trim().isNotEmpty) {
        final items = <MediaItem>[];
        if (type == 'all' || type == 'movie') {
          final m = await api.searchMedia(query.trim(), type: 'movie');
          items.addAll(_parseList(m.data['data']));
        }
        if (type == 'all' || type == 'tv') {
          final t = await api.searchMedia(query.trim(), type: 'tv');
          items.addAll(_parseList(t.data['data']));
        }
        return items.take(40).toList();
      }
      final items = <MediaItem>[];
      if (type == 'all' || type == 'movie') {
        final m = await api.getDiscover(
          genreId: genreId,
          type: 'movie',
          sortBy: _sortByFor[sort]?['movie'],
          minVotes: sort == 'top_rated' ? 100 : null,
        );
        items.addAll(_parseList(m.data['data']));
      }
      if (type == 'all' || type == 'tv') {
        final t = await api.getDiscover(
          genreId: genreId,
          type: 'tv',
          sortBy: _sortByFor[sort]?['tv'],
          minVotes: sort == 'top_rated' ? 100 : null,
        );
        items.addAll(_parseList(t.data['data']));
      }
      return items.take(60).toList();
    } catch (_) {
      return [];
    }
  },
);

class DiscoverScreen extends ConsumerStatefulWidget {
  const DiscoverScreen({super.key, this.initialSort});

  final String? initialSort;

  @override
  ConsumerState<DiscoverScreen> createState() => _DiscoverScreenState();
}

class _DiscoverScreenState extends ConsumerState<DiscoverScreen> {
  String _type = 'all';
  String _sort = 'trending';
  int? _genre;
  String _view = 'grid';
  final _searchCtl = TextEditingController();
  String _query = '';
  Timer? _debounce;

  @override
  void initState() {
    super.initState();
    if (widget.initialSort != null) _sort = widget.initialSort!;
  }

  @override
  void dispose() {
    _searchCtl.dispose();
    _debounce?.cancel();
    super.dispose();
  }

  String get _queryText => _query.trim();

  @override
  Widget build(BuildContext context) {
    final results = ref.watch(_discoverResultsProvider((_type, _sort, _genre, _queryText)));
    final width = MediaQuery.of(context).size.width;
    final size = screenSizeFor(width);
    final hPadding = responsivePadding(width);

    return Scaffold(
      backgroundColor: AppColors.background,
      body: SingleChildScrollView(
        padding: EdgeInsets.fromLTRB(hPadding, size == ScreenSize.desktop ? 40 : 24, hPadding, 48),
        child: Center(
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 1280),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    const Icon(Icons.explore, color: AppColors.primaryContainer, size: 32),
                    const SizedBox(width: 12),
                    Text('Discover', style: AppTypography.headlineLg),
                  ],
                ),
                const SizedBox(height: 20),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
                  decoration: BoxDecoration(
                    color: AppColors.surfaceContainerHigh,
                    border: Border.all(color: Colors.white10),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Row(
                    children: [
                      const Icon(Icons.search, color: Colors.grey, size: 22),
                      const SizedBox(width: 12),
                      Expanded(
                        child: TextField(
                          controller: _searchCtl,
                          style: const TextStyle(color: AppColors.onSurface, fontSize: 16),
                          decoration: const InputDecoration(
                            hintText: 'Search within discover...',
                            hintStyle: TextStyle(color: Colors.grey),
                            border: InputBorder.none,
                            isDense: true,
                          ),
                          onChanged: (v) {
                            _debounce?.cancel();
                            _debounce = Timer(const Duration(milliseconds: 300), () {
                              if (mounted) setState(() => _query = v.trim());
                            });
                          },
                        ),
                      ),
                      if (_searchCtl.text.isNotEmpty)
                        IconButton(
                          icon: const Icon(Icons.close, color: AppColors.onSurfaceVariant, size: 20),
                          onPressed: () {
                            _searchCtl.clear();
                            setState(() => _query = '');
                          },
                        ),
                    ],
                  ),
                ),
                const SizedBox(height: 20),
                Wrap(
                  spacing: 16,
                  runSpacing: 12,
                  crossAxisAlignment: WrapCrossAlignment.center,
                  children: [
                    AppTabs(
                      tabs: const ['All', 'Movies', 'TV Shows'],
                      activeIndex: _type == 'all' ? 0 : _type == 'movie' ? 1 : 2,
                      onChanged: (i) => setState(() => _type = ['all', 'movie', 'tv'][i]),
                    ),
                    Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const Icon(Icons.tune, color: AppColors.onSurfaceVariant, size: 20),
                        const SizedBox(width: 8),
                        _Select(
                          value: _sortOptions.firstWhere((o) => o.$1 == _sort).$2,
                          items: _sortOptions.map((o) => o.$2).toList(),
                          onChanged: (v) {
                            final o = _sortOptions.firstWhere((x) => x.$2 == v);
                            setState(() => _sort = o.$1);
                          },
                        ),
                        const SizedBox(width: 8),
                        _Select(
                          value: _genreOptions.firstWhere((o) => o.$1 == _genre).$2,
                          items: _genreOptions.map((o) => o.$2).toList(),
                          onChanged: (v) {
                            final o = _genreOptions.firstWhere((x) => x.$2 == v);
                            setState(() => _genre = o.$1);
                          },
                        ),
                      ],
                    ),
                    const SizedBox(width: 16),
                    _ViewToggle(
                      view: _view,
                      onChanged: (v) => setState(() => _view = v),
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                results.when(
                  data: (items) {
                    final filtered = items.where((e) {
                      if (_type == 'movie') return !e.isTV;
                      if (_type == 'tv') return e.isTV;
                      return true;
                    }).toList();
                    if (filtered.isEmpty) return const _DiscoverEmpty();
                    return Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          '${filtered.length} result${filtered.length == 1 ? '' : 's'}',
                          style: AppTypography.bodySm.copyWith(color: AppColors.onSurfaceVariant),
                        ),
                        const SizedBox(height: 16),
                        if (_view == 'grid')
                          LayoutBuilder(
                            builder: (context, constraints) => GridView.builder(
                              shrinkWrap: true,
                              physics: const NeverScrollableScrollPhysics(),
                              gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
                                crossAxisCount: gridColumns(constraints.maxWidth),
                                childAspectRatio: gridAspectRatio(
                                  constraints.maxWidth,
                                  gridColumns(constraints.maxWidth),
                                ),
                                crossAxisSpacing: 20,
                                mainAxisSpacing: 20,
                              ),
                              itemCount: filtered.length,
                              itemBuilder: (_, i) => MovieCard(item: filtered[i]),
                            ),
                          )
                        else
                          Column(
                            children: filtered
                                .map(
                                  (item) => Padding(
                                    padding: const EdgeInsets.only(bottom: 12),
                                    child: SizedBox(
                                      height: 220,
                                      child: MovieCard(item: item),
                                    ),
                                  ),
                                )
                                .toList(),
                          ),
                      ],
                    );
                  },
                  loading: () => const SizedBox(
                    height: 400,
                    child: Center(child: LoadingSpinner()),
                  ),
                  error: (e, _) => Center(
                    child: Text('Error: $e', style: const TextStyle(color: AppColors.error)),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _Select extends StatelessWidget {
  final String value;
  final List<String> items;
  final ValueChanged<String> onChanged;

  const _Select({required this.value, required this.items, required this.onChanged});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12),
      decoration: BoxDecoration(
        color: AppColors.surfaceContainerHigh,
        border: Border.all(color: AppColors.outline.withValues(alpha: 0.2)),
        borderRadius: BorderRadius.circular(8),
      ),
      child: DropdownButtonHideUnderline(
        child: DropdownButton<String>(
          value: value,
          isDense: true,
          dropdownColor: AppColors.surfaceContainerHigh,
          style: AppTypography.bodySm.copyWith(color: AppColors.onSurface),
          icon: const Icon(Icons.arrow_drop_down, color: AppColors.onSurfaceVariant),
          items: items
              .map((e) => DropdownMenuItem(value: e, child: Text(e)))
              .toList(),
          onChanged: (v) {
            if (v != null) onChanged(v);
          },
        ),
      ),
    );
  }
}

class _ViewToggle extends StatelessWidget {
  final String view;
  final ValueChanged<String> onChanged;

  const _ViewToggle({required this.view, required this.onChanged});

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        IconButton(
          icon: Icon(
            Icons.grid_view,
            color: view == 'grid'
                ? AppColors.primaryContainer
                : AppColors.onSurfaceVariant,
          ),
          onPressed: () => onChanged('grid'),
        ),
        IconButton(
          icon: Icon(
            Icons.view_list,
            color: view == 'list'
                ? AppColors.primaryContainer
                : AppColors.onSurfaceVariant,
          ),
          onPressed: () => onChanged('list'),
        ),
      ],
    );
  }
}

class _DiscoverEmpty extends StatelessWidget {
  const _DiscoverEmpty();

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 48),
      child: Column(
        children: [
          const Icon(Icons.explore, size: 64, color: AppColors.onSurfaceVariant),
          const SizedBox(height: 12),
          Text('No results', style: AppTypography.labelMd.copyWith(color: AppColors.onSurfaceVariant)),
          const SizedBox(height: 4),
          Text('Try adjusting your filters', style: AppTypography.bodySm.copyWith(color: AppColors.onSurfaceVariant)),
        ],
      ),
    );
  }
}