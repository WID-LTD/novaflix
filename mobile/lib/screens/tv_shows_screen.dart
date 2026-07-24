import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../theme/app_colors.dart';
import '../theme/app_typography.dart';
import '../services/api_service.dart';
import '../models/media_item.dart';
import '../widgets/features/index.dart';

final _tvTrendingProvider = FutureProvider<List<MediaItem>>((ref) async {
  final api = ref.read(apiServiceProvider);
  final res = await api.getTrending();
  final data = res.data['data'] as Map<String, dynamic>? ?? res.data as Map<String, dynamic>;
  final tv = (data['tv'] as List?)?.map((e) => MediaItem.fromJson(e as Map<String, dynamic>)).toList() ?? <MediaItem>[];
  return tv;
});

final _tvTopRatedProvider = FutureProvider<List<MediaItem>>((ref) async {
  final api = ref.read(apiServiceProvider);
  final res = await api.searchMedia('', type: 'tv');
  final data = res.data['data'] as List? ?? [];
  return data.map((e) => MediaItem.fromJson(e as Map<String, dynamic>)).toList();
});

class TVShowsScreen extends ConsumerWidget {
  const TVShowsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final trending = ref.watch(_tvTrendingProvider);
    final topRated = ref.watch(_tvTopRatedProvider);

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(title: const Text('TV Shows')),
      body: RefreshIndicator(
        onRefresh: () async { ref.invalidate(_tvTrendingProvider); ref.invalidate(_tvTopRatedProvider); },
        child: SingleChildScrollView(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              trending.when(
                data: (items) => ContentRow(title: 'Trending TV Shows', items: items),
                loading: () => const SizedBox(height: 220, child: Center(child: CircularProgressIndicator())),
                error: (_, __) => const SizedBox.shrink(),
              ),
              topRated.when(
                data: (items) => ContentRow(title: 'Top Rated TV Shows', items: items),
                loading: () => const SizedBox(height: 220, child: Center(child: CircularProgressIndicator())),
                error: (_, __) => const SizedBox.shrink(),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
