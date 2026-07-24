import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../theme/app_colors.dart';
import '../theme/app_typography.dart';
import '../providers/auth_provider.dart';

class SplashScreen extends ConsumerStatefulWidget {
  const SplashScreen({super.key});

  @override
  ConsumerState<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends ConsumerState<SplashScreen>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _scaleAnim;
  late Animation<double> _fadeAnim;
  late Animation<double> _progressAnim;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 5000),
    );
    _scaleAnim = Tween<double>(begin: 0.8, end: 1.0).animate(
      CurvedAnimation(parent: _controller, curve: const Interval(0, 0.3, curve: Curves.easeOut)),
    );
    _fadeAnim = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(parent: _controller, curve: const Interval(0, 0.3, curve: Curves.easeOut)),
    );
    _progressAnim = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(parent: _controller, curve: const Interval(0.2, 0.8, curve: Curves.easeInOut)),
    );

    _controller.forward();

    Timer(const Duration(seconds: 5), _navigateNext);
  }

  void _navigateNext() {
    if (!mounted) return;
    final authState = ref.read(authProvider);
    if (authState.status == AuthStatus.authenticated) {
      context.go('/home');
    } else {
      context.go('/landing');
    }
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      body: Stack(
        children: [
          Center(
            child: AnimatedBuilder(
              animation: _controller,
              builder: (_, child) => Opacity(
                opacity: _fadeAnim.value,
                child: Transform.scale(
                  scale: _scaleAnim.value,
                  child: child,
                ),
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(Icons.play_circle_fill, size: 80, color: AppColors.primary),
                  const SizedBox(height: 16),
                  ShaderMask(
                    shaderCallback: (bounds) => LinearGradient(
                      colors: [AppColors.primary, AppColors.primaryLight],
                    ).createShader(bounds),
                    child: Text('NOVAFLIX',
                      style: AppTypography.displayLg.copyWith(
                        color: Colors.white,
                        fontSize: 48,
                        fontWeight: FontWeight.w900,
                        letterSpacing: 6,
                      ),
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text('Movies & Creator Platform',
                    style: AppTypography.bodyMd.copyWith(color: AppColors.onSurfaceVariant),
                  ),
                ],
              ),
            ),
          ),
          Positioned(
            left: 40,
            right: 40,
            bottom: 80,
            child: Column(
              children: [
                SizedBox(
                  height: 3,
                  child: AnimatedBuilder(
                    animation: _progressAnim,
                    builder: (_, __) => ClipRRect(
                      borderRadius: BorderRadius.circular(2),
                      child: LinearProgressIndicator(
                        value: _progressAnim.value,
                        backgroundColor: AppColors.surfaceContainerHighest,
                        valueColor: AlwaysStoppedAnimation(AppColors.primary),
                      ),
                    ),
                  ),
                ),
                const SizedBox(height: 12),
                AnimatedBuilder(
                  animation: _fadeAnim,
                  builder: (_, __) => Opacity(
                    opacity: _fadeAnim.value > 0.7 ? (_fadeAnim.value - 0.7) / 0.3 : 0,
                    child: Text('Initializing Core',
                      style: AppTypography.labelSm.copyWith(
                        color: AppColors.onSurfaceVariant,
                        letterSpacing: 3,
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
