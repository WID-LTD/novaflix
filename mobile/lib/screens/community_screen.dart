import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../providers/auth_provider.dart';
import '../theme/app_colors.dart';
import '../theme/app_typography.dart';
import '../services/api_service.dart';
import '../widgets/features/index.dart';
import '../widgets/ui/index.dart';

final _communitiesProvider = FutureProvider.family<
  List<Map<String, dynamic>>,
  String?
>((ref, search) async {
  final api = ref.read(apiServiceProvider);
  final res = await api.getCommunities(search: search);
  final data = res.data['communities'] as List? ?? [];
  return data.cast<Map<String, dynamic>>();
});

final _myCommunitiesProvider = FutureProvider<List<Map<String, dynamic>>>((
  ref,
) async {
  final api = ref.read(apiServiceProvider);
  final res = await api.getMyCommunities();
  final data = res.data['communities'] as List? ?? res.data['items'] as List? ?? [];
  return data.cast<Map<String, dynamic>>();
});

final _myEggsProvider = FutureProvider<List<Map<String, dynamic>>>((ref) async {
  final api = ref.read(apiServiceProvider);
  final res = await api.getMyEggs();
  final data = res.data['keys'] as List? ?? [];
  return data.cast<Map<String, dynamic>>();
});

final _trendingTakesProvider = FutureProvider<List<Map<String, dynamic>>>((
  ref,
) async {
  final api = ref.read(apiServiceProvider);
  final res = await api.getForumTopics(category: 'all', sort: 'new');
  final data = res.data['topics'] as List? ?? [];
  final topics = data.cast<Map<String, dynamic>>();
  topics.sort((a, b) {
    final sa = (a['upvotes'] as num? ?? 0) - (a['downvotes'] as num? ?? 0);
    final sb = (b['upvotes'] as num? ?? 0) - (b['downvotes'] as num? ?? 0);
    return sb.compareTo(sa);
  });
  return topics.take(3).toList();
});

final _communityDetailProvider = FutureProvider.family<
  ({Map<String, dynamic> community, bool isMember, List<Map<String, dynamic>> posts}),
  int
>((ref, id) async {
  final api = ref.read(apiServiceProvider);
  final res = await api.getCommunity(id);
  final data = res.data;
  final community =
      (data is Map ? data['community'] : null) as Map<String, dynamic>? ?? {};
  final isMember =
      (data is Map ? data['isMember'] : null) == true;
  final posts =
      ((data is Map ? data['posts'] : null) as List? ?? [])
          .cast<Map<String, dynamic>>();
  return (community: community, isMember: isMember, posts: posts);
});

class CommunityScreen extends ConsumerStatefulWidget {
  final int? communityId;

  const CommunityScreen({super.key, this.communityId});

  @override
  ConsumerState<CommunityScreen> createState() => _CommunityScreenState();
}

class _CommunityScreenState extends ConsumerState<CommunityScreen> {
  int _tab = 0;
  String _search = '';
  String _query = '';

  @override
  Widget build(BuildContext context) {
    final id = widget.communityId;
    if (id != null) {
      return _CommunityDetailView(communityId: id);
    }
    return Scaffold(
      backgroundColor: AppColors.background,
      body: ListView(
        padding: EdgeInsets.zero,
        children: [
          _hero(),
          if (_tab != 2) _searchBox(),
          _body(),
        ],
      ),
    );
  }

