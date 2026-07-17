import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../services/api_service.dart';
import '../models/payout.dart';
import '../theme/app_theme.dart';

final _dashboardProvider = FutureProvider<DashboardStats?>((ref) async {
  try {
    final api = ref.read(apiServiceProvider);
    final res = await api.getCreatorDashboard();
    return DashboardStats.fromJson(res.data as Map<String, dynamic>);
  } catch (_) {
    return null;
  }
});

class CreatorDashboardScreen extends ConsumerStatefulWidget {
  const CreatorDashboardScreen({super.key});

  @override
  ConsumerState<CreatorDashboardScreen> createState() => _CreatorDashboardScreenState();
}

class _CreatorDashboardScreenState extends ConsumerState<CreatorDashboardScreen> with SingleTickerProviderStateMixin {
  late TabController _tabCtrl;

  @override
  void initState() {
    super.initState();
    _tabCtrl = TabController(length: 3, vsync: this);
  }

  @override
  void dispose() {
    _tabCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final dashboard = ref.watch(_dashboardProvider);

    return Scaffold(
      backgroundColor: AppTheme.black,
      appBar: AppBar(
        title: const Text('Creator Dashboard'),
        bottom: TabBar(
          controller: _tabCtrl,
          indicatorColor: AppTheme.red,
          labelColor: AppTheme.white,
          unselectedLabelColor: AppTheme.gray,
          tabs: const [
            Tab(text: 'Overview'),
            Tab(text: 'Content'),
            Tab(text: 'Analytics'),
          ],
        ),
      ),
      body: TabBarView(
        controller: _tabCtrl,
        children: [
          _OverviewTab(dashboard: dashboard),
          const _ContentTab(),
          const _AnalyticsTab(),
        ],
      ),
    );
  }
}

class _OverviewTab extends StatelessWidget {
  final AsyncValue<DashboardStats?> dashboard;
  const _OverviewTab({required this.dashboard});

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: dashboard.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(child: Text('Failed to load dashboard', style: TextStyle(color: AppTheme.gray.withValues(alpha: 0.7)))),
        data: (stats) {
          if (stats == null) {
            return Center(child: Text('Could not load stats', style: TextStyle(color: AppTheme.gray.withValues(alpha: 0.7))));
          }

          return Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  _StatCard(label: 'Views', value: '${stats.totalViews}', icon: Icons.visibility),
                  const SizedBox(width: 12),
                  _StatCard(label: 'Likes', value: '${stats.totalLikes}', icon: Icons.favorite),
                ],
              ),
              const SizedBox(height: 12),
              Row(
                children: [
                  _StatCard(label: 'Comments', value: '${stats.totalComments}', icon: Icons.comment),
                  const SizedBox(width: 12),
                  _StatCard(label: 'Films', value: '${stats.totalFilms}', icon: Icons.movie),
                ],
              ),
              const SizedBox(height: 24),
              const Text('Recent Uploads', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w600, color: AppTheme.white)),
              const SizedBox(height: 12),
              if (stats.recentUploads.isEmpty)
                Text('No uploads yet', style: TextStyle(color: AppTheme.gray.withValues(alpha: 0.7)))
              else
                ...stats.recentUploads.map((u) => Card(
                  color: AppTheme.card,
                  margin: const EdgeInsets.only(bottom: 8),
                  child: ListTile(
                    title: Text(u['title']?.toString() ?? 'Untitled', style: const TextStyle(color: AppTheme.white)),
                    subtitle: Text(u['created_at']?.toString() ?? '', style: const TextStyle(color: AppTheme.gray, fontSize: 12)),
                  ),
                )),
            ],
          );
        },
      ),
    );
  }
}

class _StatCard extends StatelessWidget {
  final String label;
  final String value;
  final IconData icon;
  const _StatCard({required this.label, required this.value, required this.icon});

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(color: AppTheme.card, borderRadius: BorderRadius.circular(12)),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Icon(icon, color: AppTheme.red, size: 24),
            const SizedBox(height: 8),
            Text(value, style: const TextStyle(fontSize: 28, fontWeight: FontWeight.w900, color: AppTheme.white)),
            Text(label, style: TextStyle(color: AppTheme.gray.withValues(alpha: 0.7), fontSize: 13)),
          ],
        ),
      ),
    );
  }
}

class _ContentTab extends StatelessWidget {
  const _ContentTab();

  @override
  Widget build(BuildContext context) {
    return Center(child: Text('Content management coming soon', style: TextStyle(color: AppTheme.gray.withValues(alpha: 0.7))));
  }
}

class _AnalyticsTab extends StatelessWidget {
  const _AnalyticsTab();

  @override
  Widget build(BuildContext context) {
    return Center(child: Text('Analytics coming soon', style: TextStyle(color: AppTheme.gray.withValues(alpha: 0.7))));
  }
}
