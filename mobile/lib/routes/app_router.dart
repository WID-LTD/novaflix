import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../providers/auth_provider.dart';
import '../screens/splash_screen.dart';
import '../screens/landing_screen.dart';
import '../screens/login_screen.dart';
import '../screens/register_screen.dart';
import '../screens/verify_email_screen.dart';
import '../screens/profile_gateway_screen.dart';
import '../screens/creator_login_screen.dart';
import '../screens/not_found_screen.dart';

import '../screens/home_screen.dart';
import '../screens/search_screen.dart';
import '../screens/search_results_screen.dart';
import '../screens/tv_shows_screen.dart';
import '../screens/discover_screen.dart';
import '../screens/category_screen.dart';
import '../screens/movie_detail_screen.dart';
import '../screens/watch_screen.dart';
import '../screens/watchlist_screen.dart';
import '../screens/profile_screen.dart';
import '../screens/settings_screen.dart';
import '../screens/pricing_screen.dart';
import '../screens/watch_party_screen.dart';
import '../screens/upload_screen.dart';
import '../screens/store_screen.dart';
import '../screens/hooks_feed_screen.dart';
import '../screens/learn_screen.dart';
import '../screens/creators_screen.dart';
import '../screens/creator_dashboard_screen.dart';
import '../screens/creator_analytics_screen.dart';
import '../screens/creator_catalog_screen.dart';
import '../screens/creator_products_screen.dart';
import '../screens/creator_courses_screen.dart';
import '../screens/creator_events_manager_screen.dart';
import '../screens/creator_membership_manager_screen.dart';
import '../screens/creator_plan_picker_screen.dart';
import '../screens/creator_campaigns_screen.dart';
import '../screens/creator_profile_hub_screen.dart';
import '../screens/admin_dashboard_screen.dart';
import '../screens/admin_asset_qc_screen.dart';
import '../screens/admin_filters_screen.dart';
import '../screens/admin_localization_screen.dart';
import '../screens/admin_campaigns_screen.dart';
import '../screens/community_screen.dart';
import '../screens/live_events_screen.dart';
import '../screens/event_detail_screen.dart';
import '../screens/downloads_screen.dart';
import '../screens/archive_screen.dart';
import '../screens/archive_detail_screen.dart';
import '../screens/red_carpet_screen.dart';
import '../screens/referrals_screen.dart';
import '../screens/payment_success_screen.dart';
import '../widgets/layout/index.dart';

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
          state.matchedLocation == '/splash' ||
          state.matchedLocation == '/landing';

      if (isAuth && isAuthRoute && state.matchedLocation != '/landing' && state.matchedLocation != '/splash') return '/home';
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
      GoRoute(path: '/watch', builder: (ctx, state) => WatchScreen(
        movieId: int.tryParse(state.uri.queryParameters['id'] ?? ''),
        mediaType: state.uri.queryParameters['type'],
        streamUrl: state.uri.queryParameters['url'],
      )),

      ShellRoute(
        navigatorKey: _shellNavigatorKey,
        builder: (context, state, child) => AppShell(child: child),
        routes: [
          GoRoute(path: '/', pageBuilder: (_, s) => NoTransitionPage(child: HomeScreen(key: s.pageKey))),
          GoRoute(path: '/home', pageBuilder: (_, s) => NoTransitionPage(child: HomeScreen(key: s.pageKey))),
          GoRoute(path: '/search', pageBuilder: (_, s) => NoTransitionPage(child: const SearchScreen())),
          GoRoute(path: '/search-results', pageBuilder: (_, s) => NoTransitionPage(child: SearchResultsScreen(query: s.uri.queryParameters['q']))),
          GoRoute(path: '/tv-shows', pageBuilder: (_, s) => NoTransitionPage(child: const TVShowsScreen())),
          GoRoute(path: '/discover', pageBuilder: (_, s) => NoTransitionPage(child: const DiscoverScreen())),
          GoRoute(path: '/category', pageBuilder: (_, s) => NoTransitionPage(child: const CategoryScreen())),
          GoRoute(path: '/category/:slug', pageBuilder: (_, s) => NoTransitionPage(child: CategoryScreen(slug: s.pathParameters['slug']))),
          GoRoute(path: '/movie/:id', pageBuilder: (_, s) => NoTransitionPage(child: MovieDetailScreen(movieId: int.parse(s.pathParameters['id']!)))),
          GoRoute(path: '/tv/:id', pageBuilder: (_, s) => NoTransitionPage(child: MovieDetailScreen(movieId: int.parse(s.pathParameters['id']!)))),
          GoRoute(path: '/watchlist', pageBuilder: (_, s) => NoTransitionPage(child: const WatchlistScreen())),
          GoRoute(path: '/profile', pageBuilder: (_, s) => NoTransitionPage(child: const ProfileScreen())),
          GoRoute(path: '/settings', pageBuilder: (_, s) => NoTransitionPage(child: const SettingsScreen())),
          GoRoute(path: '/pricing', pageBuilder: (_, s) => NoTransitionPage(child: const PricingScreen())),
          GoRoute(path: '/upload', pageBuilder: (_, s) => NoTransitionPage(child: const UploadScreen())),
          GoRoute(path: '/store', pageBuilder: (_, s) => NoTransitionPage(child: const StoreScreen())),
          GoRoute(path: '/learn', pageBuilder: (_, s) => NoTransitionPage(child: const LearnScreen())),
          GoRoute(path: '/hooks', pageBuilder: (_, s) => NoTransitionPage(child: const HooksFeedScreen())),
          GoRoute(path: '/watch-party', pageBuilder: (_, s) => NoTransitionPage(child: const WatchPartyScreen())),
          GoRoute(path: '/creators', pageBuilder: (_, s) => NoTransitionPage(child: const CreatorsScreen())),
          GoRoute(path: '/community', pageBuilder: (_, s) => NoTransitionPage(child: const CommunityScreen())),
          GoRoute(path: '/events', pageBuilder: (_, s) => NoTransitionPage(child: const LiveEventsScreen())),
          GoRoute(path: '/event/:id', pageBuilder: (_, s) => NoTransitionPage(child: EventDetailScreen(eventId: s.pathParameters['id']))),
          GoRoute(path: '/downloads', pageBuilder: (_, s) => NoTransitionPage(child: const DownloadsScreen())),
          GoRoute(path: '/archive', pageBuilder: (_, s) => NoTransitionPage(child: const ArchiveScreen())),
          GoRoute(path: '/archive/:genre', pageBuilder: (_, s) => NoTransitionPage(child: ArchiveDetailScreen(genre: s.pathParameters['genre']))),
          GoRoute(path: '/red-carpet', pageBuilder: (_, s) => NoTransitionPage(child: const RedCarpetScreen())),
          GoRoute(path: '/referrals', pageBuilder: (_, s) => NoTransitionPage(child: const ReferralsScreen())),
          GoRoute(path: '/payment-success', pageBuilder: (_, s) => NoTransitionPage(child: const PaymentSuccessScreen())),

          GoRoute(path: '/creator', pageBuilder: (_, s) => NoTransitionPage(child: const CreatorDashboardScreen())),
          GoRoute(path: '/creator/analytics', pageBuilder: (_, s) => NoTransitionPage(child: const CreatorAnalyticsScreen())),
          GoRoute(path: '/creator/catalog', pageBuilder: (_, s) => NoTransitionPage(child: const CreatorCatalogScreen())),
          GoRoute(path: '/creator/products', pageBuilder: (_, s) => NoTransitionPage(child: const CreatorProductsScreen())),
          GoRoute(path: '/creator/courses', pageBuilder: (_, s) => NoTransitionPage(child: const CreatorCoursesScreen())),
          GoRoute(path: '/creator/events', pageBuilder: (_, s) => NoTransitionPage(child: const CreatorEventsManagerScreen())),
          GoRoute(path: '/creator/memberships', pageBuilder: (_, s) => NoTransitionPage(child: const CreatorMembershipManagerScreen())),
          GoRoute(path: '/creator/plan-picker', pageBuilder: (_, s) => NoTransitionPage(child: const CreatorPlanPickerScreen())),
          GoRoute(path: '/creator/campaigns', pageBuilder: (_, s) => NoTransitionPage(child: const CreatorCampaignsScreen())),
          GoRoute(path: '/creator/profile', pageBuilder: (_, s) => NoTransitionPage(child: const CreatorProfileHubScreen())),

          GoRoute(path: '/admin', pageBuilder: (_, s) => NoTransitionPage(child: const AdminDashboardScreen())),
          GoRoute(path: '/admin/asset-qc', pageBuilder: (_, s) => NoTransitionPage(child: const AdminAssetQCScreen())),
          GoRoute(path: '/admin/filters', pageBuilder: (_, s) => NoTransitionPage(child: const AdminFiltersScreen())),
          GoRoute(path: '/admin/localization', pageBuilder: (_, s) => NoTransitionPage(child: const AdminLocalizationScreen())),
          GoRoute(path: '/admin/campaigns', pageBuilder: (_, s) => NoTransitionPage(child: const AdminCampaignsScreen())),
        ],
      ),
      GoRoute(path: '/:path(.*)', builder: (_, __) => const NotFoundScreen()),
    ],
  );
}