  Widget _hero() {
    final user = ref.watch(authProvider).user;
    return Container(
      color: AppColors.surfaceContainer,
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('Community & Engagement', style: AppTypography.headlineMd),
                      const SizedBox(height: 4),
                      Text(
                        'Communities · Hot Takes · Debate',
                        style: AppTypography.bodySm.copyWith(
                          color: AppColors.onSurfaceVariant,
                        ),
                      ),
                    ],
                  ),
                ),
                if (user?.isCreator == true)
                  _primaryButton('New Community', Icons.add, () async {
                    final created = await _openCreateModal();
                    if (created != null && context.mounted) {
                      context.push('/community/$created');
                    }
                  }),
              ],
            ),
            const SizedBox(height: 20),
            Container(
              padding: const EdgeInsets.all(2),
              decoration: BoxDecoration(
                color: AppColors.surfaceContainerHigh,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: AppColors.white.withValues(alpha: 0.05)),
              ),
              child: Row(
                children: [
                  _tabItem(0, Icons.diversity_3, 'Communities'),
                  _tabItem(1, Icons.forum, 'Hot Takes', onTap: () {
                    context.push('/forum');
                  }),
                  _tabItem(2, Icons.key, 'My Keys'),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _tabItem(int index, IconData icon, String label, {VoidCallback? onTap}) {
    final active = _tab == index;
    return Expanded(
      child: InkWell(
        borderRadius: BorderRadius.circular(10),
        onTap: onTap ??
            () => setState(() {
                  _tab = index;
                  if (index == 2) {
                    final auth = ref.read(authProvider);
                    if (auth.user == null) {
                      context.push('/login?redirect=/community');
                      return;
                    }
                  }
                }),
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 10),
          decoration: BoxDecoration(
            color: active ? AppColors.primaryContainer : Colors.transparent,
            borderRadius: BorderRadius.circular(10),
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(icon, size: 16, color: active ? AppColors.onPrimaryContainer : AppColors.onSurfaceVariant),
              const SizedBox(width: 6),
              Text(
                label,
                style: AppTypography.labelMd.copyWith(
                  color: active ? AppColors.onPrimaryContainer : AppColors.onSurfaceVariant,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _searchBox() {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 4),
      child: TextField(
        onSubmitted: (v) => setState(() {
          _query = v.trim();
          ref.invalidate(_communitiesProvider(_query));
        }),
        onChanged: (v) {
          if (_query.isNotEmpty && v.trim().isEmpty) {
            setState(() {
              _query = '';
              ref.invalidate(_communitiesProvider(''));
            });
          }
        },
        style: const TextStyle(color: AppColors.onSurface),
        decoration: InputDecoration(
          hintText: 'Search communities…',
          hintStyle: const TextStyle(color: AppColors.onSurfaceVariant),
          prefixIcon: const Icon(Icons.search, color: AppColors.onSurfaceVariant),
          filled: true,
          fillColor: AppColors.surfaceContainerHigh,
          contentPadding: const EdgeInsets.symmetric(vertical: 12),
          border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(12),
            borderSide: BorderSide(
              color: AppColors.white.withValues(alpha: 0.1),
            ),
          ),
          enabledBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(12),
            borderSide: BorderSide(
              color: AppColors.white.withValues(alpha: 0.1),
            ),
          ),
          focusedBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(12),
            borderSide: const BorderSide(color: AppColors.primaryContainer),
          ),
        ),
      ),
    );
  }

  Widget _body() {
    if (_tab == 2) return _keysTab();
    return _communitiesTab();
  }

  Widget _keysTab() {
    final keys = ref.watch(_myEggsProvider);
    return Padding(
      padding: const EdgeInsets.all(16),
      child: keys.when(
        loading: () => const LoadingSpinner(),
        error: (e, _) => Center(
          child: Text('Error: $e', style: const TextStyle(color: AppColors.error)),
        ),
        data: (items) => Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                const Icon(Icons.vpn_key, size: 20, color: AppColors.primaryContainer),
                const SizedBox(width: 8),
                Text('My Digital Keys', style: AppTypography.headlineSm),
                const Spacer(),
                Text(
                  '${items.length} collected',
                  style: AppTypography.bodySm.copyWith(color: AppColors.onSurfaceVariant),
                ),
              ],
            ),
            const SizedBox(height: 16),
            if (items.isEmpty) _emptyKeys() else _keyGrid(items),
          ],
        ),
      ),
    );
  }

  Widget _emptyKeys() {
    return Container(
      padding: const EdgeInsets.all(40),
      decoration: BoxDecoration(
        color: AppColors.surfaceContainer,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.white.withValues(alpha: 0.05)),
      ),
      child: Column(
        children: [
          const Icon(Icons.key_off, size: 48, color: AppColors.onSurfaceVariant),
          const SizedBox(height: 12),
          Text('No keys yet', style: AppTypography.headlineSm),
          const SizedBox(height: 6),
          Text(
            'Hidden keys are waiting in movies — go hunt for them.',
            textAlign: TextAlign.center,
            style: AppTypography.bodyMd.copyWith(color: AppColors.onSurfaceVariant),
          ),
          const SizedBox(height: 16),
          OutlinedButton.icon(
            onPressed: () => context.go('/'),
            style: OutlinedButton.styleFrom(
              foregroundColor: AppColors.primaryContainer,
              side: const BorderSide(color: AppColors.primaryContainer),
            ),
            icon: const Icon(Icons.arrow_forward, size: 18),
            label: const Text('Start Hunting'),
          ),
        ],
      ),
    );
  }

  Widget _keyGrid(List<Map<String, dynamic>> items) {
    return LayoutBuilder(
      builder: (context, constraints) {
        final cols = gridColumnsForWidth(constraints.maxWidth).clamp(1, 3);
        return GridView.builder(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
            crossAxisCount: cols,
            crossAxisSpacing: 12,
            mainAxisSpacing: 12,
            childAspectRatio: 1.4,
          ),
          itemCount: items.length,
          itemBuilder: (_, i) => _KeyCard(item: items[i]),
        );
      },
    );
  }

  Widget _communitiesTab() {
    final communities = ref.watch(_communitiesProvider(_query));
    final myCommunities = ref.watch(_myCommunitiesProvider);
    final trending = ref.watch(_trendingTakesProvider);
    return Padding(
      padding: const EdgeInsets.all(16),
      child: communities.when(
        loading: () => const LoadingSpinner(),
        error: (e, _) => Center(
          child: Text('Error: $e', style: const TextStyle(color: AppColors.error)),
        ),
        data: (items) {
          final mine = myCommunities.value ?? <Map<String, dynamic>>[];
          final mineIds = mine.map((m) => '${m['id']}').toSet();
          final others = items.where((c) => !mineIds.contains('${c['id']}')).toList();
          return Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              if (mine.isNotEmpty) ...[
                _sectionHeader(Icons.bookmark, 'My Communities'),
                _communityGrid(mine, joined: true),
                const SizedBox(height: 24),
              ],
              trending.when(
                data: (takes) => Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        const Icon(Icons.local_fire_department, size: 20, color: AppColors.primaryContainer),
                        const SizedBox(width: 8),
                        Text('Trending Hot Takes', style: AppTypography.headlineSm),
                        const Spacer(),
                        OutlinedButton(
                          onPressed: () => context.push('/forum'),
                          style: OutlinedButton.styleFrom(
                            foregroundColor: AppColors.primaryContainer,
                            side: const BorderSide(color: AppColors.primaryContainer),
                          ),
                          child: const Text('Start a Debate'),
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),
                    _takesGrid(takes),
                    const SizedBox(height: 24),
                  ],
                ),
                loading: () => const SizedBox(
                  height: 120,
                  child: Center(child: LoadingSpinner(size: 24)),
                ),
                error: (e, _) => const SizedBox.shrink(),
              ),
              _sectionHeader(Icons.diversity_3, 'All Communities'),
              if (others.isEmpty)
                _emptyCommunities()
              else
                _communityGrid(others),
            ],
          );
        },
      ),
    );
  }

  Widget _sectionHeader(IconData icon, String title) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Row(
        children: [
          Icon(icon, size: 20, color: AppColors.primaryContainer),
          const SizedBox(width: 8),
          Text(title, style: AppTypography.headlineSm),
        ],
      ),
    );
  }

  Widget _communityGrid(List<Map<String, dynamic>> items, {bool joined = false}) {
    return LayoutBuilder(
      builder: (context, constraints) {
        final cols = gridColumnsForWidth(constraints.maxWidth).clamp(1, 3);
        return GridView.builder(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
            crossAxisCount: cols,
            crossAxisSpacing: 12,
            mainAxisSpacing: 12,
            childAspectRatio: 1.5,
          ),
      itemCount: items.length,
      itemBuilder: (_, i) {
        final item = items[i];
        final id = item['id'] is num
            ? (item['id'] as num).toInt()
            : int.tryParse(item['id'].toString()) ?? 0;
        return GestureDetector(
          onTap: () => context.push('/community/$id'),
          child: Container(
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: joined ? AppColors.surfaceContainerHigh : AppColors.surfaceContainer,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: AppColors.white.withValues(alpha: 0.05)),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    _avatarTile(item['avatar']?.toString(), 36),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            item['name']?.toString() ?? '',
                            style: AppTypography.labelMd.copyWith(color: AppColors.onSurface),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                          if (item['member_count'] != null)
                            Text(
                              '${item['member_count']} members',
                              style: const TextStyle(color: AppColors.onSurfaceVariant, fontSize: 12),
                            ),
                        ],
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                Expanded(
                  child: Text(
                    item['description']?.toString() ?? '',
                    style: AppTypography.bodySm.copyWith(color: AppColors.onSurfaceVariant),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
                if (item['creator_name'] != null)
                  Text(
                    'Created by ${item['creator_name']}',
                    style: const TextStyle(color: AppColors.onSurfaceVariant, fontSize: 11),
                  ),
              ],
            ),
          ),
        );
      },
        );
      },
    );
  }

  Widget _emptyCommunities() {
    return SizedBox(
      width: double.infinity,
      child: Column(
        children: [
          const SizedBox(height: 32),
          const Icon(Icons.diversity_3, size: 56, color: AppColors.onSurfaceVariant),
          const SizedBox(height: 12),
          Text('No communities found', style: AppTypography.bodyMd.copyWith(color: AppColors.onSurfaceVariant)),
          const SizedBox(height: 4),
          Text(
            'No communities yet. Create the first one!',
            style: AppTypography.bodySm.copyWith(color: AppColors.onSurfaceVariant),
          ),
        ],
      ),
    );
  }

  Widget _takesGrid(List<Map<String, dynamic>> takes) {
    return LayoutBuilder(
      builder: (context, constraints) {
        final cols = gridColumnsForWidth(constraints.maxWidth).clamp(1, 3);
        return GridView.builder(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
            crossAxisCount: cols,
            crossAxisSpacing: 12,
            mainAxisSpacing: 12,
            childAspectRatio: 1.6,
          ),
      itemCount: takes.length,
      itemBuilder: (_, i) {
        final t = takes[i];
        final id = t['id'] is num ? (t['id'] as num).toInt() : int.tryParse(t['id'].toString()) ?? 0;
        final up = t['upvotes'] as num? ?? 0;
        final down = t['downvotes'] as num? ?? 0;
        final net = up - down;
        return GestureDetector(
          onTap: () => context.push('/forum/$id'),
          child: Container(
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: AppColors.surfaceContainerHigh,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: AppColors.white.withValues(alpha: 0.05)),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    if (t['category'] != null)
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                        decoration: BoxDecoration(
                          color: AppColors.primary.withValues(alpha: 0.15),
                          borderRadius: BorderRadius.circular(999),
                        ),
                        child: Text(
                          t['category'].toString().toUpperCase(),
                          style: AppTypography.labelXs.copyWith(color: AppColors.primary),
                        ),
                      ),
                    const Spacer(),
                    const Icon(Icons.thumb_up, size: 14, color: AppColors.onSurfaceVariant),
                    const SizedBox(width: 2),
                    Text('$net', style: const TextStyle(color: AppColors.onSurfaceVariant, fontSize: 12)),
                  ],
                ),
                const SizedBox(height: 8),
                Text(
                  t['title']?.toString() ?? '',
                  style: AppTypography.labelMd.copyWith(color: AppColors.onSurface),
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
                const Spacer(),
                Row(
                  children: [
                    Text(
                      t['author_name']?.toString() ?? 'user',
                      style: const TextStyle(color: AppColors.onSurfaceVariant, fontSize: 12),
                      overflow: TextOverflow.ellipsis,
                    ),
                    const Spacer(),
                    Text(
                      '💬 ${t['reply_count'] ?? 0}',
                      style: const TextStyle(color: AppColors.onSurfaceVariant, fontSize: 12),
                    ),
                  ],
                ),
              ],
            ),
          ),
        );
      },
        );
      },
    );
  }

  Widget _avatarTile(String? avatar, double size) {
    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        color: AppColors.primaryContainer.withValues(alpha: 0.2),
        borderRadius: BorderRadius.circular(size * 0.35),
      ),
      clipBehavior: Clip.antiAlias,
      child: avatar != null && avatar.isNotEmpty
          ? CachedNetworkImage(
              imageUrl: avatar,
              fit: BoxFit.cover,
              errorWidget: (_, _, _) => const Icon(Icons.diversity_3, color: AppColors.onSurfaceVariant),
            )
          : const Icon(Icons.diversity_3, color: AppColors.onSurfaceVariant),
    );
  }

  Widget _primaryButton(String label, IconData icon, VoidCallback onPressed) {
    return FilledButton.icon(
      onPressed: onPressed,
      style: FilledButton.styleFrom(
        backgroundColor: AppColors.primaryContainer,
        foregroundColor: AppColors.onPrimaryContainer,
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      ),
      icon: Icon(icon, size: 18),
      label: Text(label, style: AppTypography.labelMd),
    );
  }

  Future<int?> _openCreateModal() async {
    final nameCtl = TextEditingController();
    final descCtl = TextEditingController();
    final created = await showDialog<int>(
      context: context,
      barrierColor: Colors.black.withValues(alpha: 0.6),
      builder: (ctx) => Dialog(
        backgroundColor: AppColors.surfaceContainerHigh,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: StatefulBuilder(
            builder: (ctx, setModalState) {
              return Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Create Community', style: AppTypography.headlineSm),
                  const SizedBox(height: 16),
                  TextField(
                    controller: nameCtl,
                    onChanged: (_) => setModalState(() {}),
                    style: const TextStyle(color: AppColors.onSurface),
                    decoration: const InputDecoration(
                      labelText: 'Name',
                      filled: true,
                      fillColor: AppColors.surfaceContainer,
                      border: OutlineInputBorder(),
                    ),
                  ),
                  const SizedBox(height: 12),
                  TextField(
                    controller: descCtl,
                    minLines: 3,
                    maxLines: 5,
                    style: const TextStyle(color: AppColors.onSurface),
                    decoration: const InputDecoration(
                      labelText: 'Description (optional)',
                      filled: true,
                      fillColor: AppColors.surfaceContainer,
                      border: OutlineInputBorder(),
                    ),
                  ),
                  const SizedBox(height: 16),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.end,
                    children: [
                      TextButton(
                        onPressed: () => Navigator.of(ctx).pop(),
                        child: const Text('Cancel', style: TextStyle(color: AppColors.onSurfaceVariant)),
                      ),
                      const SizedBox(width: 8),
                      FilledButton(
                        onPressed: nameCtl.text.trim().isEmpty
                            ? null
                            : () async {
                                try {
                                  final api = ref.read(apiServiceProvider);
                                  final res = await api.createCommunity({
                                    'name': nameCtl.text.trim(),
                                    'description': descCtl.text.trim(),
                                  });
                                  final community = res.data['community'] as Map<String, dynamic>?;
                                  final id = community?['id'];
                                  final idInt = id is num
                                      ? id.toInt()
                                      : int.tryParse(id.toString()) ?? 0;
                                  Navigator.of(ctx).pop(idInt);
                                  ref.invalidate(_communitiesProvider(_query));
                                  ref.invalidate(_myCommunitiesProvider);
                                } catch (e) {
                                  if (ctx.mounted) {
                                    ScaffoldMessenger.of(ctx).showSnackBar(
                                      SnackBar(content: Text('Failed to create: $e')),
                                    );
                                  }
                                }
                              },
                        style: FilledButton.styleFrom(
                          backgroundColor: AppColors.primaryContainer,
                          foregroundColor: AppColors.onPrimaryContainer,
                        ),
                        child: const Text('Create'),
                      ),
                    ],
                  ),
                ],
              );
            },
          ),
        ),
      ),
    );
    return created;
  }
}

