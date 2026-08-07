import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../core/config.dart';
import '../theme/app_colors.dart';
import '../providers/auth_provider.dart';
import '../widgets/ui/index.dart';

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

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 600),
    );
    _scaleAnim = Tween<double>(begin: 0.92, end: 1.0).animate(
      CurvedAnimation(parent: _controller, curve: Curves.easeOut),
    );
    _fadeAnim = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(parent: _controller, curve: Curves.easeOut),
    );
    _controller.forward();

    Timer(const Duration(seconds: 5), _navigateNext);
  }

  void _navigateNext() {
    if (!mounted) return;
    final authState = ref.read(authProvider);
    debugPrint('[splash] timer fired, authStatus=${authState.status}');
    if (authState.status == AuthStatus.authenticated) {
      debugPrint('[splash] -> /home (authenticated)');
      context.go('/home');
      return;
    }
    _maybeShowOnboarding().then((show) {
      if (!mounted) return;
      debugPrint('[splash] -> ${show ? "/onboarding" : "/home"} (guest, showOnboarding=$show)');
      context.go(show ? '/onboarding' : '/home');
    });
  }

  Future<bool> _maybeShowOnboarding() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final seen = prefs.getBool(AppConfig.onboardingSeenKey);
      debugPrint('[splash] onboardingSeen=$seen');
      return seen != true;
    } catch (e) {
      debugPrint('[splash] prefs error: $e');
      return false;
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
      body: Center(
        child: AnimatedBuilder(
          animation: _controller,
          builder: (_, child) => Opacity(
            opacity: _fadeAnim.value,
            child: Transform.scale(
              scale: _scaleAnim.value,
              child: child,
            ),
          ),
          child: const AnimatedLoader(
            size: 320,
            logoAsset: 'assets/brand/combination-mark-logo.png',
            logoSize: 80,
          ),
        ),
      ),
    );
  }
}
