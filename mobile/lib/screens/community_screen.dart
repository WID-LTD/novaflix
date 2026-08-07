import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../theme/app_colors.dart';
import '../theme/app_typography.dart';
import '../services/api_service.dart';
import '../widgets/ui/index.dart';

final _communitiesProvider = FutureProvider<List<Map<String, dynamic>>>((ref) async {
  final api = ref.read(apiServiceProvider);
  final res = await api.getCommunities();
  final data = res.data['communities'] as List? ?? [];
  return data.cast<Map<String, dynamic>>();
});

class CommunityScreen extends ConsumerWidget {
  const CommunityScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final communities = ref.watch(_communitiesProvider);
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(title: const Text('Community')),
      body: communities.when(
        data: (items) => items.isEmpty
          ? Center(child: Column(mainAxisSize: MainAxisSize.min, children: [
              Icon(Icons.people, size: 64, color: AppColors.onSurfaceVariant),
              const SizedBox(height: 16),
              Text('No communities yet', style: AppTypography.bodyMd.copyWith(color: AppColors.onSurfaceVariant)),
            ]))
          : ListView.builder(
            padding: const EdgeInsets.all(16),
            itemCount: items.length,
            itemBuilder: (_, i) {
              final item = items[i];
              return GestureDetector(
                onTap: () => context.push('/community/${item['id']}'),
                child: Container(
                  margin: const EdgeInsets.only(bottom: 12),
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: AppColors.surfaceContainerHigh,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Row(
                    children: [
                      CircleAvatar(
                        radius: 24,
                        backgroundColor: AppColors.surfaceContainerHighest,
                        backgroundImage: item['avatar'] != null ? NetworkImage(item['avatar'].toString()) : null,
                        child: item['avatar'] == null ? const Icon(Icons.people, color: AppColors.onSurfaceVariant) : null,
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(item['name']?.toString() ?? '', style: AppTypography.bodyMd.copyWith(fontWeight: FontWeight.w600)),
                            if (item['description'] != null) Text(item['description'].toString(), style: TextStyle(color: AppColors.onSurfaceVariant, fontSize: 13), maxLines: 2, overflow: TextOverflow.ellipsis),
                            if (item['member_count'] != null) Text('${item['member_count']} members', style: const TextStyle(color: AppColors.onSurfaceVariant, fontSize: 12)),
                          ],
                        ),
                      ),
                    ],
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
