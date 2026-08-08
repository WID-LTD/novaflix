import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../theme/app_colors.dart';
import '../theme/app_typography.dart';
import '../services/api_service.dart';
import '../widgets/ui/index.dart';

final notificationsProvider = FutureProvider<List<Map<String, dynamic>>>((
  ref,
) async {
  final api = ref.read(apiServiceProvider);
  final res = await api.getNotifications();
  final data = res.data['notifications'] as List? ?? [];
  return data.cast<Map<String, dynamic>>();
});

class NotificationsScreen extends ConsumerWidget {
  const NotificationsScreen({super.key});

  Future<void> _refresh(WidgetRef ref) async {
    ref.invalidate(notificationsProvider);
    await ref.read(notificationsProvider.future);
  }

  Future<void> _markAllRead(BuildContext context, WidgetRef ref) async {
    final api = ref.read(apiServiceProvider);
    await api.markAllNotificationsRead();
    ref.invalidate(notificationsProvider);
  }

  Future<void> _onTapItem(
    BuildContext context,
    WidgetRef ref,
    Map<String, dynamic> item,
  ) async {
    final isRead = item['is_read'] == true || item['is_read'] == 1;
    if (!isRead) {
      final id = (item['id'] as num).toInt();
      final api = ref.read(apiServiceProvider);
      api
          .markNotificationRead(id)
          .then((_) => ref.invalidate(notificationsProvider));
    }
    final link = item['link']?.toString();
    if (link != null && link.isNotEmpty) {
      context.push(link);
    }
  }

  String _relativeTime(String? iso) {
    if (iso == null || iso.isEmpty) return '';
    final created = DateTime.tryParse(iso);
    if (created == null) return '';
    final diff = DateTime.now().difference(created.toLocal());
    if (diff.inSeconds < 60) return 'just now';
    if (diff.inMinutes < 60) return '${diff.inMinutes}m ago';
    if (diff.inHours < 24) return '${diff.inHours}h ago';
    if (diff.inDays < 7) return '${diff.inDays}d ago';
    if (diff.inDays < 30) return '${(diff.inDays / 7).floor()}w ago';
    if (diff.inDays < 365) return '${(diff.inDays / 30).floor()}mo ago';
    return '${(diff.inDays / 365).floor()}y ago';
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final notifications = ref.watch(notificationsProvider);
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('Notifications'),
        actions: [
          TextButton(
            onPressed: () => _markAllRead(context, ref),
            child: const Text(
              'Mark all read',
              style: TextStyle(color: AppColors.primaryLight),
            ),
          ),
          const SizedBox(width: 8),
        ],
      ),
      body: notifications.when(
        data: (items) => items.isEmpty
            ? RefreshIndicator(
                onRefresh: () => _refresh(ref),
                color: AppColors.primary,
                backgroundColor: AppColors.surfaceContainerHigh,
                child: ListView(
                  physics: const AlwaysScrollableScrollPhysics(),
                  children: [
                    const SizedBox(height: 160),
                    Center(
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          const Icon(
                            Icons.notifications_none,
                            size: 64,
                            color: AppColors.onSurfaceVariant,
                          ),
                          const SizedBox(height: 16),
                          Text(
                            'No notifications yet',
                            style: AppTypography.bodyMd.copyWith(
                              color: AppColors.onSurfaceVariant,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              )
            : RefreshIndicator(
                onRefresh: () => _refresh(ref),
                color: AppColors.primary,
                backgroundColor: AppColors.surfaceContainerHigh,
                child: ListView.builder(
                  physics: const AlwaysScrollableScrollPhysics(),
                  padding: const EdgeInsets.all(16),
                  itemCount: items.length,
                  itemBuilder: (_, i) {
                    final item = items[i];
                    final unread =
                        item['is_read'] != true && item['is_read'] != 1;
                    final avatar = item['actor_avatar']?.toString();
                    return GestureDetector(
                      onTap: () => _onTapItem(context, ref, item),
                      child: Container(
                        margin: const EdgeInsets.only(bottom: 12),
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: unread
                              ? AppColors.primary.withValues(alpha: 0.08)
                              : AppColors.surfaceContainerHigh,
                          borderRadius: BorderRadius.circular(12),
                          border: unread
                              ? const Border(
                                  left: BorderSide(
                                    color: AppColors.primary,
                                    width: 3,
                                  ),
                                )
                              : null,
                        ),
                        child: Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            CircleAvatar(
                              radius: 24,
                              backgroundColor:
                                  AppColors.surfaceContainerHighest,
                              backgroundImage:
                                  avatar != null && avatar.isNotEmpty
                                  ? CachedNetworkImageProvider(avatar)
                                  : null,
                              child: avatar == null || avatar.isEmpty
                                  ? const Icon(
                                      Icons.notifications,
                                      color: AppColors.onSurfaceVariant,
                                    )
                                  : null,
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Row(
                                    children: [
                                      Expanded(
                                        child: Text(
                                          item['title']?.toString() ?? '',
                                          style: AppTypography.bodyMd.copyWith(
                                            fontWeight: FontWeight.w700,
                                          ),
                                          maxLines: 1,
                                          overflow: TextOverflow.ellipsis,
                                        ),
                                      ),
                                      if (unread) ...[
                                        const SizedBox(width: 8),
                                        Container(
                                          width: 8,
                                          height: 8,
                                          decoration: const BoxDecoration(
                                            color: AppColors.primary,
                                            shape: BoxShape.circle,
                                          ),
                                        ),
                                      ],
                                    ],
                                  ),
                                  if (item['body'] != null &&
                                      item['body'].toString().isNotEmpty)
                                    Padding(
                                      padding: const EdgeInsets.only(top: 2),
                                      child: Text(
                                        item['body'].toString(),
                                        style: AppTypography.bodySm.copyWith(
                                          color: AppColors.onSurfaceVariant,
                                        ),
                                        maxLines: 2,
                                        overflow: TextOverflow.ellipsis,
                                      ),
                                    ),
                                  Padding(
                                    padding: const EdgeInsets.only(top: 4),
                                    child: Text(
                                      _relativeTime(
                                        item['created_at']?.toString(),
                                      ),
                                      style: AppTypography.labelSm.copyWith(
                                        color: AppColors.onSurfaceVariant,
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                      ),
                    );
                  },
                ),
              ),
        loading: () => const LoadingSpinner(logo: true),
        error: (e, _) => Center(
          child: Text('Error: $e', style: TextStyle(color: AppColors.error)),
        ),
      ),
    );
  }
}
