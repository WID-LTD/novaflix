import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../models/user.dart';
import '../services/api_service.dart';
import '../theme/app_colors.dart';
import '../theme/app_typography.dart';
import '../widgets/ui/index.dart';

final _creatorMeProvider = FutureProvider<User?>((ref) async {
  final api = ref.read(apiServiceProvider);
  try {
    final res = await api.getMe();
    final data = res.data as Map<String, dynamic>;
    final userData = data['user'] as Map<String, dynamic>? ?? data;
    return User.fromJson(userData);
  } catch (_) {
    return null;
  }
});

final _fansProvider = FutureProvider.family<List<Map<String, dynamic>>, String>((ref, creatorId) async {
  final api = ref.read(apiServiceProvider);
  try {
    final res = await api.getFanLeaderboard(creatorId);
    return (res.data['fans'] as List? ?? []).cast<Map<String, dynamic>>();
  } catch (_) {
    return [];
  }
});

final _fanStatusProvider = FutureProvider.family<Map<String, dynamic>?, String>((ref, creatorId) async {
  final api = ref.read(apiServiceProvider);
  try {
    final res = await api.getFanStatus(creatorId);
    return res.data as Map<String, dynamic>?;
  } catch (_) {
    return null;
  }
});

class CreatorProfileHubScreen extends ConsumerWidget {
  const CreatorProfileHubScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final me = ref.watch(_creatorMeProvider);

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(title: const Text('Creator Profile')),
      body: me.when(
        loading: () => const LoadingSpinner(logo: true),
        error: (_, __) => _noSession(context),
        data: (user) {
          if (user == null) return _noSession(context);
          final fans = ref.watch(_fansProvider(user.id));
          final fanStatus = ref.watch(_fanStatusProvider(user.id));

          return RefreshIndicator(
            onRefresh: () async {
              ref.invalidate(_creatorMeProvider);
              ref.invalidate(_fansProvider(user.id));
              ref.invalidate(_fanStatusProvider(user.id));
            },
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(16),
              child: ConstrainedBox(
                constraints: const BoxConstraints(maxWidth: 960),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        const Expanded(
                          child: Text('Creator Profile', style: AppTypography.headlineSm),
                        ),
                        AppButton(
                          label: 'View Public Profile',
                          onPressed: () => context.push('/user/${user.id}'),
                          height: 38,
                          fullWidth: false,
                        ),
                      ],
                    ),
                    const SizedBox(height: 20),
                    _identityCard(context, user, fanStatus.valueOrNull),
                    const SizedBox(height: 28),
                    const Text(
                      'MANAGE & PROMOTE',
                      style: TextStyle(
                        fontFamily: AppTypography.labelFont,
                        fontSize: 12,
                        letterSpacing: 2,
                        fontWeight: FontWeight.w600,
                        color: AppColors.onSurface,
                      ),
                    ),
                    const SizedBox(height: 12),
                    GridView.count(
                      crossAxisCount: MediaQuery.sizeOf(context).width >= 768 ? 2 : 1,
                      shrinkWrap: true,
                      physics: const NeverScrollableScrollPhysics(),
                      crossAxisSpacing: 12,
                      mainAxisSpacing: 12,
                      childAspectRatio: 4.2,
                      children: [
                        _manageCard(context, Icons.bar_chart, 'Analytics', 'Views, likes and earnings', '/creator/analytics'),
                        _manageCard(context, Icons.video_library, 'Content Catalog', 'Manage your films', '/creator/catalog'),
                        _manageCard(context, Icons.card_membership, 'Memberships', 'Fan subscriptions', '/creator/memberships'),
                        _manageCard(context, Icons.campaign, 'Promotions', 'Run campaigns', '/creator/campaigns'),
                      ],
                    ),
                    if (fans.valueOrNull != null && fans.valueOrNull!.isNotEmpty) ...[
                      const SizedBox(height: 28),
                      const Text(
                        'TOP FANS',
                        style: TextStyle(
                          fontFamily: AppTypography.labelFont,
                          fontSize: 12,
                          letterSpacing: 2,
                          fontWeight: FontWeight.w600,
                          color: AppColors.onSurface,
                        ),
                      ),
                      const SizedBox(height: 12),
                      Container(
                        decoration: BoxDecoration(
                          color: AppColors.surfaceContainerHigh,
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(color: Colors.white.withValues(alpha: 0.05)),
                        ),
                        clipBehavior: Clip.antiAlias,
                        child: Column(
                          children: [
                            for (final entry
                                in fans.valueOrNull!.take(5).toList().asMap().entries)
                              _fanRow(context, entry.value, entry.key),
                          ],
                        ),
                      ),
                    ],
                  ],
                ),
              ),
            ),
          );
        },
      ),
    );
  }

  Widget _noSession(BuildContext context) {
    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          const Icon(Icons.verified_user, size: 56, color: AppColors.onSurfaceVariant),
          const SizedBox(height: 16),
          Text('Sign in as a creator to view your hub', style: AppTypography.bodyMd.copyWith(color: AppColors.onSurfaceVariant)),
          const SizedBox(height: 16),
          AppButton(
            label: 'Creator Login',
            onPressed: () => context.push('/creator/login'),
            fullWidth: false,
          ),
        ],
      ),
    );
  }

  Widget _identityCard(BuildContext context, User user, Map<String, dynamic>? status) {
    final rank = status?['rank'];
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: AppColors.surfaceContainerHigh,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.white.withValues(alpha: 0.05)),
      ),
      child: Row(
        children: [
          if (user.avatar != null && user.avatar!.isNotEmpty)
            ClipRRect(
              borderRadius: BorderRadius.circular(12),
              child: CachedNetworkImage(
                imageUrl: user.avatar!,
                width: 72,
                height: 72,
                fit: BoxFit.cover,
                errorWidget: (_, _, _) => const _AvatarFallback(),
              ),
            )
          else
            const _AvatarFallback(),
          const SizedBox(width: 20),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  user.username,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: AppTypography.headlineSm.copyWith(fontWeight: FontWeight.w700),
                ),
                const SizedBox(height: 4),
                Text(
                  (user.bio != null && user.bio!.isNotEmpty) ? user.bio! : 'Independent filmmaker & visual storyteller',
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                  style: AppTypography.bodyMd.copyWith(color: AppColors.onSurfaceVariant),
                ),
                const SizedBox(height: 8),
                Row(
                  children: [
                    const Icon(Icons.group, size: 14, color: AppColors.primary),
                    const SizedBox(width: 4),
                    Flexible(
                      child: Text(
                        rank != null
                            ? 'Rank #$rank on your own leaderboard'
                            : 'Your fans leaderboard lives on your public profile',
                        style: const TextStyle(color: AppColors.primary, fontSize: 12),
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _manageCard(BuildContext context, IconData icon, String label, String desc, String route) {
    return GestureDetector(
      onTap: () => context.push(route),
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: AppColors.surfaceContainerHigh,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: Colors.white.withValues(alpha: 0.05)),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, color: AppColors.primaryContainer, size: 20),
            const SizedBox(height: 8),
            Text(label, style: AppTypography.labelMd.copyWith(color: AppColors.onSurface)),
            const SizedBox(height: 2),
            Text(
              desc,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: TextStyle(color: AppColors.onSurfaceVariant.withValues(alpha: 0.7), fontSize: 13),
            ),
          ],
        ),
      ),
    );
  }

  Widget _fanRow(BuildContext context, Map<String, dynamic> fan, int index) {
    final badge = fan['badge'] as Map<String, dynamic>? ?? {};
    final badgeColor = _hexColor(badge['color']);
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
      child: Row(
        children: [
          Container(
            width: 28,
            height: 28,
            decoration: BoxDecoration(
              color: AppColors.surfaceContainer,
              shape: BoxShape.circle,
            ),
            alignment: Alignment.center,
            child: Text(
              '${index + 1}',
              style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: AppColors.onSurfaceVariant),
            ),
          ),
          const SizedBox(width: 12),
          if (fan['avatar'] != null)
            ClipOval(
              child: CachedNetworkImage(
                imageUrl: fan['avatar'].toString(),
                width: 32,
                height: 32,
                fit: BoxFit.cover,
                errorWidget: (_, _, _) => const Icon(Icons.person, color: AppColors.onSurfaceVariant),
              ),
            )
          else
            const Icon(Icons.person, color: AppColors.onSurfaceVariant),
          const SizedBox(width: 12),
          Expanded(
            child: GestureDetector(
              onTap: () => context.push('/user/${fan['user_id']}'),
              child: Text(
                fan['name']?.toString() ?? 'Fan',
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w500, color: AppColors.onSurface),
              ),
            ),
          ),
          const SizedBox(width: 8),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
            decoration: BoxDecoration(
              color: badgeColor.withValues(alpha: 0.15),
              borderRadius: BorderRadius.circular(999),
            ),
            child: Text(
              badge['tier']?.toString() ?? '',
              style: TextStyle(color: badgeColor, fontSize: 11, fontWeight: FontWeight.w600),
            ),
          ),
          SizedBox(
            width: 40,
            child: Text(
              '${fan['points'] ?? 0}',
              textAlign: TextAlign.right,
              style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w700, color: AppColors.onSurface),
            ),
          ),
        ],
      ),
    );
  }

  Color _hexColor(Object? hex) {
    if (hex == null) return AppColors.primary;
    final s = hex.toString().replaceFirst('#', '');
    if (s.length != 6) return AppColors.primary;
    final v = int.tryParse(s, radix: 16);
    if (v == null) return AppColors.primary;
    return Color(0xFF000000 | v);
  }
}

class _AvatarFallback extends StatelessWidget {
  const _AvatarFallback();

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 72,
      height: 72,
      decoration: BoxDecoration(
        color: AppColors.surfaceContainer,
        borderRadius: BorderRadius.circular(12),
      ),
      child: const Icon(Icons.person, size: 36, color: AppColors.onSurfaceVariant),
    );
  }
}
