import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../theme/app_colors.dart';
import '../theme/app_typography.dart';
import '../services/api_service.dart';
import '../models/payout.dart';
import '../widgets/ui/index.dart';

final _dashboardProvider = FutureProvider<DashboardStats?>((ref) async {
  final api = ref.read(apiServiceProvider);
  try {
    final res = await api.getCreatorDashboard();
    final data = res.data['dashboard'] as Map<String, dynamic>? ?? res.data as Map<String, dynamic>;
    return DashboardStats.fromJson(data);
  } catch (_) {
    return null;
  }
});

class CreatorDashboardScreen extends ConsumerWidget {
  const CreatorDashboardScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final dashboard = ref.watch(_dashboardProvider);

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(title: const Text('Creator Dashboard')),
      body: dashboard.when(
        data: (stats) {
          if (stats == null) return const Center(child: Text('No data'));
          return SingleChildScrollView(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Overview', style: AppTypography.headlineSm),
                const SizedBox(height: 12),
                Row(
                  children: [
                    _statCard('Views', '${stats.totalViews}', Icons.visibility),
                    const SizedBox(width: 8),
                    _statCard('Likes', '${stats.totalLikes}', Icons.favorite),
                    const SizedBox(width: 8),
                    _statCard('Films', '${stats.totalFilms}', Icons.movie),
                  ],
                ),
                const SizedBox(height: 8),
                Row(
                  children: [
                    _statCard('Comments', '${stats.totalComments}', Icons.comment),
                    const SizedBox(width: 8),
                    _statCard('Revenue', stats.revenue?.toStringAsFixed(2) ?? '\$0', Icons.attach_money),
                  ],
                ),
                const SizedBox(height: 24),
                Text('Recent Uploads', style: AppTypography.headlineSm),
                const SizedBox(height: 8),
                if (stats.recentUploads.isEmpty)
                  const Text('No uploads yet', style: TextStyle(color: AppColors.onSurfaceVariant))
                else
                  ...stats.recentUploads.map((u) => Container(
                    padding: const EdgeInsets.all(12),
                    margin: const EdgeInsets.only(bottom: 8),
                    decoration: BoxDecoration(
                      color: AppColors.surfaceContainerHigh,
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Row(
                      children: [
                        Icon(Icons.movie, color: AppColors.primary, size: 20),
                        const SizedBox(width: 12),
                        Expanded(child: Text(u['title']?.toString() ?? 'Untitled', style: AppTypography.bodyMd)),
                        Text('${u['views'] ?? 0} views', style: const TextStyle(color: AppColors.onSurfaceVariant, fontSize: 12)),
                      ],
                    ),
                  )),
              ],
            ),
          );
        },
        loading: () => const LoadingSpinner(),
        error: (e, _) => Center(child: Text('Error: $e')),
      ),
    );
  }

  Widget _statCard(String label, String value, IconData icon) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: AppColors.surfaceContainerHigh,
          borderRadius: BorderRadius.circular(12),
        ),
        child: Column(
          children: [
            Icon(icon, color: AppColors.primary, size: 24),
            const SizedBox(height: 8),
            Text(value, style: AppTypography.headlineSm),
            Text(label, style: const TextStyle(color: AppColors.onSurfaceVariant, fontSize: 12)),
          ],
        ),
      ),
    );
  }
}
