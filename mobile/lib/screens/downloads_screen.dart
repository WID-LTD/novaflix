import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../theme/app_colors.dart';
import '../theme/app_typography.dart';
import '../services/api_service.dart';

final _downloadsProvider = FutureProvider<List<Map<String, dynamic>>>((ref) async {
  final api = ref.read(apiServiceProvider);
  final res = await api.getDownloadedFiles();
  final data = res.data['files'] as List? ?? [];
  return data.cast<Map<String, dynamic>>();
});

class DownloadsScreen extends ConsumerWidget {
  const DownloadsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final downloads = ref.watch(_downloadsProvider);
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(title: const Text('Downloads')),
      body: downloads.when(
        data: (items) => items.isEmpty
          ? Center(child: Column(mainAxisSize: MainAxisSize.min, children: [
              Icon(Icons.download, size: 64, color: AppColors.onSurfaceVariant),
              const SizedBox(height: 16),
              Text('No downloads yet', style: AppTypography.bodyLg.copyWith(color: AppColors.onSurfaceVariant)),
              const SizedBox(height: 8),
              Text('Download movies and shows to watch offline',
                style: TextStyle(color: AppColors.onSurfaceVariant, fontSize: 13)),
            ]))
          : ListView.builder(
            padding: const EdgeInsets.all(16),
            itemCount: items.length,
            itemBuilder: (_, i) {
              final d = items[i];
              return Container(
                margin: const EdgeInsets.only(bottom: 8),
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: AppColors.surfaceContainerHigh,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Row(
                  children: [
                    Icon(Icons.movie, color: AppColors.primary, size: 24),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(d['name']?.toString() ?? '', style: AppTypography.bodyMd, maxLines: 1, overflow: TextOverflow.ellipsis),
                          if (d['sizeLabel'] != null || d['createdAt'] != null)
                            Text('${d['sizeLabel'] ?? ''}  ${d['createdAt'] ?? ''}', style: TextStyle(color: AppColors.onSurfaceVariant, fontSize: 12)),
                        ],
                      ),
                    ),
                    IconButton(
                      icon: const Icon(Icons.play_circle, color: AppColors.primary),
                      onPressed: () {},
                    ),
                    IconButton(
                      icon: const Icon(Icons.delete_outline, color: AppColors.error),
                      onPressed: () async {
                        try {
                          final api = ref.read(apiServiceProvider);
                          await api.deleteDownloadedFile(d['name'].toString());
                          ref.invalidate(_downloadsProvider);
                        } catch (_) {}
                      },
                    ),
                  ],
                ),
              );
            },
          ),
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(child: Text('Error: $e', style: TextStyle(color: AppColors.error))),
      ),
    );
  }
}
