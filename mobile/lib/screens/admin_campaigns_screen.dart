import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../theme/app_colors.dart';
import '../theme/app_typography.dart';
import '../services/api_service.dart';
import '../widgets/ui/index.dart';

final _allCampaignsProvider = FutureProvider<List<Map<String, dynamic>>>((ref) async {
  final api = ref.read(apiServiceProvider);
  final res = await api.getCampaigns();
  final data = res.data['campaigns'] as List? ?? [];
  return data.cast<Map<String, dynamic>>();
});

class AdminCampaignsScreen extends ConsumerWidget {
  const AdminCampaignsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final campaigns = ref.watch(_allCampaignsProvider);
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(title: const Text('Campaigns')),
      body: campaigns.when(
        data: (items) => items.isEmpty
          ? Center(child: Column(mainAxisSize: MainAxisSize.min, children: [
              Icon(Icons.campaign, size: 64, color: AppColors.onSurfaceVariant),
              const SizedBox(height: 16),
              Text('No campaigns', style: AppTypography.bodyMd.copyWith(color: AppColors.onSurfaceVariant)),
            ]))
          : ListView.builder(
            padding: const EdgeInsets.all(16),
            itemCount: items.length,
            itemBuilder: (_, i) {
              final c = items[i];
              final approved = (c['approved'] as bool?) == true;
              final active = (c['active'] as bool?) == true;
              return Container(
                margin: const EdgeInsets.only(bottom: 12),
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: AppColors.surfaceContainerHigh,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(children: [
                      if (c['creative_url'] != null)
                        ClipRRect(
                          borderRadius: BorderRadius.circular(4),
                          child: Image.network(c['creative_url'].toString(), width: 48, height: 48, fit: BoxFit.cover, errorBuilder: (_, __, ___) => Container(width: 48, height: 48, color: AppColors.surfaceContainerHighest, child: const Icon(Icons.image, size: 24))),
                        ),
                      const SizedBox(width: 12),
                      Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                        Text(c['advertiser_name']?.toString() ?? '', style: AppTypography.bodyMd.copyWith(fontWeight: FontWeight.w600)),
                        Text('${c['promotion_type'] ?? ''} · ${c['target_genre'] ?? ''}', style: TextStyle(color: AppColors.onSurfaceVariant, fontSize: 12)),
                      ])),
                      Column(children: [
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                          decoration: BoxDecoration(
                            color: approved ? Colors.green.withValues(alpha: 0.2) : Colors.orange.withValues(alpha: 0.2),
                            borderRadius: BorderRadius.circular(4),
                          ),
                          child: Text(approved ? 'Approved' : 'Pending', style: TextStyle(fontSize: 10, color: approved ? Colors.green : Colors.orange)),
                        ),
                        const SizedBox(height: 4),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                          decoration: BoxDecoration(
                            color: active ? Colors.green.withValues(alpha: 0.2) : Colors.grey.withValues(alpha: 0.2),
                            borderRadius: BorderRadius.circular(4),
                          ),
                          child: Text(active ? 'Active' : 'Paused', style: TextStyle(fontSize: 10, color: active ? Colors.green : Colors.grey)),
                        ),
                      ]),
                    ]),
                    const SizedBox(height: 8),
                    Text('Impressions: ${c['current_impressions'] ?? 0} / ${c['max_impressions'] ?? 0}', style: TextStyle(color: AppColors.onSurfaceVariant, fontSize: 12)),
                    Text('Budget: \$${(c['budget'] as num?)?.toStringAsFixed(2) ?? '0'}  Spent: \$${(c['spent'] as num?)?.toStringAsFixed(2) ?? '0'}', style: TextStyle(color: AppColors.onSurfaceVariant, fontSize: 12)),
                  ],
                ),
              );
            },
          ),
        loading: () => const LoadingSpinner(),
        error: (e, _) => Center(child: Text('Error: $e', style: TextStyle(color: AppColors.error))),
      ),
    );
  }
}
