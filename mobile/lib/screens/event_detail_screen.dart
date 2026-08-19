import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../theme/app_colors.dart';
import '../theme/app_typography.dart';
import '../services/api_service.dart';
import '../widgets/ui/index.dart';

class EventDetailScreen extends ConsumerWidget {
  final String? eventId;
  const EventDetailScreen({super.key, this.eventId});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final eventFuture = ref.watch(
      eventId != null ? FutureProvider((_) async {
        final api = ref.read(apiServiceProvider);
        final res = await api.getEvent(int.parse(eventId!));
        return res.data['event'] as Map<String, dynamic>? ?? {};
      }) : FutureProvider((_) async => <String, dynamic>{}),
    );

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(title: const Text('Event Details')),
      body: eventFuture.when(
        data: (e) {
          if (e.isEmpty) return const Center(child: Text('Event not found'));
          final isLive = e['status']?.toString() == 'live';
          return SingleChildScrollView(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(
                  height: 200,
                  width: double.infinity,
                  decoration: BoxDecoration(
                    color: AppColors.surfaceContainerHigh,
                    borderRadius: BorderRadius.circular(12),
                    image: e['poster_url'] != null ? DecorationImage(image: NetworkImage(e['poster_url'].toString()), fit: BoxFit.cover) : null,
                  ),
                  child: isLive
                    ? Center(
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                          decoration: BoxDecoration(color: Colors.red, borderRadius: BorderRadius.circular(8)),
                          child: const Text('LIVE', style: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold)),
                        ),
                      )
                    : const SizedBox(),
                ),
                const SizedBox(height: 16),
                Text(e['title']?.toString() ?? '', style: AppTypography.headlineSm),
                const SizedBox(height: 8),
                if (e['creator_name'] != null) Text('by ${e['creator_name']}', style: TextStyle(color: AppColors.onSurfaceVariant, fontSize: 14)),
                if (e['event_date'] != null) Text(e['event_date'].toString(), style: TextStyle(color: AppColors.onSurfaceVariant, fontSize: 13)),
                const SizedBox(height: 16),
                if (e['description'] != null) Text(e['description'].toString(), style: AppTypography.bodyMd),
                const SizedBox(height: 24),
                if (e['ticket_price'] != null) ...[
                  AppButton(
                    label: (e['ticket_price'] as num) > 0 ? 'Purchase Ticket - \$${(e['ticket_price'] as num).toStringAsFixed(2)}' : 'RSVP - Free',
                    onPressed: () {},
                  ),
                ],
              ],
            ),
          );
        },
        loading: () => const LoadingSpinner(),
        error: (err, _) => Center(child: Text('Error: $err', style: TextStyle(color: AppColors.error))),
      ),
    );
  }
}