class _KeyCard extends StatelessWidget {
  final Map<String, dynamic> item;

  const _KeyCard({required this.item});

  @override
  Widget build(BuildContext context) {
    final reward = item['reward'];
    final rewardType = reward is Map ? reward['type']?.toString() : null;
    final isSecretRoom = rewardType == 'secret_room';
    final contentId = item['contentId']?.toString() ?? item['content_id']?.toString() ?? '';
    final hint = item['hint']?.toString() ?? '';
    final foundAt = item['found_at']?.toString() ?? '';
    final secretRoom = item['secret_room'] == true;
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppColors.surfaceContainerHigh,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.white.withValues(alpha: 0.05)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                width: 36,
                height: 36,
                decoration: BoxDecoration(
                  color: AppColors.primaryContainer.withValues(alpha: 0.2),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: const Icon(Icons.vpn_key, size: 18, color: AppColors.primaryContainer),
              ),
              const Spacer(),
              if (isSecretRoom)
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                  decoration: BoxDecoration(
                    color: AppColors.primary.withValues(alpha: 0.15),
                    borderRadius: BorderRadius.circular(999),
                  ),
                  child: Text(
                    'Enter Room →',
                    style: AppTypography.labelXs.copyWith(color: AppColors.primary),
                  ),
                )
              else if (reward is Map)
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                  decoration: BoxDecoration(
                    color: AppColors.primary.withValues(alpha: 0.15),
                    borderRadius: BorderRadius.circular(999),
                  ),
                  child: Text(
                    (reward['name']?.toString() ?? reward['icon']?.toString() ?? 'Reward'),
                    style: AppTypography.labelXs.copyWith(color: AppColors.primary),
                  ),
                ),
            ],
          ),
          const SizedBox(height: 8),
          if (contentId.isNotEmpty)
            Text(
              contentId,
              style: AppTypography.labelMd.copyWith(color: AppColors.onSurface),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
          if (hint.isNotEmpty)
            Text(
              hint,
              style: AppTypography.bodySm.copyWith(
                color: AppColors.onSurfaceVariant.withValues(alpha: 0.7),
                fontStyle: FontStyle.italic,
              ),
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
            ),
          const Spacer(),
          Text(
            foundAt.isNotEmpty
                ? 'Found at $foundAt${secretRoom ? ' · Secret Room unlocked' : ''}'
                : (secretRoom ? 'Secret Room unlocked' : ''),
            style: const TextStyle(color: AppColors.onSurfaceVariant, fontSize: 11),
          ),
        ],
      ),
    );
  }
}

