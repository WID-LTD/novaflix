import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../models/media_item.dart';
import '../providers/watchlist_provider.dart';
import '../theme/app_colors.dart';
import '../theme/app_typography.dart';

bool get _isDesktop =>
    kIsWeb ||
    defaultTargetPlatform == TargetPlatform.linux ||
    defaultTargetPlatform == TargetPlatform.windows ||
    defaultTargetPlatform == TargetPlatform.macOS;

class MovieCard extends ConsumerStatefulWidget {
  final MediaItem item;
  final double width;
  final double height;

  const MovieCard({
    super.key,
    required this.item,
    this.width = 130,
    this.height = 185,
  });

  @override
  ConsumerState<MovieCard> createState() => _MovieCardState();
}

class _MovieCardState extends ConsumerState<MovieCard> {
  bool _hovered = false;

  @override
  Widget build(BuildContext context) {
    final item = widget.item;
    final type = item.mediaType == 'tv' ? 'tv' : 'movie';
    final path = '/$type/${item.id}';
    final inWatchlist = ref
        .watch(watchlistProvider)
        .isInWatchlist(item.id, type);
    final hasRating = (item.voteAverage ?? 0) > 0;

    return GestureDetector(
      onTap: () => context.go(path),
      child: MouseRegion(
        onEnter: (_) => setState(() => _hovered = true),
        onExit: (_) => setState(() => _hovered = false),
        cursor: SystemMouseCursors.click,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Expanded(
              child: ClipRRect(
                borderRadius: BorderRadius.circular(10),
                child: Stack(
                  fit: StackFit.expand,
                  children: [
                    AnimatedScale(
                      scale: _hovered ? 1.05 : 1.0,
                      duration: const Duration(milliseconds: 300),
                      curve: Curves.easeOut,
                      child: _PosterImage(item: item),
                    ),
                    DecoratedBox(
                      decoration: BoxDecoration(
                        gradient: LinearGradient(
                          begin: Alignment.topCenter,
                          end: Alignment.bottomCenter,
                          colors: [
                            Colors.transparent,
                            Colors.transparent,
                            Colors.black.withValues(alpha: 0.55),
                          ],
                          stops: const [0.5, 0.75, 1.0],
                        ),
                      ),
                    ),
                    // Premium ribbon (top-left, React parity)
                    if (item.premium)
                      Positioned(top: 6, left: 6, child: _PremiumRibbon()),
                    // Promoted badge (top-right, React parity)
                    if (item.promoted)
                      Positioned(
                        top: 6,
                        right: 6,
                        child: Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 5,
                            vertical: 2,
                          ),
                          decoration: BoxDecoration(
                            color: AppColors.primaryContainer.withValues(
                              alpha: 0.9,
                            ),
                            borderRadius: BorderRadius.circular(4),
                          ),
                          child: const Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Icon(
                                Icons.campaign,
                                size: 10,
                                color: AppColors.onPrimaryContainer,
                              ),
                              SizedBox(width: 2),
                              Text(
                                'PROMOTED',
                                style: TextStyle(
                                  fontSize: 7.5,
                                  fontWeight: FontWeight.w800,
                                  color: AppColors.onPrimaryContainer,
                                  letterSpacing: 0.4,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    // Rating pill (bottom-right)
                    if (hasRating)
                      Positioned(
                        right: 6,
                        bottom: 6,
                        child: Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 5,
                            vertical: 2,
                          ),
                          decoration: BoxDecoration(
                            color: Colors.black.withValues(alpha: 0.65),
                            borderRadius: BorderRadius.circular(4),
                          ),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              const Icon(
                                Icons.star_rounded,
                                size: 11,
                                color: Color(0xFFFFC107),
                              ),
                              const SizedBox(width: 2),
                              Text(
                                item.ratingFormatted,
                                style: const TextStyle(
                                  fontSize: 10,
                                  fontWeight: FontWeight.w700,
                                  color: AppColors.white,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    // Hover overlay (play + favorite), desktop parity with React
                    if (_hovered && _isDesktop)
                      Positioned.fill(
                        child: Container(
                          color: Colors.black.withValues(alpha: 0.35),
                          child: Center(
                            child: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                _HoverButton(
                                  backgroundColor: AppColors.primaryContainer,
                                  icon: Icons.play_arrow,
                                  iconColor: AppColors.onPrimaryContainer,
                                  onTap: () => context.go(
                                    '/watch?id=${item.id}&type=$type',
                                  ),
                                ),
                                const SizedBox(width: 10),
                                _HoverButton(
                                  backgroundColor: Colors.white.withValues(
                                    alpha: 0.2,
                                  ),
                                  icon: inWatchlist
                                      ? Icons.favorite
                                      : Icons.favorite_border,
                                  iconColor: inWatchlist
                                      ? AppColors.primary
                                      : AppColors.white,
                                  onTap: () => ref
                                      .read(watchlistProvider.notifier)
                                      .toggle(item.id, type),
                                ),
                              ],
                            ),
                          ),
                        ),
                      ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 7),
            AnimatedDefaultTextStyle(
              duration: const Duration(milliseconds: 200),
              style: AppTypography.labelMd.copyWith(
                color: _hovered ? AppColors.primaryPink : AppColors.onSurface,
                fontSize: 12.5,
                fontWeight: FontWeight.w600,
              ),
              child: Text(
                item.title,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
            ),
            const SizedBox(height: 2),
            _MetaLine(item: item),
          ],
        ),
      ),
    );
  }
}

class _PosterImage extends StatelessWidget {
  final MediaItem item;

  const _PosterImage({required this.item});

  @override
  Widget build(BuildContext context) {
    if (item.posterUrl == null) return const _PosterFallback();
    return CachedNetworkImage(
      imageUrl: item.posterUrl!,
      fit: BoxFit.cover,
      placeholder: (_, _) => const _PosterFallback(),
      errorWidget: (_, _, _) => const _PosterFallback(),
    );
  }
}

class _PremiumRibbon extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [AppColors.primaryContainer, AppColors.primaryAccent],
        ),
        borderRadius: BorderRadius.circular(9999),
      ),
      child: const Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(Icons.star_rounded, size: 10, color: Colors.black),
          SizedBox(width: 2),
          Text(
            'Premium',
            style: TextStyle(
              fontSize: 7.5,
              fontWeight: FontWeight.w800,
              color: Colors.black,
              letterSpacing: 0.4,
            ),
          ),
        ],
      ),
    );
  }
}

