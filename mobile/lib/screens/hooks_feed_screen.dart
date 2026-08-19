import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../theme/app_colors.dart';
import '../theme/app_typography.dart';
import '../services/api_service.dart';
import '../widgets/features/index.dart';
import '../widgets/ui/index.dart';

final _hooksProvider = FutureProvider<List<Map<String, dynamic>>>((ref) async {
  final api = ref.read(apiServiceProvider);
  final res = await api.getHooksFeed();
  final data = res.data['data'] as List? ?? [];
  return data.cast<Map<String, dynamic>>();
});

class HooksFeedScreen extends ConsumerStatefulWidget {
  const HooksFeedScreen({super.key});

  @override
  ConsumerState<HooksFeedScreen> createState() => _HooksFeedScreenState();
}

class _HooksFeedScreenState extends ConsumerState<HooksFeedScreen> {
  final _pageController = PageController();
  int _activeIndex = 0;

  @override
  void dispose() {
    _pageController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final hooks = ref.watch(_hooksProvider);
    final width = MediaQuery.sizeOf(context).width;
    final isDesktop = width >= 768;

    return Scaffold(
      backgroundColor: Colors.black,
      body: hooks.when(
        data: (items) {
          if (items.isEmpty) {
            return const Center(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(Icons.videocam, size: 64, color: Colors.grey),
                  SizedBox(height: 16),
                  Text(
                    'No hooks available',
                    style: TextStyle(color: Colors.white70, fontSize: 16),
                  ),
                ],
              ),
            );
          }
          return Row(
            children: [
              Expanded(
                child: Center(
                  child: isDesktop
                      ? ConstrainedBox(
                          constraints: const BoxConstraints(maxWidth: 450),
                          child: _phoneFrame(items),
                        )
                      : _phoneFrame(items),
                ),
              ),
            ],
          );
        },
        loading: () => const Center(child: LoadingSpinner(size: 32)),
        error: (e, _) => Center(
          child: Text('Error: $e', style: const TextStyle(color: AppColors.error)),
        ),
      ),
    );
  }

  Widget _phoneFrame(List<Map<String, dynamic>> items) {
    return Container(
      margin: const EdgeInsets.symmetric(vertical: 16),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFF262626)),
        boxShadow: const [BoxShadow(color: Colors.black, blurRadius: 32)],
      ),
      clipBehavior: Clip.antiAlias,
      child: Stack(
        children: [
          PageView.builder(
            controller: _pageController,
            scrollDirection: Axis.vertical,
            itemCount: items.length,
            onPageChanged: (i) => setState(() => _activeIndex = i),
            itemBuilder: (_, i) => _HookCard(
              hook: items[i],
              active: i == _activeIndex,
            ),
          ),
          Positioned(
            top: 16,
            left: 16,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
              decoration: BoxDecoration(
                color: Colors.black.withValues(alpha: 0.5),
                borderRadius: BorderRadius.circular(999),
              ),
              child: Text(
                '${_activeIndex + 1} / ${items.length}',
                style: const TextStyle(
                  color: Colors.white60,
                  fontSize: 12,
                ),
              ),
            ),
          ),
          Positioned(
            top: 16,
            right: 16,
            child: GestureDetector(
              onTap: () => _showUploadModal(),
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                decoration: BoxDecoration(
                  color: Colors.black.withValues(alpha: 0.5),
                  borderRadius: BorderRadius.circular(999),
                  border: Border.all(color: Colors.white24),
                ),
                child: const Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(Icons.add, color: Colors.white, size: 14),
                    SizedBox(width: 4),
                    Text(
                      'Upload Trailers',
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 13,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  void _showUploadModal() {
    showDialog(
      context: context,
      builder: (_) => Dialog(
        backgroundColor: AppColors.surfaceContainerHigh,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        child: Padding(
          padding: const EdgeInsets.all(20),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  const Text(
                    'Upload a Short',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 18,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  const Spacer(),
                  IconButton(
                    icon: const Icon(Icons.close, color: Colors.white54),
                    onPressed: () => Navigator.pop(context),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              const Text(
                'Video embedding is currently unavailable on this app.',
                style: TextStyle(color: Colors.white70, fontSize: 14),
              ),
              const SizedBox(height: 20),
            ],
          ),
        ),
      ),
    );
  }
}

class _HookCard extends StatelessWidget {
  final Map<String, dynamic> hook;
  final bool active;

  const _HookCard({required this.hook, required this.active});

  @override
  Widget build(BuildContext context) {
    final title = hook['title']?.toString() ?? '';
    final description = hook['description']?.toString() ?? '';
    final poster = hook['poster']?.toString();
    final videoUrl = hook['videoUrl']?.toString();
    final creatorName = hook['creatorName']?.toString() ?? 'Novaflix';
    final hashtags = (hook['hashtags'] as List?)?.cast<String>() ??
        ['fyp', 'novaflix', 'shorts'];
    final likes = hook['likes'] as int? ?? hook['likesCount'] as int? ?? 0;
    final comments =
        hook['commentsCount'] as int? ?? hook['comments'] as int? ?? 0;
    final bookmarks =
        hook['bookmarksCount'] as int? ?? hook['bookmarks'] as int? ?? 0;
    final shares = hook['shares'] as int? ?? 0;
    final hasMedia = videoUrl != null && videoUrl.isNotEmpty;

    return Container(
      color: Colors.black,
      child: Stack(
        fit: StackFit.expand,
        children: [
          if (hasMedia && poster != null)
            CachedNetworkImage(
              imageUrl: poster,
              fit: BoxFit.cover,
              errorWidget: (_, _, _) => const _HookFallback(),
            )
          else if (poster != null)
            CachedNetworkImage(
              imageUrl: poster,
              fit: BoxFit.cover,
              errorWidget: (_, _, _) => const _HookFallback(),
            )
          else
            const _HookFallback(),
          Container(
            decoration: BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topCenter,
                end: Alignment.bottomCenter,
                colors: [
                  Colors.transparent,
                  Colors.black.withValues(alpha: 0.4),
                  Colors.black.withValues(alpha: 0.9),
                ],
                stops: const [0.0, 0.4, 1.0],
              ),
            ),
          ),
          Positioned(
            right: 12,
            bottom: 110,
            child: Column(
              children: [
                const _CircleIcon(
                  icon: Icons.person,
                  size: 48,
                  border: true,
                ),
                const SizedBox(height: 12),
                _ActionIcon(
                  icon: Icons.favorite,
                  count: likes,
                  onTap: () {},
                ),
                const SizedBox(height: 20),
                _ActionIcon(
                  icon: Icons.chat_bubble,
                  count: comments,
                  onTap: () {},
                ),
                const SizedBox(height: 20),
                _ActionIcon(
                  icon: Icons.bookmark,
                  count: bookmarks,
                  onTap: () {},
                ),
                const SizedBox(height: 20),
                _ActionIcon(
                  icon: Icons.share,
                  count: shares,
                  onTap: () {},
                ),
              ],
            ),
          ),
          Positioned(
            left: 16,
            right: 64,
            bottom: 24,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title.isNotEmpty ? title : '@$creatorName',
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 16,
                    fontWeight: FontWeight.w700,
                  ),
                ),
                if (description.isNotEmpty) ...[
                  const SizedBox(height: 4),
                  Text(
                    description,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 13,
                      height: 1.4,
                    ),
                  ),
                ],
                const SizedBox(height: 6),
                Wrap(
                  spacing: 8,
                  children: hashtags
                      .take(3)
                      .map(
                        (h) => Text(
                          '#$h',
                          style: const TextStyle(
                            color: AppColors.primary,
                            fontWeight: FontWeight.w600,
                            fontSize: 13,
                          ),
                        ),
                      )
                      .toList(),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _HookFallback extends StatelessWidget {
  const _HookFallback();

  @override
  Widget build(BuildContext context) {
    return Container(
      color: AppColors.surfaceContainer,
      child: const Center(
        child: Icon(Icons.movie, size: 64, color: Colors.grey),
      ),
    );
  }
}

class _CircleIcon extends StatelessWidget {
  final IconData icon;
  final double size;
  final bool border;

  const _CircleIcon({
    required this.icon,
    required this.size,
    this.border = false,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        color: const Color(0xFF404040),
        border: border ? Border.all(color: Colors.white, width: 2) : null,
      ),
      child: Icon(icon, color: Colors.white, size: size * 0.5),
    );
  }
}

class _ActionIcon extends StatelessWidget {
  final IconData icon;
  final int count;
  final VoidCallback onTap;

  const _ActionIcon({
    required this.icon,
    required this.count,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Column(
        children: [
          Icon(icon, color: Colors.white, size: 28),
          const SizedBox(height: 4),
          Text(
            count > 0 ? _formatCount(count) : '',
            style: const TextStyle(
              color: Colors.white,
              fontSize: 12,
              fontWeight: FontWeight.w500,
            ),
          ),
        ],
      ),
    );
  }

  String _formatCount(int n) {
    if (n >= 1000000) return '${(n / 1000000).toStringAsFixed(1)}M';
    if (n >= 1000) return '${(n / 1000).toStringAsFixed(1)}K';
    return '$n';
  }
}