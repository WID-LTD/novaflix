import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../theme/app_colors.dart';
import '../theme/app_typography.dart';
import '../services/api_service.dart';

class ArchiveDetailScreen extends ConsumerWidget {
  final String? genre;
  final int? archiveId;
  const ArchiveDetailScreen({super.key, this.genre, this.archiveId});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final detail = archiveId != null
      ? ref.watch(FutureProvider((_) async {
          final api = ref.read(apiServiceProvider);
          final res = await api.getArchiveItem(archiveId!);
          return res.data['item'] as Map<String, dynamic>? ?? res.data as Map<String, dynamic>? ?? {};
        }))
      : null;

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(title: Text(genre ?? 'Archive')),
      body: detail != null
        ? detail.when(
            data: (d) {
              if (d.isEmpty) return const Center(child: Text('Item not found'));
              return SingleChildScrollView(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    if (d['poster_url'] != null)
                      ClipRRect(
                        borderRadius: BorderRadius.circular(12),
                        child: Image.network(d['poster_url'].toString(), height: 250, width: double.infinity, fit: BoxFit.cover),
                      ),
                    const SizedBox(height: 16),
                    Text(d['title']?.toString() ?? '', style: AppTypography.headlineSm),
                    if (d['year'] != null) Text(d['year'].toString(), style: TextStyle(color: AppColors.onSurfaceVariant, fontSize: 13)),
                    const SizedBox(height: 16),
                    if (d['description'] != null) Text(d['description'].toString(), style: AppTypography.bodyMd),
                  ],
                ),
              );
            },
            loading: () => const Center(child: CircularProgressIndicator()),
            error: (e, _) => Center(child: Text('Error: $e', style: TextStyle(color: AppColors.error))),
          )
        : Center(child: Column(mainAxisSize: MainAxisSize.min, children: [
            Icon(Icons.folder, size: 48, color: AppColors.onSurfaceVariant),
            const SizedBox(height: 16),
            Text('${genre ?? 'Content'} archive', style: AppTypography.bodyMd.copyWith(color: AppColors.onSurfaceVariant)),
          ])),
    );
  }
}
