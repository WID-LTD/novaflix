import 'dart:async';
import 'dart:math' as math;
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../../models/media_item.dart';
import '../../services/api_service.dart';
import '../../theme/app_colors.dart';

const _skewRad = 18 * math.pi / 180;

Future<List<MediaItem>>? _backdropsFuture;

Future<List<MediaItem>> _fetchBackdrops() {
  return _backdropsFuture ??= _loadBackdrops();
}

Future<List<MediaItem>> _loadBackdrops() async {
  try {
    final api = ApiService();
    final res = await api.getTrending();
    final data =
        res.data['data'] as Map<String, dynamic>? ??
        (res.data is Map ? Map<String, dynamic>.from(res.data as Map) : null);
    if (data == null) return [];
    final movies = (data['movies'] as List?) ?? [];
    final tv = (data['tv'] as List?) ?? [];
    final items = [...movies, ...tv]
        .where((e) => e is Map<String, dynamic>)
        .map((e) => MediaItem.fromJson(e as Map<String, dynamic>))
        .where((m) => m.backdropUrl != null)
        .take(4)
        .toList();
    return items;
  } catch (_) {
    return [];
  }
}

/// Image that fades in (with a per-index delay) and slowly zooms, mirroring
/// the web `backdrop-zoom` + staggered `fadeIn` behaviour.
class _ZoomFadeImage extends StatefulWidget {
  final String url;
  final Duration delay;

  const _ZoomFadeImage({required this.url, required this.delay});

  @override
  State<_ZoomFadeImage> createState() => _ZoomFadeImageState();
}

class _ZoomFadeImageState extends State<_ZoomFadeImage>
    with SingleTickerProviderStateMixin {
  late final AnimationController _zoom;
  bool _visible = false;

  @override
  void initState() {
    super.initState();
    _zoom = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 20),
    )..repeat(reverse: true);
    Timer(widget.delay, () {
      if (mounted) setState(() => _visible = true);
    });
  }

  @override
  void dispose() {
    _zoom.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedOpacity(
      opacity: _visible ? 1 : 0,
      duration: const Duration(milliseconds: 800),
      curve: Curves.easeOut,
      child: ScaleTransition(
        scale: Tween<double>(begin: 1, end: 1.08).animate(_zoom),
        child: CachedNetworkImage(
          imageUrl: widget.url,
          fit: BoxFit.cover,
          fadeInDuration: const Duration(milliseconds: 300),
          placeholder: (_, __) =>
              Container(color: AppColors.surfaceContainerLow),
          errorWidget: (_, __, ___) =>
              Container(color: AppColors.surfaceContainerLow),
        ),
      ),
    );
  }
}

/// Mirrors web `components/features/LoginBackdrop.tsx`: four trending movie
/// backdrops filling triangular panes that converge at the centre, with a slow
/// Ken-Burns zoom and staggered fade-in.
class LoginBackdrop extends ConsumerWidget {
  const LoginBackdrop({super.key});

  static const _panes = [
    // top, right, bottom, left
    _Pane(0, 0, 0.5, 0.5, 1, 0),
    _Pane(0.5, 0.5, 1, 0, 1, 1),
    _Pane(0.5, 0.5, 1, 1, 0, 1),
    _Pane(0.5, 0.5, 0, 1, 0, 0),
  ];

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return FutureBuilder<List<MediaItem>>(
      future: _fetchBackdrops(),
      builder: (context, snapshot) {
        final items = snapshot.data ?? const [];
        if (items.isEmpty) {
          return Container(
            decoration: const BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
                colors: [
                  Color(0x1AE50914),
                  AppColors.background,
                ],
              ),
            ),
          );
        }
        return Stack(
          fit: StackFit.expand,
          children: [
            for (var i = 0; i < items.length; i++)
              ClipPath(
                clipper: _TriangleClipper(_panes[i]),
                child: _ZoomFadeImage(
                  url: items[i].backdropUrl!,
                  delay: Duration(milliseconds: 150 * i),
                ),
              ),
            _bottomFade(),
            _leftShade(),
          ],
        );
      },
    );
  }

  Widget _bottomFade() {
    return DecoratedBox(
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.bottomCenter,
          end: Alignment.topCenter,
          stops: const [0, 0.5, 1],
          colors: [
            AppColors.background,
            AppColors.background.withValues(alpha: 0.6),
            AppColors.background.withValues(alpha: 0.8),
          ],
        ),
      ),
      child: const SizedBox.expand(),
    );
  }

  Widget _leftShade() {
    return DecoratedBox(
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.centerLeft,
          end: Alignment.centerRight,
          colors: [
            Colors.black.withValues(alpha: 0.4),
            Colors.transparent,
          ],
        ),
      ),
      child: const SizedBox.expand(),
    );
  }
}

/// Mirrors web `components/features/ObliqueColumnsBackdrop.tsx`: four skewed
/// vertical columns of trending backdrops with staggered fade-in + zoom.
class ObliqueColumnsBackdrop extends ConsumerWidget {
  const ObliqueColumnsBackdrop({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return FutureBuilder<List<MediaItem>>(
      future: _fetchBackdrops(),
      builder: (context, snapshot) {
        final items = snapshot.data ?? const [];
        if (items.isEmpty) {
          return Container(
            decoration: const BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
                colors: [
                  Color(0x1AE50914),
                  AppColors.background,
                ],
              ),
            ),
          );
        }
        return Stack(
          fit: StackFit.expand,
          children: [
            Row(
              children: [
                for (var i = 0; i < items.length; i++)
                  Expanded(
                    child: Container(
                      margin: EdgeInsets.only(left: i > 0 ? -12 : 0),
                      clipBehavior: Clip.hardEdge,
                      transform: Matrix4.skewX(-_skewRad),
                      child: Transform(
                        transform:
                            Matrix4.skewX(_skewRad).scaled(1.3, 1.3),
                        child: _ZoomFadeImage(
                          url: items[i].backdropUrl!,
                          delay: Duration(milliseconds: 200 * i),
                        ),
                      ),
                    ),
                  ),
              ],
            ),
            DecoratedBox(
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.bottomCenter,
                  end: Alignment.topCenter,
                  stops: const [0, 0.5, 1],
                  colors: [
                    AppColors.background,
                    AppColors.background.withValues(alpha: 0.6),
                    AppColors.background.withValues(alpha: 0.8),
                  ],
                ),
              ),
              child: const SizedBox.expand(),
            ),
            DecoratedBox(
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.centerLeft,
                  end: Alignment.centerRight,
                  colors: [
                    Colors.black.withValues(alpha: 0.4),
                    Colors.transparent,
                  ],
                ),
              ),
              child: const SizedBox.expand(),
            ),
          ],
        );
      },
    );
  }
}

class _Pane {
  final double x1, y1, x2, y2, x3, y3;
  const _Pane(this.x1, this.y1, this.x2, this.y2, this.x3, this.y3);
}

class _TriangleClipper extends CustomClipper<Path> {
  final _Pane pane;
  _TriangleClipper(this.pane);

  @override
  Path getClip(Size size) {
    return Path()
      ..moveTo(size.width * pane.x1, size.height * pane.y1)
      ..lineTo(size.width * pane.x2, size.height * pane.y2)
      ..lineTo(size.width * pane.x3, size.height * pane.y3)
      ..close();
  }

  @override
  bool shouldReclip(_TriangleClipper oldClipper) =>
      oldClipper.pane != pane;
}
