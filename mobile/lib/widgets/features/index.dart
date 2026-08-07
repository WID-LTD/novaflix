import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../../theme/app_colors.dart';
import '../../theme/app_typography.dart';
import '../../models/media_item.dart';
import '../ui/index.dart';
import '../../widgets/movie_card.dart';

export '../movie_card.dart';

class ContentRow extends StatelessWidget {
  final String title;
  final List<MediaItem> items;
  final VoidCallback? onSeeAll;

  const ContentRow({super.key, required this.title, required this.items, this.onSeeAll});

  @override
  Widget build(BuildContext context) {
    if (items.isEmpty) return const SizedBox.shrink();
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
          child: Row(
            children: [
              Text(title, style: AppTypography.headlineSm),
              const Spacer(),
              if (onSeeAll != null)
                GestureDetector(
                  onTap: onSeeAll,
                  child: const Text('See All', style: TextStyle(color: AppColors.primaryLight, fontSize: 14)),
                ),
            ],
          ),
        ),
        SizedBox(
          height: 200,
          child: ListView.builder(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: 12),
            itemCount: items.length,
            itemBuilder: (_, i) => Padding(
              padding: const EdgeInsets.symmetric(horizontal: 4),
              child: MovieCard(item: items[i]),
            ),
          ),
        ),
      ],
    );
  }
}

class HeroBanner extends StatefulWidget {
  final List<MediaItem> items;

  const HeroBanner({super.key, required this.items});

  @override
  State<HeroBanner> createState() => _HeroBannerState();
}

class _HeroBannerState extends State<HeroBanner> {
  int _currentPage = 0;
  Timer? _timer;

  @override
  void initState() {
    super.initState();
    if (widget.items.length > 1) {
      _timer = Timer.periodic(const Duration(seconds: 6), (_) {
        setState(() => _currentPage = (_currentPage + 1) % widget.items.length);
      });
    }
  }

  @override
  void dispose() { _timer?.cancel(); super.dispose(); }

  @override
  Widget build(BuildContext context) {
    if (widget.items.isEmpty) return const SizedBox(height: 400);
    final item = widget.items[_currentPage];

    return SizedBox(
      height: 400,
      child: Stack(
        children: [
          if (item.backdropUrl != null)
            CachedNetworkImage(imageUrl: item.backdropUrl!, width: double.infinity, height: 400, fit: BoxFit.cover)
          else
            Container(color: AppColors.surfaceContainerHigh),
          Container(
            decoration: BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topCenter,
                end: Alignment.bottomCenter,
                colors: [Colors.transparent, AppColors.background.withValues(alpha: 0.9)],
              ),
            ),
          ),
          Positioned(
            left: 16,
            right: 16,
            bottom: 40,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(item.title, style: AppTypography.headlineLg.copyWith(color: Colors.white)),
                const SizedBox(height: 8),
                Row(
                  children: [
                    RatingBadge(rating: item.voteAverage ?? 0),
                    const SizedBox(width: 12),
                    Text('${item.year}', style: const TextStyle(color: Colors.white70, fontSize: 14)),
                    if (item.runtime != null) ...[
                      const SizedBox(width: 12),
                      Text('${item.runtime! ~/ 60}h ${item.runtime! % 60}m', style: const TextStyle(color: Colors.white70, fontSize: 14)),
                    ],
                  ],
                ),
                const SizedBox(height: 12),
                Row(
                  children: [
                    AppButton(
                      label: 'Watch Now',
                      onPressed: () => context.go('/watch?id=${item.id}&type=${item.mediaType ?? 'movie'}'),
                      fullWidth: false,
                      height: 40,
                    ),
                    const SizedBox(width: 12),
                    AppButton(
                      label: 'Details',
                      onPressed: () => context.go('/movie/${item.id}'),
                      outlined: true,
                      fullWidth: false,
                      height: 40,
                    ),
                  ],
                ),
              ],
            ),
          ),
          Positioned(
            left: 0,
            right: 0,
            bottom: 8,
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: List.generate(widget.items.length, (i) => Container(
                width: 8, height: 8,
                margin: const EdgeInsets.symmetric(horizontal: 4),
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: i == _currentPage ? AppColors.primary : Colors.grey,
                ),
              )),
            ),
          ),
        ],
      ),
    );
  }
}

