import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../theme/app_colors.dart';
import '../theme/app_typography.dart';
import '../services/api_service.dart';

final _eventsProvider = FutureProvider<List<Map<String, dynamic>>>((ref) async {
  final api = ref.read(apiServiceProvider);
  final res = await api.getEvents();
  final data = res.data['events'] as List? ?? [];
  return data.cast<Map<String, dynamic>>();
});

class LiveEventsScreen extends ConsumerWidget {
  const LiveEventsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final events = ref.watch(_eventsProvider);
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(title: const Text('Live Events')),
      body: events.when(
        data: (items) {
          final upcoming = items.where((e) => e['status']?.toString() != 'ended').toList();
          return upcoming.isEmpty
            ? Center(child: Column(mainAxisSize: MainAxisSize.min, children: [
                Icon(Icons.event, size: 64, color: AppColors.onSurfaceVariant),
                const SizedBox(height: 16),
                Text('No upcoming events', style: AppTypography.bodyMd.copyWith(color: AppColors.onSurfaceVariant)),
              ]))
            : ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: upcoming.length,
              itemBuilder: (_, i) {
                final e = upcoming[i];
                final isLive = e['status']?.toString() == 'live';
                return GestureDetector(
                  onTap: () => context.push('/event/${e['id']}'),
                  child: Container(
                    margin: const EdgeInsets.only(bottom: 12),
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: AppColors.surfaceContainerHigh,
                      borderRadius: BorderRadius.circular(12),
                      border: isLive ? Border.all(color: Colors.red, width: 1) : null,
                    ),
                    child: Row(
                      children: [
                        Container(
                          width: 48, height: 48,
                          decoration: BoxDecoration(
                            color: isLive ? Colors.red.withValues(alpha: 0.15) : AppColors.primary.withValues(alpha: 0.1),
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: Icon(isLive ? Icons.live_tv : Icons.event, color: isLive ? Colors.red : AppColors.primary),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(e['title']?.toString() ?? '', style: AppTypography.bodyMd.copyWith(fontWeight: FontWeight.w600)),
                              Text(e['event_date']?.toString() ?? '', style: const TextStyle(color: AppColors.onSurfaceVariant, fontSize: 12)),
                              if (e['ticket_price'] != null)
                                Text('\$${(e['ticket_price'] as num).toStringAsFixed(2)}', style: const TextStyle(color: AppColors.primary, fontSize: 12)),
                            ],
                          ),
                        ),
                        if (isLive)
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                            decoration: BoxDecoration(color: Colors.red, borderRadius: BorderRadius.circular(4)),
                            child: const Text('LIVE', style: TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.bold)),
                          ),
                      ],
                    ),
                  ),
                );
              },
            );
        },
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(child: Text('Error: $e', style: TextStyle(color: AppColors.error))),
      ),
    );
  }
}
