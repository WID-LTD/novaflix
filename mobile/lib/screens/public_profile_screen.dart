import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../theme/app_colors.dart';
import '../theme/app_typography.dart';
import '../services/api_service.dart';
import '../widgets/ui/index.dart';

final _profileProvider = FutureProvider.family<Map<String, dynamic>, String>((
  ref,
  userId,
) async {
  final api = ref.read(apiServiceProvider);
  final res = await api.getFollowStats(userId);
  final data = res.data as Map<String, dynamic>;
  return {
    'profile': data['profile'],
    'followers': data['followers'] as int? ?? 0,
    'following': data['following'] as int? ?? 0,
    'isFollowing': data['isFollowing'] as bool? ?? false,
  };
});

final _fanLeaderboardProvider =
    FutureProvider.family<List<Map<String, dynamic>>, String>((
      ref,
      creatorId,
    ) async {
      try {
        final api = ref.read(apiServiceProvider);
        final res = await api.getFanLeaderboard(creatorId);
        final data = res.data as Map<String, dynamic>;
        final list =
            data['leaderboard'] as List? ?? data['fans'] as List? ?? [];
        return list.cast<Map<String, dynamic>>();
      } catch (_) {
        return <Map<String, dynamic>>[];
      }
    });

class PublicProfileScreen extends ConsumerStatefulWidget {
  final String userId;

  const PublicProfileScreen({super.key, required this.userId});

  @override
  ConsumerState<PublicProfileScreen> createState() =>
      _PublicProfileScreenState();
}

class _PublicProfileScreenState extends ConsumerState<PublicProfileScreen> {
  int _tabIndex = 0;
  List<Map<String, dynamic>> _followers = [];
  List<Map<String, dynamic>> _following = [];
  bool _followingLoaded = false;

