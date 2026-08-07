import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../theme/app_colors.dart';
import '../theme/app_typography.dart';
import '../services/api_service.dart';
import '../widgets/ui/index.dart';

final _redCarpetProvider = FutureProvider<List<Map<String, dynamic>>>((ref) async {
  final api = ref.read(apiServiceProvider);
  final res = await api.getEvents(includePast: false);
  final data = res.data['events'] as List? ?? [];
  return data.cast<Map<String, dynamic>>();
});

class RedCarpetScreen extends ConsumerWidget {
  const RedCarpetScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final events = ref.watch(_redCarpetProvider);
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(title: const Text('Red Carpet')),
      body: events.when(
        data: (items) {
          final upcoming = items.where((e) => e['status']?.toString() != 'ended').toList();
          final past = items.where((e) => e['status']?.toString() == 'ended').toList();
          return SingleChildScrollView(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(
                  height: 160,
                  width: double.infinity,
                  decoration: BoxDecoration(
                    gradient: LinearGradient(colors: [Colors.red.shade800, AppColors.background]),
                    borderRadius: BorderRadius.circular(16),
                  ),
                  child: Center(
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const Icon(Icons.star, size: 48, color: Colors.white),
                        const SizedBox(height: 8),
                        Text('Red Carpet Premieres', style: AppTypography.headlineMd.copyWith(color: Colors.white)),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 24),
                Text('Upcoming Premieres', style: AppTypography.headlineSm),
                const SizedBox(height: 12),
                ...upcoming.map((e) => Container(
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
                          color: AppColors.surfaceContainerHighest,
                          borderRadius: BorderRadius.circular(8),
                          image: e['poster_url'] != null ? DecorationImage(image: NetworkImage(e['poster_url'].toString()), fit: BoxFit.cover) : null,
                        ),
                        child: e['poster_url'] == null ? const Icon(Icons.movie, color: AppColors.onSurfaceVariant) : null,
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(e['title']?.toString() ?? '', style: AppTypography.bodyMd.copyWith(fontWeight: FontWeight.w600)),
                            Text(e['event_date']?.toString() ?? '', style: TextStyle(color: AppColors.onSurfaceVariant, fontSize: 12)),
                          ],
                        ),
                      ),
                      AppButton(label: (e['ticket_price'] as num?)?.toStringAsFixed(0) == '0' ? 'RSVP' : 'Tickets', onPressed: () => context.push('/event/${e['id']}'), fullWidth: false, height: 36),
                    ],
                  ),
                )),
                if (past.isNotEmpty) ...[
                  const SizedBox(height: 16),
                  Text('Past Premieres', style: AppTypography.headlineSm),
                  const SizedBox(height: 12),
                  ...past.map((e) => Container(
                    margin: const EdgeInsets.only(bottom: 12),
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: AppColors.surfaceContainerHigh.withValues(alpha: 0.6),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Row(
                      children: [
                        Text(e['title']?.toString() ?? '', style: AppTypography.bodyMd.copyWith(color: AppColors.onSurfaceVariant)),
                      ],
                    ),
                  )),
                ],
                if (upcoming.isEmpty && past.isEmpty)
                  Center(child: Column(mainAxisSize: MainAxisSize.min, children: [
                    Icon(Icons.star, size: 64, color: AppColors.onSurfaceVariant),
                    const SizedBox(height: 16),
                    Text('No premieres available', style: AppTypography.bodyMd.copyWith(color: AppColors.onSurfaceVariant)),
                  ])),
              ],
            ),
          );
        },
        loading: () => const LoadingSpinner(logo: true),
        error: (e, _) => Center(child: Text('Error: $e', style: TextStyle(color: AppColors.error))),
      ),
    );
  }
}
