import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../theme/app_colors.dart';
import '../theme/app_typography.dart';
import '../services/api_service.dart';
import '../models/media_item.dart';
import '../widgets/ui/index.dart';

final _searchProvider = FutureProvider.family<List<MediaItem>, String>((ref, query) async {
  if (query.isEmpty) return [];
  final api = ref.read(apiServiceProvider);
  final res = await api.searchAll(query);
  final data = res.data['data'] as List? ?? res.data['results'] as List? ?? [];
  return data.map((e) => MediaItem.fromJson(e as Map<String, dynamic>)).toList();
});

class SearchResultsScreen extends ConsumerWidget {
  final String? query;
  const SearchResultsScreen({super.key, this.query});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final q = query ?? '';
    final results = ref.watch(_searchProvider(q));

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(title: Text('Results: $q')),
      body: results.when(
        data: (items) => items.isEmpty
          ? Center(child: Column(mainAxisSize: MainAxisSize.min, children: [
              Icon(Icons.search_off, size: 64, color: AppColors.onSurfaceVariant),
              const SizedBox(height: 16),
              Text('No results for "$q"', style: AppTypography.bodyMd.copyWith(color: AppColors.onSurfaceVariant)),
            ]))
          : GridView.builder(
            padding: const EdgeInsets.all(16),
            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: 2, childAspectRatio: 0.7,
              crossAxisSpacing: 12, mainAxisSpacing: 12,
            ),
            itemCount: items.length,
            itemBuilder: (_, i) {
              final item = items[i];
              return GestureDetector(
                onTap: () => context.push('/${item.isTV ? 'tv' : 'movie'}/${item.id}'),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Expanded(
                      child: Container(
                        width: double.infinity,
                        decoration: BoxDecoration(
                          color: AppColors.surfaceContainerHigh,
                          borderRadius: BorderRadius.circular(8),
                          image: item.posterUrl != null
                            ? DecorationImage(image: NetworkImage(item.posterUrl!), fit: BoxFit.cover)
                            : null,
                        ),
                        child: item.posterUrl == null
                          ? Icon(Icons.movie, color: AppColors.onSurfaceVariant, size: 40)
                          : null,
                      ),
                    ),
                    const SizedBox(height: 6),
                    Text(item.title, maxLines: 2, overflow: TextOverflow.ellipsis, style: AppTypography.bodySm.copyWith(fontWeight: FontWeight.w500)),
                    if (item.year != null) Text('${item.year}', style: TextStyle(color: AppColors.onSurfaceVariant, fontSize: 11)),
                  ],
                ),
              );
            },
          ),
        loading: () => const LoadingSpinner(logo: true),
        error: (e, _) => Center(child: Text('Error: $e', style: TextStyle(color: AppColors.error))),
      ),
    );
  }
}
