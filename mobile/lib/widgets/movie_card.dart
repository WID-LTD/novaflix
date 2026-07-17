import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:go_router/go_router.dart';
import '../models/media_item.dart';
import '../theme/app_theme.dart';

class MovieCard extends StatelessWidget {
  final MediaItem item;
  final double width;
  final double height;

  const MovieCard({super.key, required this.item, this.width = 130, this.height = 195});

  @override
  Widget build(BuildContext context) {
    final path = '/${item.mediaType == 'tv' ? 'tv' : 'movie'}/${item.id}';

    return GestureDetector(
      onTap: () => context.go(path),
      child: SizedBox(
        width: width,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            ClipRRect(
              borderRadius: BorderRadius.circular(8),
              child: SizedBox(
                height: height,
                width: width,
                child: item.posterUrl != null
                    ? CachedNetworkImage(imageUrl: item.posterUrl!, fit: BoxFit.cover)
                    : Container(color: AppTheme.card, child: const Icon(Icons.movie, color: AppTheme.gray)),
              ),
            ),
            const SizedBox(height: 6),
            Text(item.title, maxLines: 2, overflow: TextOverflow.ellipsis, style: const TextStyle(color: AppTheme.white, fontSize: 12, fontWeight: FontWeight.w500)),
            if (item.releaseDate != null)
              Text(item.releaseDate!.substring(0, 4), style: TextStyle(color: AppTheme.gray.withValues(alpha: 0.7), fontSize: 11)),
          ],
        ),
      ),
    );
  }
}