class _CommunityDetailView extends ConsumerWidget {
  final int communityId;

  const _CommunityDetailView({required this.communityId});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final detail = ref.watch(_communityDetailProvider(communityId));
    return Scaffold(
      backgroundColor: AppColors.background,
      body: detail.when(
        loading: () => const LoadingSpinner(),
        error: (e, _) => Center(
          child: Text('Error: $e', style: const TextStyle(color: AppColors.error)),
        ),
        data: (d) {
          final community = d.community;
          if (community.isEmpty) {
            return const Center(
              child: Text('Community not found', style: TextStyle(color: AppColors.onSurfaceVariant)),
            );
          }
          return ListView(
            padding: EdgeInsets.zero,
            children: [
              _detailHero(
                context: context,
                ref: ref,
                community: community,
                isMember: d.isMember,
                id: communityId,
              ),
              _postsSection(
                ref: ref,
                community: community,
                isMember: d.isMember,
                posts: d.posts,
                id: communityId,
              ),
            ],
          );
        },
      ),
    );
  }

  Widget _detailHero({
    required BuildContext context,
    required WidgetRef ref,
    required Map<String, dynamic> community,
    required bool isMember,
    required int id,
  }) {
    return Container(
      color: AppColors.surfaceContainer,
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            InkWell(
              onTap: () => context.pop(),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Icon(Icons.arrow_back, size: 18, color: AppColors.onSurfaceVariant),
                  const SizedBox(width: 6),
                  Text(
                    'Back to Communities',
                    style: AppTypography.bodyMd.copyWith(color: AppColors.onSurfaceVariant),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 20),
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(
                  width: 72,
                  height: 72,
                  decoration: BoxDecoration(
                    color: AppColors.primaryContainer.withValues(alpha: 0.2),
                    borderRadius: BorderRadius.circular(16),
                  ),
                  clipBehavior: Clip.antiAlias,
                  child: community['avatar'] != null
                      ? CachedNetworkImage(
                          imageUrl: community['avatar'].toString(),
                          fit: BoxFit.cover,
                          errorWidget: (_, _, _) => const Icon(Icons.diversity_3, size: 32, color: AppColors.onSurfaceVariant),
                        )
                      : const Icon(Icons.diversity_3, size: 32, color: AppColors.onSurfaceVariant),
                ),
                const SizedBox(width: 20),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(community['name']?.toString() ?? '', style: AppTypography.headlineMd),
                      const SizedBox(height: 6),
                      Text(
                        community['description']?.toString() ?? 'No description',
                        style: AppTypography.bodyMd.copyWith(color: AppColors.onSurfaceVariant),
                      ),
                      const SizedBox(height: 10),
                      Wrap(
                        spacing: 16,
                        runSpacing: 8,
                        crossAxisAlignment: WrapCrossAlignment.center,
                        children: [
                          _membersButton(context, ref, id, community),
                          if (community['creator_name'] != null)
                            Text(
                              'Created by ${community['creator_name']}',
                              style: AppTypography.bodySm.copyWith(color: AppColors.onSurfaceVariant),
                            ),
                          const SizedBox(width: 8),
                          _joinButton(context, ref, id, isMember, community),
                        ],
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _membersButton(
    BuildContext context,
    WidgetRef ref,
    int id,
    Map<String, dynamic> community,
  ) {
    return InkWell(
      borderRadius: BorderRadius.circular(6),
      onTap: () async {
        try {
          final api = ref.read(apiServiceProvider);
          final res = await api.getCommunityMembers(id);
          final members = ((res.data['members'] as List?) ?? []).cast<Map<String, dynamic>>();
          if (!context.mounted) return;
          showDialog(
            context: context,
            barrierColor: Colors.black.withValues(alpha: 0.6),
            builder: (ctx) => Dialog(
              backgroundColor: AppColors.surfaceContainerHigh,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
              child: SizedBox(
                width: 360,
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Padding(
                      padding: const EdgeInsets.all(16),
                      child: Row(
                        children: [
                          Text('Members (${members.length})', style: AppTypography.headlineSm),
                          const Spacer(),
                          IconButton(
                            onPressed: () => Navigator.of(ctx).pop(),
                            icon: const Icon(Icons.close),
                          ),
                        ],
                      ),
                    ),
                    Flexible(
                      child: ListView.builder(
                        shrinkWrap: true,
                        itemCount: members.length,
                        itemBuilder: (_, i) {
                          final m = members[i];
                          return ListTile(
                            leading: CircleAvatar(
                              backgroundColor: AppColors.primaryContainer.withValues(alpha: 0.2),
                              backgroundImage: m['avatar'] != null
                                  ? NetworkImage(m['avatar'].toString())
                                  : null,
                              child: m['avatar'] == null
                                  ? const Icon(Icons.person, size: 18, color: AppColors.onSurfaceVariant)
                                  : null,
                            ),
                            title: Text(
                              m['name']?.toString() ?? 'User',
                              style: AppTypography.labelMd.copyWith(color: AppColors.onSurface),
                            ),
                          );
                        },
                      ),
                    ),
                  ],
                ),
              ),
            ),
          );
        } catch (_) {}
      },
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          const Icon(Icons.group, size: 16, color: AppColors.onSurfaceVariant),
          const SizedBox(width: 4),
          Text(
            '${community['member_count'] ?? 0} members',
            style: AppTypography.bodySm.copyWith(color: AppColors.onSurfaceVariant),
          ),
        ],
      ),
    );
  }

  Widget _joinButton(
    BuildContext context,
    WidgetRef ref,
    int id,
    bool isMember,
    Map<String, dynamic> community,
  ) {
    final user = ref.watch(authProvider).user;
    final isCreator = user?.id.toString() == community['creator_id']?.toString() ||
        community['creator_user_id']?.toString() == user?.id.toString();
    final VoidCallback? onPressed;
    final String label;
    if (isCreator) {
      label = "You're the creator";
      onPressed = null;
    } else if (isMember) {
      label = 'Leave';
      onPressed = () async {
        try {
          await ref.read(apiServiceProvider).leaveCommunity(id);
          ref.invalidate(_communityDetailProvider(id));
        } catch (_) {}
      };
    } else {
      label = 'Join';
      onPressed = () async {
        if (user == null) {
          context.push('/login?redirect=/community/$id');
          return;
        }
        try {
          await ref.read(apiServiceProvider).joinCommunity(id);
          ref.invalidate(_communityDetailProvider(id));
        } catch (_) {}
      };
    }
    return OutlinedButton(
      onPressed: onPressed,
      style: OutlinedButton.styleFrom(
        foregroundColor: isMember ? AppColors.error : AppColors.primaryContainer,
        side: BorderSide(
          color: isMember ? AppColors.error : AppColors.primaryContainer,
        ),
      ),
      child: Text(label),
    );
  }

  Widget _postsSection({
    required WidgetRef ref,
    required Map<String, dynamic> community,
    required bool isMember,
    required List<Map<String, dynamic>> posts,
    required int id,
  }) {
    return Padding(
      padding: const EdgeInsets.all(16),
      child: Column(
        children: [
          if (isMember) _postComposer(id),
          if (posts.isEmpty)
            Padding(
              padding: const EdgeInsets.symmetric(vertical: 24),
              child: Text(
                isMember ? 'No posts yet. Be the first to share!' : 'Join the community to post.',
                textAlign: TextAlign.center,
                style: AppTypography.bodyMd.copyWith(color: AppColors.onSurfaceVariant),
              ),
            )
          else
            ...posts.map((p) => _PostCard(communityId: id, post: p)).toList(),
        ],
      ),
    );
  }

  Widget _postComposer(int id) {
    final ctl = TextEditingController();
    return Consumer(
      builder: (context, ref, _) {
        return Container(
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            color: AppColors.surfaceContainerHigh,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: AppColors.white.withValues(alpha: 0.05)),
          ),
          child: Column(
            children: [
              TextField(
                controller: ctl,
                minLines: 2,
                maxLines: 4,
                style: const TextStyle(color: AppColors.onSurface),
                decoration: const InputDecoration(
                  hintText: 'Share something with the community...',
                  hintStyle: TextStyle(color: AppColors.onSurfaceVariant),
                  border: InputBorder.none,
                ),
              ),
              Align(
                alignment: Alignment.centerRight,
                child: StatefulBuilder(
                  builder: (ctx, setLocal) {
                    return FilledButton(
                      onPressed: () async {
                        final text = ctl.text.trim();
                        if (text.isEmpty) return;
                        try {
                          await ref.read(apiServiceProvider).addCommunityPost(id, text);
                          ctl.clear();
                          ref.invalidate(_communityDetailProvider(id));
                        } catch (_) {}
                      },
                      style: FilledButton.styleFrom(
                        backgroundColor: AppColors.primaryContainer,
                        foregroundColor: AppColors.onPrimaryContainer,
                        visualDensity: VisualDensity.compact,
                      ),
                      child: const Text('Post'),
                    );
                  },
                ),
              ),
            ],
          ),
        );
      },
    );
  }
}

