import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../theme/app_colors.dart';
import '../../theme/app_typography.dart';

class AppShell extends ConsumerWidget {
  final Widget child;
  final String? title;

  const AppShell({super.key, required this.child, this.title});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Scaffold(
      appBar: title != null ? AppBar(title: Text(title!)) : null,
      body: child,
    );
  }
}

class AppScaffold extends StatelessWidget {
  final Widget child;

  const AppScaffold({super.key, required this.child});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('NovaFlix', style: AppTypography.headlineMd),
        actions: [
          IconButton(
            icon: const Icon(Icons.search),
            onPressed: () => context.push('/search'),
          ),
        ],
      ),
      body: child,
      bottomNavigationBar: _NovaBottomNav(),
    );
  }
}

class _NovaBottomNav extends ConsumerWidget {
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final location = GoRouterState.of(context).matchedLocation;

    int currentIndex = 0;
    if (location.startsWith('/search') || location.startsWith('/discover') || location.startsWith('/tv-shows')) currentIndex = 1;
    if (location.startsWith('/watchlist') || location.startsWith('/profile') || location.startsWith('/settings') || location.startsWith('/pricing')) currentIndex = 2;

    return Container(
      decoration: const BoxDecoration(
        border: Border(top: BorderSide(color: AppColors.outlineVariant, width: 0.5)),
      ),
      child: BottomNavigationBar(
        currentIndex: currentIndex,
        onTap: (index) {
          switch (index) {
            case 0: context.go('/home');
            case 1: context.go('/discover');
            case 2: context.go('/profile');
          }
        },
        items: const [
          BottomNavigationBarItem(icon: Icon(Icons.home_outlined), activeIcon: Icon(Icons.home), label: 'Home'),
          BottomNavigationBarItem(icon: Icon(Icons.explore_outlined), activeIcon: Icon(Icons.explore), label: 'Discover'),
          BottomNavigationBarItem(icon: Icon(Icons.person_outline), activeIcon: Icon(Icons.person), label: 'Profile'),
        ],
      ),
    );
  }
}
