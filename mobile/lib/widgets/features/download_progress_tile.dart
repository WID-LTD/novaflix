import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../../theme/app_colors.dart';

/// A circular download progress indicator wrapped around a movie poster
/// backdrop image. Mirrors Netflix-style "downloading" tiles.
class DownloadProgressTile extends StatelessWidget {
  final String? backdrop;
  final String? poster;
  final double progress; // 0..1
  final bool active; // true when actively downloading
  final double size;
  final VoidCallback? onTap;
  final VoidCallback? onCancel;

  const DownloadProgressTile({
    super.key,
    this.backdrop,
    this.poster,
    this.progress = 0,
    this.active = false,
    this.size = 96,
    this.onTap,
    this.onCancel,
  });

  @override
  Widget build(BuildContext context) {
    final imageUrl = backdrop ?? poster;
    return GestureDetector(
      onTap: onTap,
      child: SizedBox(
        width: size,
        height: size,
        child: Stack(
          fit: StackFit.expand,
          children: [
            // Poster backdrop clipped to a circle
            ClipOval(
              child: imageUrl != null && imageUrl.isNotEmpty
                  ? CachedNetworkImage(
                      imageUrl: imageUrl,
                      fit: BoxFit.cover,
                      errorWidget: (_, __, ___) => _placeholder(),
                      placeholder: (_, __) => _placeholder(),
                    )
                  : _placeholder(),
            ),
            // Darken circle so the ring reads clearly
            ClipOval(
              child: Container(color: Colors.black.withValues(alpha: 0.35)),
            ),
            // Circular progress ring
            Padding(
              padding: const EdgeInsets.all(3),
              child: CircularProgressIndicator(
                value: active ? progress.clamp(0.0, 1.0) : null,
                strokeWidth: 3,
                color: AppColors.primary,
                backgroundColor: Colors.white24,
              ),
            ),
            // Percentage / state in the center
            Center(
              child: active
                  ? Text(
                      '${(progress * 100).round()}%',
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 12,
                        fontWeight: FontWeight.w700,
                      ),
                    )
                  : Icon(
                      progress >= 1 ? Icons.check : Icons.download_done,
                      color: Colors.white,
                      size: size * 0.28,
                    ),
            ),
            if (onCancel != null && active)
              Positioned(
                right: 0,
                top: 0,
                child: GestureDetector(
                  onTap: onCancel,
                  child: Container(
                    decoration: BoxDecoration(
                      color: Colors.black.withValues(alpha: 0.7),
                      shape: BoxShape.circle,
                    ),
                    padding: const EdgeInsets.all(3),
                    child: Icon(Icons.close, color: Colors.white, size: size * 0.18),
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }

  Widget _placeholder() => Container(
        color: AppColors.surfaceContainerHigh,
        child: const Icon(Icons.movie, color: Colors.white24),
      );
}
