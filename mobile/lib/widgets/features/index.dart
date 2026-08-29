import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../../core/config.dart';
import '../../core/responsive.dart';
import '../../providers/watchlist_provider.dart';
import '../../theme/app_colors.dart';
import '../../theme/app_typography.dart';
import '../../models/media_item.dart';
import '../ui/index.dart';
import '../../widgets/movie_card.dart';

export '../movie_card.dart';
export 'backdrops.dart';

/// Number of poster columns for a given **available content width**.
@Deprecated('Use gridColumns from responsive.dart')
int gridColumnsForWidth(double width) => gridColumns(width);

/// Legacy helper kept for callers that only have the window width.
@Deprecated('Use gridColumns from responsive.dart with LayoutBuilder')
int gridColumnsFor(double width) {
  if (width >= 900) {
    return gridColumns(width - 241 - 64);
  }
  return gridColumns(width - 32);
}

/// Estimated horizontal content width (minus desktop sidebar + page padding).
double contentWidthFor(double windowWidth) {
  if (windowWidth >= 900) return windowWidth - 241 - 64;
  return windowWidth - 32;
}

/// Child aspect ratio for poster grids so each card (2:3 poster + text block
/// below) fully fits its cell — prevents card overlap/clipping.
double gridAspectForWidth(double contentWidth, int columns, {double spacing = 20}) {
  final cellWidth = (contentWidth - (columns - 1) * spacing) / columns;
  return cellWidth / (cellWidth * 1.5 + 42);
}

class ContentRow extends StatelessWidget {
  final String title;
  final List<MediaItem> items;
  final VoidCallback? onSeeAll;

  const ContentRow({
    super.key,
    required this.title,
    required this.items,
    this.onSeeAll,
  });

