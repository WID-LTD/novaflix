import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:go_router/go_router.dart';
import '../models/media_item.dart';
import '../theme/app_colors.dart';
import '../theme/app_typography.dart';

class MovieCard extends StatelessWidget {
  final MediaItem item;
  final double width;
  final double height;

  const MovieCard({super.key, required this.item, this.width = 130, this.height = 185});

  @override
  Widget build(BuildContext context) {
    final path = '/${item.mediaType == 'tv' ? 'tv' : 'movie'}/${item.id}';
    final hasRating = (item.voteAverage ?? 0) > 0;

    return GestureDetector(
      onTap: () => context.go(path),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Expanded(
            child: _Poster(item: item, path: path, hasRating: hasRating),
          ),
          const SizedBox(height: 7),
          Text(
            item.title,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: AppTypography.labelMd.copyWith(
              color: AppColors.onSurface,
              fontSize: 12.5,
              fontWeight: FontWeight.w600,
            ),
          ),
          const SizedBox(height: 2),
          _MetaLine(item: item, hasRating: hasRating),
        ],
      ),
    );
  }
}

class _Poster extends StatelessWidget {
  final MediaItem item;
  final String path;
  final bool hasRating;

  const _Poster({required this.item, required this.path, required this.hasRating});

  @override
  Widget build(BuildContext context) {
    return ClipRRect(
      borderRadius: BorderRadius.circular(10),
      child: Stack(
        fit: StackFit.expand,
        children: [
          if (item.posterUrl != null)
            CachedNetworkImage(
              imageUrl: item.posterUrl!,
              fit: BoxFit.cover,
              placeholder: (_, _) => const _PosterFallback(),
              errorWidget: (_, _, _) => const _PosterFallback(),
            )
          else
            const _PosterFallback(),
          // Bottom gradient for legibility + hover glow
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
          // Premium ribbon (top-right)
          if (item.premium)
            Positioned(
              top: 6,
              right: 6,
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 2),
                decoration: BoxDecoration(
                  color: AppColors.primary,
                  borderRadius: BorderRadius.circular(4),
                ),
                child: const Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(Icons.star_rounded, size: 10, color: AppColors.white),
                    SizedBox(width: 2),
                    Text('PREMIUM', style: TextStyle(fontSize: 7.5, fontWeight: FontWeight.w800, color: AppColors.white, letterSpacing: 0.4)),
                  ],
                ),
              ),
            ),
          // Type badge (top-left)
          Positioned(
            top: 6,
            left: 6,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 2),
              decoration: BoxDecoration(
                color: Colors.black.withValues(alpha: 0.55),
                borderRadius: BorderRadius.circular(4),
                border: Border.all(color: Colors.white.withValues(alpha: 0.12), width: 0.5),
              ),
              child: Text(
                item.mediaType == 'tv' ? 'TV' : 'MOVIE',
                style: const TextStyle(
                  fontFamily: AppTypography.labelFont,
                  fontSize: 7.5,
                  fontWeight: FontWeight.w700,
                  color: AppColors.white,
                  letterSpacing: 0.6,
                ),
              ),
            ),
          ),
          // Rating pill (bottom-right)
          if (hasRating)
            Positioned(
              right: 6,
              bottom: 6,
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 2),
                decoration: BoxDecoration(
                  color: Colors.black.withValues(alpha: 0.65),
                  borderRadius: BorderRadius.circular(4),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Icon(Icons.star_rounded, size: 11, color: Color(0xFFFFC107)),
                    const SizedBox(width: 2),
                    Text(
                      item.ratingFormatted,
                      style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w700, color: AppColors.white),
                    ),
                  ],
                ),
              ),
            ),
        ],
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
        child: Icon(Icons.movie_creation_outlined, size: 26, color: AppColors.onSurfaceVariant),
      ),
    );
  }
}

class _MetaLine extends StatelessWidget {
  final MediaItem item;
  final bool hasRating;

  const _MetaLine({required this.item, required this.hasRating});

  @override
  Widget build(BuildContext context) {
    final parts = <String>[
      if (item.year > 0) item.year.toString(),
      if (item.mediaType == 'tv' && item.seasons != null) '${item.seasons!.length} seasons',
    ];

    return Text(
      parts.join('  ·  '),
      maxLines: 1,
      overflow: TextOverflow.ellipsis,
      style: TextStyle(
        color: AppColors.onSurfaceVariant.withValues(alpha: 0.75),
        fontSize: 10.5,
        fontWeight: FontWeight.w500,
      ),
    );
  }
}
