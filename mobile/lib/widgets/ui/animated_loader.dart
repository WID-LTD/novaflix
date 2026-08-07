import 'dart:math' as math;
import 'package:flutter/material.dart';
import '../../theme/app_colors.dart';

/// NovaFlix animated loading screen.
///
/// Mirrors the "Growing Orbiting Particles" design:
/// - Central logo pulses (scale 0.85 <-> 1.15, opacity 0.5 <-> 1) with no glow.
/// - Three orbit rings grow in stages over a 12s cycle:
///   stage 1 -> inner ring (3 small particles), stage 2 -> + middle ring
///   (3 medium, reversed), stage 3 -> + outer ring (6 large particles).
/// - The whole stage grows 0.7x -> 1.0x -> 1.35x across the cycle.
///
/// Pass [logoAsset] to choose the combined logo (splash) vs the wordmark
/// (loading sessions). [showStatus] toggles the phase label.
class AnimatedLoader extends StatefulWidget {
  const AnimatedLoader({
    super.key,
    this.size = 220,
    this.color = AppColors.primary,
    this.logoAsset = 'assets/brand/leter-mark-logo.png',
    this.logoSize = 44,
    this.cycleDuration = const Duration(seconds: 12),
    this.pulseDuration = const Duration(milliseconds: 1200),
  });

  final double size;
  final Color color;
  final String logoAsset;
  final double logoSize;
  final Duration cycleDuration;
  final Duration pulseDuration;

  @override
  State<AnimatedLoader> createState() => _AnimatedLoaderState();
}

class _AnimatedLoaderState extends State<AnimatedLoader>
    with TickerProviderStateMixin {
  late final AnimationController _cycle; // 12s growth stages
  late final AnimationController _pulse; // logo pulse
  late final AnimationController _inner; // 1.6s spin
  late final AnimationController _middle; // 2.4s reverse
  late final AnimationController _outer; // 3.2s spin

  @override
  void initState() {
    super.initState();
    _cycle = AnimationController(vsync: this, duration: widget.cycleDuration)
      ..repeat();
    _pulse = AnimationController(vsync: this, duration: widget.pulseDuration)
      ..repeat(reverse: true);
    _inner = AnimationController(
        vsync: this, duration: const Duration(milliseconds: 1600))
      ..repeat();
    _middle = AnimationController(
        vsync: this, duration: const Duration(milliseconds: 2400))
      ..repeat(reverse: true);
    _outer = AnimationController(
        vsync: this, duration: const Duration(milliseconds: 3200))
      ..repeat();
  }

  @override
  void dispose() {
    _cycle.dispose();
    _pulse.dispose();
    _inner.dispose();
    _middle.dispose();
    _outer.dispose();
    super.dispose();
  }

  double _stageScale(double t) {
    // Matches growthStages keyframes over a 1.0 (12s) cycle.
    double lerpTo(double a, double b, double t01) => a + (b - a) * t01;
    if (t < 0.25) return 0.7;
    if (t < 0.33) return lerpTo(0.7, 1.0, (t - 0.25) / 0.08);
    if (t < 0.58) return 1.0;
    if (t < 0.66) return lerpTo(1.0, 1.35, (t - 0.58) / 0.08);
    if (t < 0.91) return 1.35;
    return lerpTo(1.35, 0.7, (t - 0.91) / 0.09);
  }

  double _ringOpacity(double t, double start) {
    // Rings fade in over ~0.5s once their stage begins.
    final tt = Curves.easeInOut.transform(((t - start) / 0.042).clamp(0.0, 1.0));
    return tt;
  }

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: widget.size,
      height: widget.size,
      child: AnimatedBuilder(
        animation: _cycle,
        builder: (_, child) => Transform.scale(
          scale: _stageScale(_cycle.value),
          child: child,
        ),
        child: Stack(
          alignment: Alignment.center,
          children: [
            AnimatedBuilder(
              animation: Listenable.merge([_inner, _pulse, _cycle]),
              builder: (_, _) => Stack(
                alignment: Alignment.center,
                children: [
                  _buildRing(
                    spinController: _inner,
                    radiusRatio: 40 / 220,
                    particleSizeRatio: 4 / 220,
                    count: 3,
                    opacity: 1.0,
                    reverse: false,
                  ),
                  _buildRing(
                    spinController: _middle,
                    radiusRatio: 65 / 220,
                    particleSizeRatio: 6 / 220,
                    count: 3,
                    opacity: _ringOpacity(_cycle.value, 0.333),
                    reverse: true,
                  ),
                  _buildRing(
                    spinController: _outer,
                    radiusRatio: 90 / 220,
                    particleSizeRatio: 8 / 220,
                    count: 6,
                    opacity: _ringOpacity(_cycle.value, 0.666),
                    reverse: false,
                  ),
                  _buildLogo(),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildLogo() {
    return AnimatedBuilder(
      animation: _pulse,
      builder: (_, _) {
        final t = Curves.easeInOut.transform(_pulse.value);
        final scale = 0.85 + (0.30 * t);
        final opacity = 0.5 + (0.5 * t);
        return Opacity(
          opacity: opacity,
          child: Transform.scale(
            scale: scale,
            child: Image.asset(
              widget.logoAsset,
              width: widget.logoSize,
              fit: BoxFit.contain,
              gaplessPlayback: true,
            ),
          ),
        );
      },
    );
  }

  Widget _buildRing({
    required AnimationController spinController,
    required double radiusRatio,
    required double particleSizeRatio,
    required int count,
    required double opacity,
    required bool reverse,
  }) {
    final radius = widget.size / 2 * radiusRatio;
    final particleSize = widget.size * particleSizeRatio;
    return Opacity(
      opacity: opacity.clamp(0.0, 1.0),
      child: AnimatedBuilder(
        animation: spinController,
        builder: (_, _) {
          final angle = spinController.value * 2 * math.pi * (reverse ? -1 : 1);
          return Transform.rotate(
            angle: angle,
            child: Stack(
              alignment: Alignment.center,
              children: List.generate(count, (i) {
                final a = (2 * math.pi * i) / count;
                return Transform.translate(
                  offset: Offset(radius * math.cos(a), radius * math.sin(a)),
                  child: Container(
                    width: particleSize,
                    height: particleSize,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      color: widget.color,
                      boxShadow: [
                        BoxShadow(
                          color: widget.color.withValues(alpha: 0.5),
                          blurRadius: particleSize,
                          spreadRadius: particleSize * 0.15,
                        ),
                      ],
                    ),
                  ),
                );
              }),
            ),
          );
        },
      ),
    );
  }
}