  @override
  Widget build(BuildContext context) {
    if (items.isEmpty) return const SizedBox.shrink();
    final width = MediaQuery.of(context).size.width;
    final size = screenSizeFor(width);
    final hPadding = responsivePadding(width);
    final cardWidth = responsiveCardWidth(width);
    return Center(
      child: ConstrainedBox(
        constraints: const BoxConstraints(maxWidth: 1440),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Padding(
              padding: EdgeInsets.fromLTRB(hPadding, 8, hPadding, 12),
              child: Row(
                children: [
                  Expanded(
                    child: Text(
                      title,
                      style: AppTypography.headlineMd.copyWith(
                        color: AppColors.onSurface,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                  if (onSeeAll != null)
                    GestureDetector(
                      onTap: onSeeAll,
                      child: Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 4),
                        child: Text(
                          'View All',
                          style: AppTypography.labelMd.copyWith(
                            color: AppColors.primary,
                          ),
                        ),
                      ),
                    ),
                ],
              ),
            ),
            SizedBox(
              height: cardWidth * 1.5 + 40,
              child: ListView.builder(
                scrollDirection: Axis.horizontal,
                padding: EdgeInsets.symmetric(horizontal: hPadding),
                itemCount: items.length,
                itemBuilder: (_, i) => Padding(
                  padding: const EdgeInsets.only(right: 16),
                  child: SizedBox(
                    width: cardWidth,
                    child: MovieCard(item: items[i]),
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class HeroBanner extends ConsumerStatefulWidget {
  final List<MediaItem> items;

  const HeroBanner({super.key, required this.items});

  @override
  ConsumerState<HeroBanner> createState() => _HeroBannerState();
}

class _HeroBannerState extends ConsumerState<HeroBanner> {
  int _currentPage = 0;
  bool _paused = false;
  Timer? _timer;

  @override
  void initState() {
    super.initState();
    _startTimer();
  }

  void _startTimer() {
    _timer?.cancel();
    if (widget.items.length > 1) {
      _timer = Timer.periodic(const Duration(seconds: 6), (_) {
        if (!_paused && mounted) {
          setState(
            () => _currentPage = (_currentPage + 1) % widget.items.length,
          );
        }
      });
    }
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  void _goTo(int index) => setState(() => _currentPage = index);

  void _goPrev() => setState(() {
    _currentPage =
        (_currentPage - 1 + widget.items.length) % widget.items.length;
  });

  void _goNext() => setState(() {
    _currentPage = (_currentPage + 1) % widget.items.length;
  });

  void _toggleWatchlist(MediaItem item) {
    final type = item.mediaType == 'tv' ? 'tv' : 'movie';
    ref.read(watchlistProvider.notifier).toggle(item.id, type);
  }

  void _share(MediaItem item) {
    final type = item.mediaType == 'tv' ? 'tv' : 'movie';
    final base = AppConfig.productionBase.replaceFirst(RegExp(r'/api$'), '');
    Clipboard.setData(ClipboardData(text: '$base/$type/${item.id}'));
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Link copied to clipboard'),
        duration: Duration(seconds: 2),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    if (widget.items.isEmpty) return const SizedBox(height: 400);
    final item = widget.items[_currentPage];
    final type = item.mediaType == 'tv' ? 'tv' : 'movie';
    final width = MediaQuery.sizeOf(context).width;
    final heightPx = MediaQuery.sizeOf(context).height;
    final height = width >= 1280
        ? heightPx * 0.8
        : (width >= 768 ? heightPx * 0.7 : heightPx * 0.6);
    final showControls = width >= 768 && widget.items.length > 1;
    final inWatchlist = ref
        .watch(watchlistProvider)
        .isInWatchlist(item.id, type);

    return MouseRegion(
      onEnter: (_) => setState(() => _paused = true),
      onExit: (_) => setState(() => _paused = false),
      child: SizedBox(
        height: height,
        width: double.infinity,
        child: AnimatedSwitcher(
          duration: const Duration(milliseconds: 700),
          child: Stack(
            key: ValueKey(item.id),
            fit: StackFit.expand,
            children: [
              if (item.backdropUrl != null)
                CachedNetworkImage(
                  imageUrl: item.backdropUrl!,
                  width: double.infinity,
                  height: height,
                  fit: BoxFit.cover,
                )
              else
                Container(
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                      colors: [
                        AppColors.primaryContainer.withValues(alpha: 0.2),
                        AppColors.surface,
                      ],
                    ),
                  ),
                ),
              Container(
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.topCenter,
                    end: Alignment.bottomCenter,
                    colors: [
                      Colors.transparent,
                      Colors.transparent,
                      AppColors.background.withValues(alpha: 0.35),
                      AppColors.background.withValues(alpha: 0.92),
                    ],
                    stops: const [0.0, 0.45, 0.75, 1.0],
                  ),
                ),
              ),
              Container(
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.centerLeft,
                    end: Alignment.centerRight,
                    colors: [
                      AppColors.background.withValues(alpha: 0.8),
                      Colors.transparent,
                    ],
                  ),
                ),
              ),
              Positioned(
                left: width >= 768 ? 64 : 16,
                right: width >= 768 ? 64 : 16,
                bottom: width >= 768 ? 64 : 48,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 12,
                        vertical: 4,
                      ),
                      decoration: BoxDecoration(
                        color: AppColors.primaryContainer,
                        borderRadius: BorderRadius.circular(4),
                      ),
                      child: Text(
                        type == 'movie' ? 'NOW PLAYING' : 'TRENDING',
                        style: AppTypography.labelSm.copyWith(
                          color: AppColors.onPrimaryContainer,
                          letterSpacing: 1.2,
                        ),
                      ),
                    ),
                    const SizedBox(height: 14),
                    Text(
                      item.title,
                      style: width >= 1280
                          ? AppTypography.displayLg.copyWith(color: Colors.white)
                          : (width >= 768
                              ? AppTypography.headlineLg.copyWith(
                                  color: Colors.white,
                                  fontSize: 44,
                                )
                              : AppTypography.headlineLgMobile.copyWith(
                                  color: Colors.white,
                                )),
                    ),
                    const SizedBox(height: 12),
                    Row(
                      children: [
                        RatingBadge(rating: item.voteAverage ?? 0),
                        const SizedBox(width: 12),
                        Text(
                          '${item.year}',
                          style: const TextStyle(
                            color: Colors.white70,
                            fontSize: 14,
                          ),
                        ),
                        if (item.runtime != null) ...[
                          const SizedBox(width: 12),
                          Text(
                            '${item.runtime! ~/ 60}h ${item.runtime! % 60}m',
                            style: const TextStyle(
                              color: Colors.white70,
                              fontSize: 14,
                            ),
                          ),
                        ],
                      ],
                    ),
                    if (item.genres != null && item.genres!.isNotEmpty) ...[
                      const SizedBox(height: 12),
                      Wrap(
                        spacing: 8,
                        runSpacing: 8,
                        children: item.genres!
                            .take(4)
                            .map((g) => _GenreChip(label: g.name))
                            .toList(),
                      ),
                    ],
                    if (item.overview != null && item.overview!.isNotEmpty) ...[
                      const SizedBox(height: 14),
                      ConstrainedBox(
                        constraints: BoxConstraints(
                          maxWidth: width >= 768 ? 640 : double.infinity,
                        ),
                        child: Text(
                          item.overview!,
                          maxLines: 3,
                          overflow: TextOverflow.ellipsis,
                          style: TextStyle(
                            color: AppColors.onSurfaceVariant.withValues(
                              alpha: 0.9,
                            ),
                            fontSize: 14,
                            height: 1.5,
                          ),
                        ),
                      ),
                    ],
                    const SizedBox(height: 20),
                    Row(
                      children: [
                        AppButton(
                          label: 'Watch Now',
                          onPressed: () =>
                              context.go('/watch?id=${item.id}&type=$type'),
                          fullWidth: false,
                          height: 44,
                        ),
                        const SizedBox(width: 10),
                        _RoundIconButton(
                          icon: inWatchlist ? Icons.check : Icons.add,
                          iconColor: inWatchlist
                              ? AppColors.primary
                              : AppColors.onSurface,
                          onTap: () => _toggleWatchlist(item),
                        ),
                        const SizedBox(width: 10),
                        _RoundIconButton(
                          icon: Icons.share_outlined,
                          iconColor: AppColors.onSurface,
                          onTap: () => _share(item),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              if (showControls) ...[
                Positioned(
                  left: 16,
                  top: height / 2 - 24,
                  child: _ChevronButton(
                    icon: Icons.chevron_left,
                    onTap: _goPrev,
                  ),
                ),
                Positioned(
                  right: 16,
                  top: height / 2 - 24,
                  child: _ChevronButton(
                    icon: Icons.chevron_right,
                    onTap: _goNext,
                  ),
                ),
              ],
              Positioned(
                left: 0,
                right: 0,
                bottom: 16,
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: List.generate(widget.items.length, (i) {
                    final active = i == _currentPage;
                    return GestureDetector(
                      onTap: () => _goTo(i),
                      child: AnimatedContainer(
                        duration: const Duration(milliseconds: 300),
                        width: active ? 32 : 8,
                        height: 8,
                        margin: const EdgeInsets.symmetric(horizontal: 4),
                        decoration: BoxDecoration(
                          borderRadius: BorderRadius.circular(4),
                          color: active
                              ? AppColors.primaryContainer
                              : Colors.white.withValues(alpha: 0.4),
                        ),
                      ),
                    );
                  }),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _GenreChip extends StatelessWidget {
  final String label;

  const _GenreChip({required this.label});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        border: Border.all(color: Colors.white.withValues(alpha: 0.2)),
        borderRadius: BorderRadius.circular(999),
      ),
      child: Text(
        label,
        style: TextStyle(
          color: AppColors.onSurfaceVariant.withValues(alpha: 0.9),
          fontSize: 12,
          fontWeight: FontWeight.w500,
        ),
      ),
    );
  }
}

class _RoundIconButton extends StatelessWidget {
  final IconData icon;
  final Color iconColor;
  final VoidCallback onTap;

  const _RoundIconButton({
    required this.icon,
    required this.iconColor,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: 44,
        height: 44,
        decoration: BoxDecoration(
          color: AppColors.surfaceVariant.withValues(alpha: 0.4),
          borderRadius: BorderRadius.circular(10),
          border: Border.all(color: Colors.white.withValues(alpha: 0.1)),
        ),
        child: Icon(icon, color: iconColor, size: 22),
      ),
    );
  }
}

class _ChevronButton extends StatelessWidget {
  final IconData icon;
  final VoidCallback onTap;

  const _ChevronButton({required this.icon, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: 44,
        height: 44,
        decoration: BoxDecoration(
          color: Colors.black.withValues(alpha: 0.4),
          shape: BoxShape.circle,
          border: Border.all(color: Colors.white.withValues(alpha: 0.1)),
        ),
        child: const Icon(Icons.chevron_left, color: Colors.white),
      ),
    );
  }
}

class LikeButton extends ConsumerStatefulWidget {
  final int contentId;
  final String contentType;

  const LikeButton({
    super.key,
    required this.contentId,
    required this.contentType,
  });

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
            Text(
              '$_count',
              style: const TextStyle(
                color: AppColors.onSurfaceVariant,
                fontSize: 12,
              ),
            ),
          ],
        ],
      ),
    );
  }
}

class CommentSection extends ConsumerStatefulWidget {
  final int contentId;
  final String contentType;

  const CommentSection({
    super.key,
    required this.contentId,
    required this.contentType,
  });

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
                  setState(
                    () => _comments.insert(0, {
                      'text': _controller.text,
                      'username': 'You',
                    }),
                  );
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
            child: Center(
              child: Text(
                'No comments yet',
                style: TextStyle(color: AppColors.onSurfaceVariant),
              ),
            ),
          )
        else
          ..._comments.map(
            (c) => Padding(
              padding: const EdgeInsets.only(bottom: 12),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  CircleAvatar(
                    radius: 16,
                    backgroundColor: AppColors.surfaceContainerHighest,
                    child: const Icon(
                      Icons.person,
                      size: 18,
                      color: AppColors.onSurfaceVariant,
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          c['username'] as String,
                          style: const TextStyle(
                            fontWeight: FontWeight.w600,
                            fontSize: 13,
                          ),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          c['text'] as String,
                          style: const TextStyle(fontSize: 14),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
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
    super.key,
    required this.showId,
    required this.seasons,
    this.onSeasonChanged,
    this.onEpisodeChanged,
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
            const Text(
              'Season: ',
              style: TextStyle(fontWeight: FontWeight.w600),
            ),
            AppDropdown(
              value: widget.seasons.isNotEmpty
                  ? 'Season ${widget.seasons[_selectedSeason].seasonNumber}'
                  : null,
              items: widget.seasons
                  .map((s) => 'Season ${s.seasonNumber}')
                  .toList(),
              onChanged: (v) {
                if (v != null) {
                  final idx = widget.seasons.indexWhere(
                    (s) => 'Season ${s.seasonNumber}' == v,
                  );
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
          children: List.generate(
            10,
            (i) => GestureDetector(
              onTap: () {},
              child: Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 12,
                  vertical: 8,
                ),
                decoration: BoxDecoration(
                  color: AppColors.surfaceContainerHigh,
                  borderRadius: BorderRadius.circular(6),
                  border: Border.all(color: AppColors.outlineVariant),
                ),
                child: Text('E${i + 1}', style: const TextStyle(fontSize: 13)),
              ),
            ),
          ),
        ),
      ],
    );
  }
}
