import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../core/config.dart';
import '../theme/app_colors.dart';
import '../theme/app_typography.dart';

/// First-run guide shown once (gated by [AppConfig.onboardingSeenKey]).
/// There is no marketing landing page - users land here, then go straight
/// into the app (Home for viewers, Creator dashboard for creators).
class OnboardingScreen extends ConsumerStatefulWidget {
  const OnboardingScreen({super.key});

  @override
  ConsumerState<OnboardingScreen> createState() => _OnboardingScreenState();
}

class _OnboardingScreenState extends ConsumerState<OnboardingScreen> {
  final PageController _controller = PageController();
  int _page = 0;

  static const _pages = [
    _StepData(
      icon: Icons.play_circle_fill,
      title: 'Stream anywhere',
      subtitle: 'Movies, TV shows, and creator content stream instantly in up to 4K.',
    ),
    _StepData(
      icon: Icons.download_outlined,
      title: 'Download & go',
      subtitle: 'Save titles offline and watch even without a connection.',
    ),
    _StepData(
      icon: Icons.auto_awesome,
      title: 'Built for you',
      subtitle: 'Personalized recommendations, watchlists, and creator tools.',
    ),
  ];

  Future<void> _finish() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setBool(AppConfig.onboardingSeenKey, true);
    } catch (_) {}
    if (!mounted) return;
    context.go('/home');
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final isLast = _page == _pages.length - 1;

    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: Column(
          children: [
            Align(
              alignment: Alignment.centerRight,
              child: TextButton(
                onPressed: _finish,
                child: Text('Skip', style: AppTypography.labelMd.copyWith(color: AppColors.onSurfaceVariant)),
              ),
            ),
            Expanded(
              child: PageView.builder(
                controller: _controller,
                onPageChanged: (i) => setState(() => _page = i),
                itemCount: _pages.length,
                itemBuilder: (_, i) {
                  final p = _pages[i];
                  return Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 32),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Container(
                          width: 120,
                          height: 120,
                          decoration: BoxDecoration(
                            color: AppColors.surfaceContainerHigh,
                            borderRadius: BorderRadius.circular(32),
                            border: Border.all(color: AppColors.primary.withValues(alpha: 0.4)),
                          ),
                          child: Icon(p.icon, size: 64, color: AppColors.primary),
                        ),
                        const SizedBox(height: 40),
                        Text(p.title, style: AppTypography.headlineLg, textAlign: TextAlign.center),
                        const SizedBox(height: 16),
                        Text(
                          p.subtitle,
                          style: AppTypography.bodyMd.copyWith(color: AppColors.onSurfaceVariant),
                          textAlign: TextAlign.center,
                        ),
                      ],
                    ),
                  );
                },
              ),
            ),
            _Dots(count: _pages.length, index: _page),
            Padding(
              padding: const EdgeInsets.fromLTRB(24, 24, 24, 32),
              child: ElevatedButton(
                onPressed: () {
                  if (isLast) {
                    _finish();
                  } else {
                    _controller.nextPage(
                      duration: const Duration(milliseconds: 300),
                      curve: Curves.easeOut,
                    );
                  }
                },
                child: Text(isLast ? 'Get Started' : 'Continue'),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _Dots extends StatelessWidget {
  final int count;
  final int index;

  const _Dots({required this.count, required this.index});

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        for (var i = 0; i < count; i++)
          AnimatedContainer(
            duration: const Duration(milliseconds: 250),
            margin: const EdgeInsets.symmetric(horizontal: 4),
            width: i == index ? 24 : 8,
            height: 8,
            decoration: BoxDecoration(
              color: i == index ? AppColors.primary : AppColors.surfaceContainerHighest,
              borderRadius: BorderRadius.circular(4),
            ),
          ),
      ],
    );
  }
}

class _StepData {
  final IconData icon;
  final String title;
  final String subtitle;

  const _StepData({required this.icon, required this.title, required this.subtitle});
}