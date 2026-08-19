import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../providers/auth_provider.dart';
import '../services/api_service.dart';
import '../theme/app_colors.dart';
import '../theme/app_typography.dart';
import '../widgets/ui/index.dart';

final _archiveProvider = FutureProvider<List<Map<String, dynamic>>>((ref) async {
  final api = ref.read(apiServiceProvider);
  final res = await api.getArchiveItems();
  final data = res.data['items'] as List? ?? res.data['data'] as List? ?? [];
  return data.cast<Map<String, dynamic>>();
});

const _planLabels = {
  'free': 'Free',
  'student': 'Student',
  'basic': 'Basic',
  'standard': 'Standard',
  'premium': 'Premium',
};

const _planColors = {
  'free': Color(0xFF9E9E9E),
  'student': Color(0xFF64B5F6),
  'basic': Color(0xFF4CAF50),
  'standard': Color(0xFFFFC107),
  'premium': Color(0xFFBA68C8),
};

class ArchiveScreen extends ConsumerWidget {
  const ArchiveScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final items = ref.watch(_archiveProvider);
    final user = ref.watch(authProvider).user;
    final isDesktop = MediaQuery.sizeOf(context).width >= 1024;
    final hPadding = isDesktop ? 64.0 : 16.0;

    return Scaffold(
      backgroundColor: AppColors.background,
      body: SingleChildScrollView(
        padding: EdgeInsets.fromLTRB(hPadding, 24, hPadding, 48),
        child: Center(
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 1152),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    const Icon(Icons.archive, size: 28, color: AppColors.primaryContainer),
                    const SizedBox(width: 12),
                    Text('Archive Vault', style: AppTypography.headlineLg),
                  ],
                ),
                const SizedBox(height: 4),
                Text(
                  'Exclusive archived content — classics, behind-the-scenes, and more',
                  style: AppTypography.bodySm.copyWith(
                    color: AppColors.onSurfaceVariant.withValues(alpha: 0.6),
                  ),
                ),
                const SizedBox(height: 24),
                items.when(
                  loading: () => const Padding(
                    padding: EdgeInsets.symmetric(vertical: 60),
                    child: Center(child: LoadingSpinner()),
                  ),
                  error: (e, _) => Padding(
                    padding: const EdgeInsets.symmetric(vertical: 40),
                    child: Center(
                      child: Text(
                        'Error: $e',
                        style: const TextStyle(color: AppColors.error),
                      ),
                    ),
                  ),
                  data: (list) => list.isEmpty
                      ? const Padding(
                          padding: EdgeInsets.symmetric(vertical: 60),
                          child: Center(
                            child: Column(
                              children: [
                                Icon(Icons.archive, size: 48, color: AppColors.onSurfaceVariant),
                                SizedBox(height: 12),
                                Text(
                                  'No archived content available for your plan',
                                  style: TextStyle(color: AppColors.onSurfaceVariant),
                                ),
                                SizedBox(height: 4),
                                Text(
                                  'Upgrade to access more exclusive content',
                                  style: TextStyle(
                                    color: AppColors.onSurfaceVariant,
                                    fontSize: 13,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        )
                      : _grid(context, list, user != null, ref),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _grid(
    BuildContext context,
    List<Map<String, dynamic>> items,
    bool loggedIn,
    WidgetRef ref,
  ) {
    final width = MediaQuery.sizeOf(context).width;
    final cols = width >= 1024 ? 4 : (width >= 600 ? 3 : 2);
    return GridView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: cols,
        crossAxisSpacing: 16,
        mainAxisSpacing: 16,
        childAspectRatio: 0.95,
      ),
      itemCount: items.length,
      itemBuilder: (_, i) => _ArchiveCard(
        item: items[i],
        loggedIn: loggedIn,
        onTap: () => _open(context, ref, items[i], loggedIn),
      ),
    );
  }

  void _open(
    BuildContext context,
    WidgetRef ref,
    Map<String, dynamic> item,
    bool loggedIn,
  ) async {
    if (!loggedIn) {
      context.push('/login?redirect=/archive');
      return;
    }
    final id = item['id'];
    final archiveId = id is num ? id.toInt() : int.tryParse(id.toString()) ?? -1;
    if (archiveId < 0) return;
    final api = ref.read(apiServiceProvider);
    try {
      final res = await api.getArchiveItem(archiveId);
      final body = res.data is Map ? res.data as Map : <String, dynamic>{};
      if (context.mounted) {
        if (body['success'] == true || body['item'] != null) {
          context.push('/archive/${body['item']?['id'] ?? archiveId}');
        } else if (body['requiredPlan'] != null) {
          context.push('/pricing?upgrade=${body['requiredPlan']}');
        } else {
          context.push('/archive/$archiveId');
        }
      }
    } catch (_) {
      if (context.mounted) context.push('/archive/$archiveId');
    }
  }
}

class _ArchiveCard extends StatelessWidget {
  final Map<String, dynamic> item;
  final bool loggedIn;
  final VoidCallback onTap;

  const _ArchiveCard({
    required this.item,
    required this.loggedIn,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final title = item['title']?.toString() ?? '';
    final poster = item['poster_url']?.toString();
    final type = item['content_type']?.toString() ?? '';
    final genre = item['genre']?.toString() ?? '';
    final year = item['year']?.toString() ?? '';
    final minPlan = item['min_plan']?.toString() ?? 'free';

    final IconData icon = type == 'article'
        ? Icons.article
        : type == 'audio'
            ? Icons.audiotrack
            : Icons.video_library;

    return GestureDetector(
      onTap: onTap,
      child: Container(
        decoration: BoxDecoration(
          color: AppColors.surfaceContainer,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: AppColors.white.withValues(alpha: 0.05)),
        ),
        clipBehavior: Clip.antiAlias,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            AspectRatio(
              aspectRatio: 16 / 9,
              child: Container(
                color: AppColors.surface,
                child: poster != null && poster.isNotEmpty
                    ? CachedNetworkImage(
                        imageUrl: poster,
                        fit: BoxFit.cover,
                        errorWidget: (_, _, _) =>
                            Icon(icon, size: 36, color: AppColors.onSurfaceVariant),
                      )
                    : Icon(icon, size: 36, color: AppColors.onSurfaceVariant),
              ),
            ),
            Padding(
              padding: const EdgeInsets.all(12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 8,
                          vertical: 2,
                        ),
                        decoration: BoxDecoration(
                          color: (_planColors[minPlan] ?? const Color(0xFF9E9E9E))
                              .withValues(alpha: 0.2),
                          borderRadius: BorderRadius.circular(999),
                        ),
                        child: Text(
                          _planLabels[minPlan] ?? minPlan,
                          style: TextStyle(
                            fontSize: 10,
                            fontWeight: FontWeight.w500,
                            color: _planColors[minPlan] ?? const Color(0xFF9E9E9E),
                          ),
                        ),
                      ),
                      if (genre.isNotEmpty) ...[
                        const SizedBox(width: 8),
                        Expanded(
                          child: Text(
                            genre,
                            style: TextStyle(
                              fontSize: 10,
                              color: AppColors.onSurfaceVariant.withValues(alpha: 0.6),
                            ),
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                      ],
                    ],
                  ),
                  const SizedBox(height: 6),
                  Text(
                    title,
                    style: AppTypography.labelMd.copyWith(
                      color: AppColors.onSurface,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  if (year.isNotEmpty)
                    Text(
                      year,
                      style: AppTypography.labelXs.copyWith(
                        color: AppColors.onSurfaceVariant,
                      ),
                    ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}