class _PostCard extends ConsumerWidget {
  final int communityId;
  final Map<String, dynamic> post;

  const _PostCard({required this.communityId, required this.post});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = ref.watch(authProvider).user;
    final canDelete = user?.id.toString() == post['user_id']?.toString() ||
        (post['user_id'] is num && user?.id.toString() == (post['user_id'] as num).toString()) ||
        user?.isCreator == true;
    final liked = post['liked'] == true;
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.surfaceContainer,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.white.withValues(alpha: 0.05)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              CircleAvatar(
                radius: 16,
                backgroundColor: AppColors.primaryContainer.withValues(alpha: 0.2),
                backgroundImage: post['author_avatar'] != null
                    ? NetworkImage(post['author_avatar'].toString())
                    : null,
                child: post['author_avatar'] == null
                    ? const Icon(Icons.person, size: 16, color: AppColors.onSurfaceVariant)
                    : null,
              ),
              const SizedBox(width: 8),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      post['author_name']?.toString() ?? 'User',
                      style: AppTypography.labelMd.copyWith(color: AppColors.onSurface),
                    ),
                    if (post['created_at'] != null)
                      Text(
                        _postDate(post['created_at']),
                        style: const TextStyle(color: AppColors.onSurfaceVariant, fontSize: 11),
                      ),
                  ],
                ),
              ),
              if (canDelete)
                IconButton(
                  onPressed: () async {
                    try {
                      final pid = post['id'] is num
                          ? (post['id'] as num).toInt()
                          : int.tryParse(post['id'].toString()) ?? 0;
                      await ref.read(apiServiceProvider).deleteCommunityPost(communityId, pid);
                      ref.invalidate(_communityDetailProvider(communityId));
                    } catch (_) {}
                  },
                  icon: const Icon(Icons.delete_outline, size: 18, color: AppColors.onSurfaceVariant),
                ),
            ],
          ),
          const SizedBox(height: 10),
          Text(
            post['content']?.toString() ?? '',
            style: AppTypography.bodyMd.copyWith(color: AppColors.onSurface),
          ),
          const SizedBox(height: 10),
          InkWell(
            borderRadius: BorderRadius.circular(6),
            onTap: () async {
              try {
                final pid = post['id'] is num
                    ? (post['id'] as num).toInt()
                    : int.tryParse(post['id'].toString()) ?? 0;
                await ref.read(apiServiceProvider).likeCommunityPost(communityId, pid);
                ref.invalidate(_communityDetailProvider(communityId));
              } catch (_) {}
            },
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(
                  liked ? Icons.favorite : Icons.favorite_border,
                  size: 18,
                  color: liked ? AppColors.primaryContainer : AppColors.onSurfaceVariant,
                ),
                const SizedBox(width: 4),
                Text(
                  '${post['like_count'] ?? 0} Likes',
                  style: AppTypography.bodySm.copyWith(
                    color: liked ? AppColors.primaryContainer : AppColors.onSurfaceVariant,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  String _postDate(Object? t) {
    if (t == null) return '';
    final dt = t is num
        ? DateTime.fromMillisecondsSinceEpoch(t.toInt())
        : DateTime.tryParse(t.toString());
    if (dt == null) return '';
    final local = dt.toLocal();
    final diff = DateTime.now().difference(local);
    if (diff.inSeconds < 60) return 'just now';
    if (diff.inMinutes < 60) return '${diff.inMinutes}m ago';
    if (diff.inHours < 24) return '${diff.inHours}h ago';
    if (diff.inDays < 7) return '${diff.inDays}d ago';
    return '${local.day}/${local.month}/${local.year}';
  }
}