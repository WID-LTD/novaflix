import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../providers/auth_provider.dart';
import '../screens/home_screen.dart';
import '../screens/login_screen.dart';
import '../screens/register_screen.dart';
import '../screens/verify_email_screen.dart';
import '../screens/movie_detail_screen.dart';
import '../screens/profile_screen.dart';
import '../screens/search_screen.dart';
import '../screens/tv_shows_screen.dart';
import '../screens/discover_screen.dart';
import '../screens/watchlist_screen.dart';
import '../screens/settings_screen.dart';
import '../screens/pricing_screen.dart';
import '../screens/upload_screen.dart';
import '../screens/store_screen.dart';
import '../screens/learn_screen.dart';
import '../screens/watch_party_screen.dart';
import '../screens/watch_screen.dart';
import '../screens/landing_screen.dart';
import '../screens/creators_screen.dart';
import '../screens/creator_login_screen.dart';
import '../screens/creator_dashboard_screen.dart';
import '../screens/admin_dashboard_screen.dart';
import '../screens/category_screen.dart';
import '../screens/profile_gateway_screen.dart';
import '../screens/not_found_screen.dart';
import '../screens/splash_screen.dart';
import '../screens/hooks_feed_screen.dart';
import '../screens/creator_analytics_screen.dart';
import '../screens/creator_profile_hub_screen.dart';
import '../screens/creator_catalog_screen.dart';
import '../screens/admin_asset_qc_screen.dart';
import '../screens/admin_filters_screen.dart';
import '../screens/admin_localization_screen.dart';

final _rootNavigatorKey = GlobalKey<NavigatorState>();
final _shellNavigatorKey = GlobalKey<NavigatorState>();

GoRouter appRouter(WidgetRef ref) {
  final authState = ref.watch(authProvider);

  return GoRouter(
    navigatorKey: _rootNavigatorKey,
    initialLocation: '/splash',
    redirect: (context, state) {
      final isAuth = authState.status == AuthStatus.authenticated;
      final isAuthRoute = state.matchedLocation == '/login' ||
          state.matchedLocation == '/register' ||
          state.matchedLocation == '/verify-email' ||
          state.matchedLocation == '/splash';

      if (isAuth && isAuthRoute && state.matchedLocation != '/landing') return '/home';
      if (!isAuth && !isAuthRoute) {
        if (state.matchedLocation == '/landing' || state.matchedLocation == '/creators' ||
            state.matchedLocation == '/creator/login') return null;
        return '/login';
      }
      return null;
    },
    routes: [
      GoRoute(path: '/splash', builder: (_, __) => const SplashScreen()),
      GoRoute(path: '/landing', builder: (_, __) => const LandingScreen()),
      GoRoute(path: '/login', builder: (_, __) => const LoginScreen()),
      GoRoute(path: '/register', builder: (_, __) => const RegisterScreen()),
      GoRoute(path: '/verify-email', builder: (_, __) => const VerifyEmailScreen()),
      GoRoute(path: '/profiles', builder: (_, __) => const ProfileGatewayScreen()),
      GoRoute(path: '/creator/login', builder: (_, __) => const CreatorLoginScreen()),
      GoRoute(path: '/creators', builder: (_, __) => const CreatorsScreen()),

      ShellRoute(
        navigatorKey: _shellNavigatorKey,
        builder: (context, state, child) => AppShell(child: child),
        routes: [
          GoRoute(path: '/home', pageBuilder: (_, s) => NoTransitionPage(child: HomeScreen(key: s.pageKey))),
          GoRoute(path: '/', pageBuilder: (_, s) => NoTransitionPage(child: HomeScreen(key: s.pageKey))),
          GoRoute(path: '/search', pageBuilder: (_, s) => NoTransitionPage(child: const SearchScreen())),
          GoRoute(path: '/tv-shows', pageBuilder: (_, s) => NoTransitionPage(child: const TVShowsScreen())),
          GoRoute(path: '/discover', pageBuilder: (_, s) => NoTransitionPage(child: const DiscoverScreen())),
          GoRoute(path: '/watchlist', pageBuilder: (_, s) => NoTransitionPage(child: const WatchlistScreen())),
          GoRoute(path: '/profile', pageBuilder: (_, s) => NoTransitionPage(child: const ProfileScreen())),
          GoRoute(path: '/settings', pageBuilder: (_, s) => NoTransitionPage(child: const SettingsScreen())),
          GoRoute(path: '/pricing', pageBuilder: (_, s) => NoTransitionPage(child: const PricingScreen())),
          GoRoute(path: '/upload', pageBuilder: (_, s) => NoTransitionPage(child: const UploadScreen())),
          GoRoute(path: '/store', pageBuilder: (_, s) => NoTransitionPage(child: const StoreScreen())),
          GoRoute(path: '/learn', pageBuilder: (_, s) => NoTransitionPage(child: const LearnScreen())),
          GoRoute(path: '/watch-party', pageBuilder: (_, s) => NoTransitionPage(child: const WatchPartyScreen())),
          GoRoute(path: '/hooks', pageBuilder: (_, s) => NoTransitionPage(child: const HooksFeedScreen())),
          GoRoute(path: '/category', pageBuilder: (_, s) => NoTransitionPage(child: const CategoryScreen())),
          GoRoute(path: '/category/:slug', pageBuilder: (_, s) => NoTransitionPage(child: const CategoryScreen())),
          GoRoute(path: '/movie/:id', pageBuilder: (_, s) => NoTransitionPage(child: MovieDetailScreen(movieId: int.parse(s.pathParameters['id']!)))),
          GoRoute(path: '/tv/:id', pageBuilder: (_, s) => NoTransitionPage(child: MovieDetailScreen(movieId: int.parse(s.pathParameters['id']!)))),
          GoRoute(path: '/watch', pageBuilder: (_, s) => NoTransitionPage(child: WatchScreen(
            movieId: int.tryParse(s.uri.queryParameters['id'] ?? ''),
            mediaType: s.uri.queryParameters['type'],
            streamUrl: s.uri.queryParameters['url'],
          ))),
          GoRoute(path: '/creator', pageBuilder: (_, s) => NoTransitionPage(child: const CreatorDashboardScreen())),
          GoRoute(path: '/creator/analytics', pageBuilder: (_, s) => NoTransitionPage(child: const CreatorAnalyticsScreen())),
          GoRoute(path: '/creator/profile', pageBuilder: (_, s) => NoTransitionPage(child: const CreatorProfileHubScreen())),
          GoRoute(path: '/creator/catalog', pageBuilder: (_, s) => NoTransitionPage(child: const CreatorCatalogScreen())),
          GoRoute(path: '/admin', pageBuilder: (_, s) => NoTransitionPage(child: const AdminDashboardScreen())),
          GoRoute(path: '/admin/asset-qc', pageBuilder: (_, s) => NoTransitionPage(child: const AdminAssetQCScreen())),
          GoRoute(path: '/admin/filters', pageBuilder: (_, s) => NoTransitionPage(child: const AdminFiltersScreen())),
          GoRoute(path: '/admin/localization', pageBuilder: (_, s) => NoTransitionPage(child: const AdminLocalizationScreen())),
        ],
      ),
      GoRoute(path: '/:path(.*)', builder: (_, __) => const NotFoundScreen()),
    ],
  );
}

class AppShell extends StatelessWidget {
  final Widget child;
  const AppShell({super.key, required this.child});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
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
    if (location.startsWith('/watchlist') || location.startsWith('/profile') || location.startsWith('/settings')) currentIndex = 2;

    return BottomNavigationBar(
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
    );
  }
}
