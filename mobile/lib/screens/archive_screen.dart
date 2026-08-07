import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../theme/app_colors.dart';
import '../theme/app_typography.dart';
import '../services/api_service.dart';
import '../widgets/ui/index.dart';

final _archiveProvider = FutureProvider<List<Map<String, dynamic>>>((ref) async {
  final api = ref.read(apiServiceProvider);
  final res = await api.getArchiveItems();
  final data = res.data['items'] as List? ?? res.data['data'] as List? ?? [];
  return data.cast<Map<String, dynamic>>();
});

class ArchiveScreen extends ConsumerWidget {
  const ArchiveScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final archive = ref.watch(_archiveProvider);
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(title: const Text('Archive')),
      body: archive.when(
        data: (items) => items.isEmpty
          ? Center(child: Column(mainAxisSize: MainAxisSize.min, children: [
              Icon(Icons.archive, size: 64, color: AppColors.onSurfaceVariant),
              const SizedBox(height: 16),
              Text('Archive is empty', style: AppTypography.bodyMd.copyWith(color: AppColors.onSurfaceVariant)),
            ]))
          : GridView.builder(
            padding: const EdgeInsets.all(16),
            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: 2, childAspectRatio: 1.5,
              crossAxisSpacing: 12, mainAxisSpacing: 12,
            ),
            itemCount: items.length,
            itemBuilder: (_, i) {
              final item = items[i];
              return GestureDetector(
                onTap: () => context.push('/archive/${item['id']}'),
                child: Container(
                  decoration: BoxDecoration(
                    color: AppColors.surfaceContainerHigh,
                    borderRadius: BorderRadius.circular(12),
                    image: item['poster_url'] != null
                      ? DecorationImage(image: NetworkImage(item['poster_url'].toString()), fit: BoxFit.cover)
                      : null,
                  ),
                  child: Container(
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(12),
                      gradient: LinearGradient(
                        begin: Alignment.topCenter, end: Alignment.bottomCenter,
                        colors: [Colors.transparent, AppColors.background.withValues(alpha: 0.8)],
                      ),
                    ),
                    padding: const EdgeInsets.all(12),
                    alignment: Alignment.bottomLeft,
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(item['title']?.toString() ?? '', style: AppTypography.bodySm.copyWith(fontWeight: FontWeight.w600, color: Colors.white)),
                        if (item['year'] != null) Text(item['year'].toString(), style: const TextStyle(color: Colors.white70, fontSize: 11)),
                      ],
                    ),
                  ),
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
