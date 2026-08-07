import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../theme/app_colors.dart';
import '../theme/app_typography.dart';
import '../services/api_service.dart';
import '../widgets/ui/index.dart';

final _coursesProvider = FutureProvider<List<Map<String, dynamic>>>((ref) async {
  final api = ref.read(apiServiceProvider);
  final res = await api.getCourses();
  final data = res.data['courses'] as List? ?? res.data['data'] as List? ?? [];
  return data.cast<Map<String, dynamic>>();
});

class LearnScreen extends ConsumerWidget {
  const LearnScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final courses = ref.watch(_coursesProvider);
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(title: const Text('E-Learning')),
      body: courses.when(
        data: (items) => items.isEmpty
          ? Center(child: Column(mainAxisSize: MainAxisSize.min, children: [
              Icon(Icons.school, size: 64, color: AppColors.onSurfaceVariant),
              const SizedBox(height: 16),
              Text('No courses available', style: AppTypography.bodyMd.copyWith(color: AppColors.onSurfaceVariant)),
            ]))
          : ListView.builder(
            padding: const EdgeInsets.all(16),
            itemCount: items.length,
            itemBuilder: (_, i) {
              final c = items[i];
              return Container(
                margin: const EdgeInsets.only(bottom: 12),
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: AppColors.surfaceContainerHigh,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Row(
                  children: [
                    Container(
                      width: 60, height: 60,
                      decoration: BoxDecoration(
                        color: AppColors.primary.withValues(alpha: 0.1),
                        borderRadius: BorderRadius.circular(8),
                        image: c['image_url'] != null ? DecorationImage(image: NetworkImage(c['image_url']), fit: BoxFit.cover) : null,
                      ),
                      child: c['image_url'] == null ? const Icon(Icons.school, color: AppColors.primary) : null,
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(c['title']?.toString() ?? '', style: AppTypography.bodyMd.copyWith(fontWeight: FontWeight.w600), maxLines: 1, overflow: TextOverflow.ellipsis),
                          if (c['description'] != null) Text(c['description']?.toString() ?? '', style: TextStyle(color: AppColors.onSurfaceVariant, fontSize: 13), maxLines: 2, overflow: TextOverflow.ellipsis),
                          Row(children: [
                            Icon(Icons.star, size: 14, color: Colors.amber),
                            Text(' ${(c['rating'] as num?)?.toStringAsFixed(1) ?? 'N/A'}', style: const TextStyle(fontSize: 13)),
                            if (c['lessons_count'] != null) Text('  |  ${c['lessons_count']} lessons', style: TextStyle(color: AppColors.onSurfaceVariant, fontSize: 12)),
                            if (c['duration'] != null) Text('  |  ${c['duration']}min', style: TextStyle(color: AppColors.onSurfaceVariant, fontSize: 12)),
                          ]),
                        ],
                      ),
                    ),
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