class _HoverButton extends StatelessWidget {
  final Color backgroundColor;
  final IconData icon;
  final Color iconColor;
  final VoidCallback onTap;

  const _HoverButton({
    required this.backgroundColor,
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
          shape: BoxShape.circle,
          color: backgroundColor,
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.3),
              blurRadius: 12,
              offset: const Offset(0, 3),
            ),
          ],
        ),
        child: Icon(icon, color: iconColor, size: 26),
      ),
    );
  }
}

class _PosterFallback extends StatelessWidget {
  const _PosterFallback();

  @override
  Widget build(BuildContext context) {
    return Container(
      color: AppColors.surfaceContainerHigh,
      child: const Center(
        child: Icon(
          Icons.movie_creation_outlined,
          size: 26,
          color: AppColors.onSurfaceVariant,
        ),
      ),
    );
  }
}

class _MetaLine extends StatelessWidget {
  final MediaItem item;

  const _MetaLine({required this.item});

  @override
  Widget build(BuildContext context) {
    final typeLabel = item.mediaType == 'tv' ? 'TV' : 'Movie';

    return Row(
      children: [
        Flexible(
          child: Text(
            item.year > 0 ? '${item.year}' : '',
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: TextStyle(
              color: AppColors.onSurfaceVariant.withValues(alpha: 0.75),
              fontSize: 10.5,
              fontWeight: FontWeight.w500,
            ),
          ),
        ),
        const SizedBox(width: 6),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 1),
          decoration: BoxDecoration(
            border: Border.all(color: Colors.white.withValues(alpha: 0.2)),
            borderRadius: BorderRadius.circular(3),
          ),
          child: Text(
            typeLabel,
            style: TextStyle(
              color: AppColors.onSurfaceVariant.withValues(alpha: 0.75),
              fontSize: 8,
              fontWeight: FontWeight.w600,
            ),
          ),
        ),
      ],
    );
  }
}