class LikeButton extends ConsumerStatefulWidget {
  final int contentId;
  final String contentType;

  const LikeButton({super.key, required this.contentId, required this.contentType});

  @override
  ConsumerState<LikeButton> createState() => _LikeButtonState();
}

class _LikeButtonState extends ConsumerState<LikeButton> {
  bool _liked = false;
  int _count = 0;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () => setState(() => _liked = !_liked),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(
            _liked ? Icons.favorite : Icons.favorite_border,
            color: _liked ? AppColors.primary : AppColors.onSurfaceVariant,
            size: 20,
          ),
          if (_count > 0) ...[
            const SizedBox(width: 4),
            Text('$_count', style: const TextStyle(color: AppColors.onSurfaceVariant, fontSize: 12)),
          ],
        ],
      ),
    );
  }
}

class CommentSection extends ConsumerStatefulWidget {
  final int contentId;
  final String contentType;

  const CommentSection({super.key, required this.contentId, required this.contentType});

  @override
  ConsumerState<CommentSection> createState() => _CommentSectionState();
}

class _CommentSectionState extends ConsumerState<CommentSection> {
  final _controller = TextEditingController();
  final _comments = <Map<String, dynamic>>[];

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text('Comments', style: AppTypography.headlineSm),
        const SizedBox(height: 12),
        Row(
          children: [
            Expanded(
              child: AppInput(
                controller: _controller,
                hint: 'Write a comment...',
              ),
            ),
            const SizedBox(width: 8),
            IconButton(
              icon: const Icon(Icons.send, color: AppColors.primary),
              onPressed: () {
                if (_controller.text.isNotEmpty) {
                  setState(() => _comments.insert(0, {'text': _controller.text, 'username': 'You'}));
                  _controller.clear();
                }
              },
            ),
          ],
        ),
        const SizedBox(height: 12),
        if (_comments.isEmpty)
          const Padding(
            padding: EdgeInsets.symmetric(vertical: 20),
            child: Center(child: Text('No comments yet', style: TextStyle(color: AppColors.onSurfaceVariant))),
          )
        else
          ..._comments.map((c) => Padding(
            padding: const EdgeInsets.only(bottom: 12),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                CircleAvatar(
                  radius: 16,
                  backgroundColor: AppColors.surfaceContainerHighest,
                  child: const Icon(Icons.person, size: 18, color: AppColors.onSurfaceVariant),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(c['username'] as String, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13)),
                      const SizedBox(height: 2),
                      Text(c['text'] as String, style: const TextStyle(fontSize: 14)),
                    ],
                  ),
                ),
              ],
            ),
          )),
      ],
    );
  }
}

class SeasonEpisodeSelector extends StatefulWidget {
  final int showId;
  final List<Season> seasons;
  final ValueChanged<int>? onSeasonChanged;
  final ValueChanged<int>? onEpisodeChanged;

  const SeasonEpisodeSelector({
    super.key, required this.showId, required this.seasons,
    this.onSeasonChanged, this.onEpisodeChanged,
  });

  @override
  State<SeasonEpisodeSelector> createState() => _SeasonEpisodeSelectorState();
}

class _SeasonEpisodeSelectorState extends State<SeasonEpisodeSelector> {
  int _selectedSeason = 0;
  final _episodes = <Episode>[];

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            const Text('Season: ', style: TextStyle(fontWeight: FontWeight.w600)),
            AppDropdown(
              value: widget.seasons.isNotEmpty ? 'Season ${widget.seasons[_selectedSeason].seasonNumber}' : null,
              items: widget.seasons.map((s) => 'Season ${s.seasonNumber}').toList(),
              onChanged: (v) {
                if (v != null) {
                  final idx = widget.seasons.indexWhere((s) => 'Season ${s.seasonNumber}' == v);
                  if (idx >= 0) setState(() => _selectedSeason = idx);
                }
              },
            ),
          ],
        ),
        const SizedBox(height: 12),
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: List.generate(10, (i) => GestureDetector(
            onTap: () {},
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              decoration: BoxDecoration(
                color: AppColors.surfaceContainerHigh,
                borderRadius: BorderRadius.circular(6),
                border: Border.all(color: AppColors.outlineVariant),
              ),
              child: Text('E${i + 1}', style: const TextStyle(fontSize: 13)),
            ),
          )),
        ),
      ],
    );
  }
}
