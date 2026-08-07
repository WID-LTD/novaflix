import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../theme/app_colors.dart';
import '../theme/app_typography.dart';
import '../services/api_service.dart';
import '../widgets/ui/index.dart';

final _adminStatsProvider = FutureProvider<Map<String, dynamic>?>((ref) async {
  final api = ref.read(apiServiceProvider);
  try {
    final res = await api.adminGetStats();
    return res.data['stats'] as Map<String, dynamic>?;
  } catch (_) { return null; }
});

final _adminUsersProvider = FutureProvider<List<Map<String, dynamic>>?>((ref) async {
  final api = ref.read(apiServiceProvider);
  try {
    final res = await api.adminGetUsers();
    final data = res.data['users'] as List? ?? [];
    return data.cast<Map<String, dynamic>>();
  } catch (_) { return null; }
});

class AdminDashboardScreen extends ConsumerStatefulWidget {
  const AdminDashboardScreen({super.key});

  @override
  ConsumerState<AdminDashboardScreen> createState() => _AdminDashboardScreenState();
}

class _AdminDashboardScreenState extends ConsumerState<AdminDashboardScreen> {
  int _tab = 0;

  @override
  Widget build(BuildContext context) {
    final stats = ref.watch(_adminStatsProvider);
    final users = ref.watch(_adminUsersProvider);

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(title: const Text('Admin Dashboard')),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(16),
            child: Row(
              children: [
                _tabBtn('Stats', 0), _tabBtn('Users', 1), _tabBtn('Creators', 2), _tabBtn('Uploads', 3),
              ],
            ),
          ),
          Expanded(
            child: _tab == 0
                ? _buildStats(stats)
                : const Center(child: Text('Coming soon', style: TextStyle(color: AppColors.onSurfaceVariant))),
          ),
        ],
      ),
    );
  }

  Widget _tabBtn(String label, int idx) {
    final active = _tab == idx;
    return Expanded(
      child: GestureDetector(
        onTap: () => setState(() => _tab = idx),
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 8),
          margin: const EdgeInsets.symmetric(horizontal: 2),
          decoration: BoxDecoration(
            color: active ? AppColors.primary.withValues(alpha: 0.2) : AppColors.transparent,
            borderRadius: BorderRadius.circular(8),
          ),
          child: Text(label, textAlign: TextAlign.center,
            style: TextStyle(fontSize: 13, color: active ? AppColors.primary : AppColors.onSurfaceVariant, fontWeight: active ? FontWeight.w600 : FontWeight.normal)),
        ),
      ),
    );
  }

  Widget _buildStats(AsyncValue<Map<String, dynamic>?> statsData) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: statsData.when(
        data: (data) {
          if (data == null) return const Center(child: Text('No stats available'));
          return Wrap(
            spacing: 12, runSpacing: 12,
            children: data.entries.map((e) => Container(
              width: (MediaQuery.of(context).size.width - 44) / 2,
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: AppColors.surfaceContainerHigh,
                borderRadius: BorderRadius.circular(12),
              ),
              child: Column(
                children: [
                  Text('${e.value}', style: AppTypography.headlineMd),
                  const SizedBox(height: 4),
                  Text(e.key, style: TextStyle(color: AppColors.onSurfaceVariant, fontSize: 13)),
                ],
              ),
            )).toList(),
          );
        },
        loading: () => const LoadingSpinner(logo: true),
        error: (_, __) => const Center(child: Text('Error loading stats')),
      ),
    );
  }
}
