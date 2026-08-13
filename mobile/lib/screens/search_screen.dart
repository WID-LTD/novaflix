import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../theme/app_colors.dart';
import '../theme/app_typography.dart';
import '../services/api_service.dart';
import '../models/media_item.dart';
import '../providers/store_provider.dart';
import '../widgets/ui/index.dart';
import '../widgets/features/index.dart';

final _searchResultsProvider = FutureProvider.family<List<MediaItem>, String>((ref, query) async {
  if (query.isEmpty) return [];
  final api = ref.read(apiServiceProvider);
  final res = await api.searchAll(query);
  final data = res.data['data'] as List? ?? [];
  return data.map((e) => MediaItem.fromJson(e as Map<String, dynamic>)).toList();
});

class SearchScreen extends ConsumerStatefulWidget {
  const SearchScreen({super.key});

  @override
  ConsumerState<SearchScreen> createState() => _SearchScreenState();
}

class _SearchScreenState extends ConsumerState<SearchScreen> {
  final _searchCtl = TextEditingController();
  String _query = '';
  String _tab = 'All';

  @override
  void dispose() {
    _searchCtl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final results = ref.watch(_searchResultsProvider(_query));
    final store = ref.watch(storeProvider);

    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: Column(
          children: [
            Padding(
              padding: const EdgeInsets.all(16),
              child: TextField(
                controller: _searchCtl,
                autofocus: true,
                style: const TextStyle(color: AppColors.onSurface, fontSize: 16),
                decoration: InputDecoration(
                  hintText: 'Search movies, TV shows...',
                  prefixIcon: const Icon(Icons.search, color: AppColors.onSurfaceVariant),
                  suffixIcon: _searchCtl.text.isNotEmpty
                      ? IconButton(icon: const Icon(Icons.clear, color: AppColors.onSurfaceVariant), onPressed: () { _searchCtl.clear(); setState(() => _query = ''); })
                      : null,
                  filled: true,
                  fillColor: AppColors.surfaceContainerHigh,
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                    borderSide: BorderSide.none,
                  ),
                ),
                onSubmitted: (v) => setState(() => _query = v),
                onChanged: (v) {
                  if (v.length > 2) setState(() => _query = v);
                },
              ),
            ),
            if (_query.isEmpty) ...[
              if (store.recentlySearched.isNotEmpty) ...[
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  child: Row(children: [
                    const Text('Recent Searches', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 16)),
                    const Spacer(),
                    GestureDetector(
                      onTap: () => ref.read(storeProvider.notifier).addRecentSearch(''),
                      child: const Text('Clear', style: TextStyle(color: AppColors.onSurfaceVariant, fontSize: 13)),
                    ),
                  ]),
                ),
                const SizedBox(height: 8),
                Expanded(
                  child: ListView(
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    children: store.recentlySearched.map((s) => ListTile(
                      leading: const Icon(Icons.history, color: AppColors.onSurfaceVariant, size: 20),
                      title: Text(s, style: const TextStyle(color: AppColors.onSurface)),
                      dense: true,
                      onTap: () => setState(() { _query = s; _searchCtl.text = s; }),
                    )).toList(),
                  ),
                ),
              ] else ...[
                Expanded(child: Center(child: Text('Search for movies and TV shows', style: AppTypography.bodyMd.copyWith(color: AppColors.onSurfaceVariant)))),
              ],
            ] else ...[
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                child: Row(
                  children: [
                    const Text('Results', style: TextStyle(fontWeight: FontWeight.w600)),
                    const Spacer(),
                    Text('${results.valueOrNull?.length ?? 0} found', style: const TextStyle(color: AppColors.onSurfaceVariant)),
                  ],
                ),
              ),
              Expanded(
                child: results.when(
                  data: (items) {
                    if (items.isEmpty) {
                      return const Center(child: Text('No results found'));
                    }
                    return GridView.builder(
                      padding: const EdgeInsets.symmetric(horizontal: 16),
                      gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
                        crossAxisCount: gridColumnsFor(MediaQuery.sizeOf(context).width),
                        childAspectRatio: 0.65,
                        crossAxisSpacing: 8,
                        mainAxisSpacing: 8,
                      ),
                      itemCount: items.length,
                      itemBuilder: (_, i) {
                        final item = items[i];
                        return MovieCard(item: item);
                      },
                    );
                  },
                  loading: () => const LoadingSpinner(logo: true),
                  error: (e, _) => Center(child: Text('Error: $e')),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}