  @override
  Widget build(BuildContext context) {
    final profileData = ref.watch(_profileProvider(widget.userId));
    final leaderboard = ref.watch(_fanLeaderboardProvider(widget.userId));

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(title: const Text('Profile')),
      body: profileData.when(
        data: (data) {
          final profile = (data['profile'] as Map<String, dynamic>?) ?? {};
          final name = profile['name']?.toString() ?? 'User';
          final avatar = profile['avatar']?.toString();
          final bio = profile['bio']?.toString();
          final plan = profile['plan']?.toString() ?? 'free';
          final followers = data['followers'] as int? ?? 0;
          final following = data['following'] as int? ?? 0;
          final isFollowing = data['isFollowing'] as bool? ?? false;

          return RefreshIndicator(
            onRefresh: () async {
              ref.invalidate(_profileProvider(widget.userId));
              ref.invalidate(_fanLeaderboardProvider(widget.userId));
              _followingLoaded = false;
            },
            child: ListView(
              padding: const EdgeInsets.all(16),
              children: [
                const SizedBox(height: 8),
                Center(
                  child: CircleAvatar(
                    radius: 44,
                    backgroundColor: AppColors.surfaceContainerHighest,
                    backgroundImage: avatar != null && avatar.isNotEmpty
                        ? NetworkImage(avatar)
                        : null,
                    child: avatar == null || avatar.isEmpty
                        ? const Icon(
                            Icons.person,
                            size: 40,
                            color: AppColors.onSurfaceVariant,
                          )
                        : null,
                  ),
                ),
                const SizedBox(height: 12),
                Center(
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Flexible(
                        child: Text(
                          name,
                          style: AppTypography.headlineSm,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                      if (plan != 'free') ...[
                        const SizedBox(width: 8),
                        AppBadge(
                          label: plan.toUpperCase(),
                          color: AppColors.primary,
                        ),
                      ],
                    ],
                  ),
                ),
                if (bio != null && bio.isNotEmpty)
                  Padding(
                    padding: const EdgeInsets.only(top: 8),
                    child: Text(
                      bio,
                      textAlign: TextAlign.center,
                      style: AppTypography.bodySm.copyWith(
                        color: AppColors.onSurfaceVariant,
                      ),
                    ),
                  ),
                const SizedBox(height: 20),
                Row(
                  children: [
                    _statCard('Followers', '$followers', () => _loadList(true)),
                    const SizedBox(width: 10),
                    _statCard(
                      'Following',
                      '$following',
                      () => _loadList(false),
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                Row(
                  children: [
                    Expanded(
                      child: AppButton(
                        label: isFollowing ? 'Following' : 'Follow',
                        onPressed: () async {
                          final api = ref.read(apiServiceProvider);
                          try {
                            await api.toggleFollow(widget.userId);
                            ref.invalidate(_profileProvider(widget.userId));
                          } catch (_) {}
                        },
                        outlined: isFollowing,
                        height: 42,
                      ),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: AppButton(
                        label: 'Message',
                        onPressed: () =>
                            context.push('/chat?with=${widget.userId}'),
                        height: 42,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 24),
                if (leaderboard is AsyncData<List<Map<String, dynamic>>> &&
                    leaderboard.value!.isNotEmpty) ...[
                  Text('Superfan Leaderboard', style: AppTypography.headlineSm),
                  const SizedBox(height: 12),
                  ...leaderboard.value!
                      .take(10)
                      .toList()
                      .asMap()
                      .entries
                      .map((e) => _fanTile(e.value, e.key + 1)),
                  const SizedBox(height: 16),
                ],
              ],
            ),
          );
        },
        loading: () => const LoadingSpinner(),
        error: (e, _) => Center(
          child: Text(
            'Could not load profile',
            style: TextStyle(color: AppColors.error),
          ),
        ),
      ),
    );
  }

  Widget _statCard(String label, String value, VoidCallback onTap) {
    return Expanded(
      child: GestureDetector(
        onTap: onTap,
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 14),
          decoration: BoxDecoration(
            color: AppColors.surfaceContainerHigh,
            borderRadius: BorderRadius.circular(12),
          ),
          child: Column(
            children: [
              Text(
                value,
                style: AppTypography.headlineSm.copyWith(
                  color: AppColors.primary,
                ),
              ),
              const SizedBox(height: 2),
              Text(label, style: AppTypography.labelSm),
            ],
          ),
        ),
      ),
    );
  }

  Widget _fanTile(Map<String, dynamic> fan, int rank) {
    final name =
        fan['name']?.toString() ?? fan['username']?.toString() ?? 'Fan';
    final score = fan['score']?.toString() ?? fan['points']?.toString() ?? '';
    final avatar = fan['avatar']?.toString();
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: AppColors.surfaceContainerHigh,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        children: [
          Text(
            '#$rank',
            style: AppTypography.labelMd.copyWith(color: AppColors.primary),
          ),
          const SizedBox(width: 10),
          CircleAvatar(
            radius: 16,
            backgroundColor: AppColors.surfaceContainerHighest,
            backgroundImage: avatar != null && avatar.isNotEmpty
                ? NetworkImage(avatar)
                : null,
            child: avatar == null || avatar.isEmpty
                ? const Icon(
                    Icons.person,
                    size: 16,
                    color: AppColors.onSurfaceVariant,
                  )
                : null,
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Text(
              name,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: AppTypography.bodyMd,
            ),
          ),
          if (score.isNotEmpty)
            Text('$score pts', style: AppTypography.labelSm),
        ],
      ),
    );
  }

  Future<void> _loadList(bool followers) async {
    final api = ref.read(apiServiceProvider);
    try {
      final res = followers
          ? await api.getFollowers(widget.userId)
          : await api.getFollowing(widget.userId);
      final data = res.data as Map<String, dynamic>;
      final users = (data['users'] as List? ?? []).cast<Map<String, dynamic>>();
      if (!mounted) return;
      setState(() {
        _tabIndex = followers ? 0 : 1;
        if (followers) {
          _followers = users;
        } else {
          _following = users;
        }
        _followingLoaded = true;
      });
      await AppModal.show(
        context,
        title: followers ? 'Followers' : 'Following',
        content: users.isEmpty
            ? const Text('No users yet')
            : SizedBox(
                height: 320,
                child: ListView.builder(
                  itemCount: users.length,
                  itemBuilder: (_, i) {
                    final u = users[i];
                    final uName = u['name']?.toString() ?? 'User';
                    final uAvatar = u['avatar']?.toString();
                    final uFollowing = u['isFollowing'] as bool? ?? false;
                    final id = u['id']?.toString() ?? '';
                    return ListTile(
                      leading: CircleAvatar(
                        backgroundColor: AppColors.surfaceContainerHighest,
                        backgroundImage: uAvatar != null && uAvatar.isNotEmpty
                            ? NetworkImage(uAvatar)
                            : null,
                        child: uAvatar == null || uAvatar.isEmpty
                            ? const Icon(
                                Icons.person,
                                color: AppColors.onSurfaceVariant,
                              )
                            : null,
                      ),
                      title: Text(uName, style: AppTypography.bodyMd),
                      trailing: FollowButton(
                        creatorId: id,
                        isFollowing: uFollowing,
                      ),
                      onTap: id.isNotEmpty
                          ? () {
                              Navigator.of(context).pop();
                              context.push('/user/$id');
                            }
                          : null,
                    );
                  },
                ),
              ),
      );
    } catch (_) {}
  }
}
