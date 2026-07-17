import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../theme/app_theme.dart';

class SplashScreen extends StatefulWidget {
  const SplashScreen({super.key});

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen> with SingleTickerProviderStateMixin {
  late AnimationController _animCtrl;
  late Animation<double> _fadeAnim;
  late Animation<double> _scaleAnim;

  @override
  void initState() {
    super.initState();
    _animCtrl = AnimationController(vsync: this, duration: const Duration(milliseconds: 2000));
    _fadeAnim = Tween<double>(begin: 0, end: 1).animate(CurvedAnimation(parent: _animCtrl, curve: Curves.easeIn));
    _scaleAnim = Tween<double>(begin: 0.5, end: 1).animate(CurvedAnimation(parent: _animCtrl, curve: Curves.elasticOut));
    _animCtrl.forward();
    Future.delayed(const Duration(milliseconds: 3500), () {
      if (mounted) context.go('/home');
    });
  }

  @override
  void dispose() {
    _animCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.black,
      body: Center(
        child: FadeTransition(
          opacity: _fadeAnim,
          child: ScaleTransition(
            scale: _scaleAnim,
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Container(
                  width: 80, height: 80,
                  decoration: BoxDecoration(
                    color: AppTheme.red,
                    borderRadius: BorderRadius.circular(16),
                  ),
                  child: const Center(
                    child: Text('N', style: TextStyle(fontSize: 48, fontWeight: FontWeight.w900, color: AppTheme.white)),
                  ),
                ),
                const SizedBox(height: 24),
                const Text('NOVAFLIX', style: TextStyle(fontSize: 36, fontWeight: FontWeight.w900, color: AppTheme.white, letterSpacing: 8)),
                const SizedBox(height: 32),
                SizedBox(
                  width: 200,
                  child: ClipRRect(
                    borderRadius: BorderRadius.circular(2),
                    child: const LinearProgressIndicator(
                      backgroundColor: AppTheme.card,
                      valueColor: AlwaysStoppedAnimation(AppTheme.red),
                    ),
                  ),
                ),
                const SizedBox(height: 12),
                Text('Initializing Core', style: TextStyle(color: AppTheme.gray.withValues(alpha: 0.6), fontSize: 13)),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
