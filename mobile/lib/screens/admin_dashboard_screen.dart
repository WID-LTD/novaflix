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

final _adminUploadsProvider = FutureProvider<List<Map<String, dynamic>>?>((ref) async {
  final api = ref.read(apiServiceProvider);
  try {
    final res = await api.adminGetUploads();
    final data = res.data['uploads'] as List? ?? [];
    return data.cast<Map<String, dynamic>>();
  } catch (_) { return null; }
});

final _adminCreatorsProvider = FutureProvider<List<Map<String, dynamic>>?>((ref) async {
  final api = ref.read(apiServiceProvider);
  try {
    final res = await api.adminGetCreators();
    final data = res.data['creators'] as List? ?? [];
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
    final creators = ref.watch(_adminCreatorsProvider);
    final uploads = ref.watch(_adminUploadsProvider);

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
                : _tab == 1
                    ? _buildUsers(users)
                    : _tab == 2
                        ? _buildCreators(creators)
                        : _buildUploads(uploads),
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
        loading: () => const LoadingSpinner(),
        error: (_, __) => const Center(child: Text('Error loading stats')),
      ),
    );
  }

  Widget _buildUsers(AsyncValue<List<Map<String, dynamic>>?> users) {
    return users.when(
      data: (items) {
        final list = items ?? [];
        if (list.isEmpty) return const Center(child: Text('No users found'));
        return RefreshIndicator(
          onRefresh: () async { ref.invalidate(_adminUsersProvider); },
          child: ListView.builder(
            padding: const EdgeInsets.all(16),
            itemCount: list.length,
            itemBuilder: (_, i) {
              final u = list[i];
              final role = u['role']?.toString() ?? '';
              return Container(
                margin: const EdgeInsets.only(bottom: 12),
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: AppColors.surfaceContainerHigh,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Row(
                  children: [
                    CircleAvatar(
                      radius: 22,
                      backgroundColor: AppColors.surfaceContainerHighest,
                      backgroundImage: u['avatar'] != null ? NetworkImage(u['avatar'].toString()) : null,
                      child: u['avatar'] == null ? const Icon(Icons.person, color: AppColors.onSurfaceVariant) : null,
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(u['name']?.toString() ?? 'Unknown', style: AppTypography.bodyMd.copyWith(fontWeight: FontWeight.w600)),
                          Text(u['email']?.toString() ?? '', style: const TextStyle(color: AppColors.onSurfaceVariant, fontSize: 12)),
                          Row(children: [
                            _chip(role.toUpperCase(), role == 'admin' ? AppColors.error : AppColors.primary),
                            if (u['plan'] != null) _chip('PLAN: ${u['plan']}', AppColors.onSurfaceVariant),
                            if (u['email_verified'] == true) _chip('VERIFIED', Colors.green),
                          ]),
                        ],
                      ),
                    ),
                  ],
                ),
              );
            },
          ),
        );
      },
      loading: () => const LoadingSpinner(),
      error: (e, _) => Center(child: Text('Error: $e', style: const TextStyle(color: AppColors.error))),
    );
  }

  Widget _buildCreators(AsyncValue<List<Map<String, dynamic>>?> creators) {
    return creators.when(
      data: (items) {
        final list = items ?? [];
        if (list.isEmpty) return const Center(child: Text('No creators found'));
        return RefreshIndicator(
          onRefresh: () async { ref.invalidate(_adminCreatorsProvider); },
          child: ListView.builder(
            padding: const EdgeInsets.all(16),
            itemCount: list.length,
            itemBuilder: (_, i) {
              final u = list[i];
              return Container(
                margin: const EdgeInsets.only(bottom: 12),
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: AppColors.surfaceContainerHigh,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Row(
                  children: [
                    CircleAvatar(
                      radius: 22,
                      backgroundColor: AppColors.surfaceContainerHighest,
                      backgroundImage: u['avatar'] != null ? NetworkImage(u['avatar'].toString()) : null,
                      child: u['avatar'] == null ? const Icon(Icons.movie_filter, color: AppColors.onSurfaceVariant) : null,
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(u['name']?.toString() ?? 'Unknown', style: AppTypography.bodyMd.copyWith(fontWeight: FontWeight.w600)),
                          Text(u['email']?.toString() ?? '', style: const TextStyle(color: AppColors.onSurfaceVariant, fontSize: 12)),
                        ],
                      ),
                    ),
                  ],
                ),
              );
            },
          ),
        );
      },
      loading: () => const LoadingSpinner(),
      error: (e, _) => Center(child: Text('Error: $e', style: const TextStyle(color: AppColors.error))),
    );
  }

  Widget _buildUploads(AsyncValue<List<Map<String, dynamic>>?> uploads) {
    return uploads.when(
      data: (items) {
        final list = items ?? [];
        if (list.isEmpty) return const Center(child: Text('No uploads found'));
        return RefreshIndicator(
          onRefresh: () async { ref.invalidate(_adminUploadsProvider); },
          child: ListView.builder(
            padding: const EdgeInsets.all(16),
            itemCount: list.length,
            itemBuilder: (_, i) {
              final u = list[i];
              final status = u['status']?.toString() ?? '';
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
                    Text(u['title']?.toString() ?? 'Untitled', style: AppTypography.bodyMd.copyWith(fontWeight: FontWeight.w600)),
                    const SizedBox(height: 4),
                    Text('${u['type'] ?? 'unknown'} · ${_formatBytes(u['filesize'])} · ${u['views'] ?? 0} views',
                      style: const TextStyle(color: AppColors.onSurfaceVariant, fontSize: 12)),
                    const SizedBox(height: 8),
                    Row(children: [
                      _chip(status.toUpperCase(), status == 'approved' ? Colors.green : status == 'rejected' ? AppColors.error : Colors.orange),
                      if (u['genre'] != null) _chip(u['genre'].toString(), AppColors.onSurfaceVariant),
                    ]),
                  ],
                ),
              );
            },
          ),
        );
      },
      loading: () => const LoadingSpinner(),
      error: (e, _) => Center(child: Text('Error: $e', style: const TextStyle(color: AppColors.error))),
    );
  }

  String _formatBytes(dynamic bytes) {
    if (bytes == null) return '0 B';
    final n = double.tryParse(bytes.toString()) ?? 0;
    if (n < 1024) return '${n.toStringAsFixed(0)} B';
    if (n < 1024 * 1024) return '${(n / 1024).toStringAsFixed(1)} KB';
    if (n < 1024 * 1024 * 1024) return '${(n / (1024 * 1024)).toStringAsFixed(1)} MB';
    return '${(n / (1024 * 1024 * 1024)).toStringAsFixed(2)} GB';
  }

  Widget _chip(String text, Color color) {
    return Container(
      margin: const EdgeInsets.only(top: 6, right: 6),
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.15),
        borderRadius: BorderRadius.circular(4),
      ),
      child: Text(text, style: TextStyle(color: color, fontSize: 10, fontWeight: FontWeight.w600)),
    );
  }
}
