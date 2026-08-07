import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../providers/auth_provider.dart';
import '../../theme/app_colors.dart';
import '../../theme/app_typography.dart';

class AppShell extends ConsumerWidget {
  final Widget child;

  const AppShell({super.key, required this.child});

  static const double _breakpoint = 1024;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final auth = ref.watch(authProvider);
    final user = auth.user;
    final isAuthenticated = auth.status == AuthStatus.authenticated;
    final isCreator = user?.role == 'creator' || user?.role == 'admin';

    return LayoutBuilder(
      builder: (context, constraints) {
        final wide = constraints.maxWidth >= _breakpoint;
        return wide
            ? _DesktopLayout(child: child, isAuthenticated: isAuthenticated, isCreator: isCreator, avatar: user?.avatar)
            : _MobileLayout(child: child, isAuthenticated: isAuthenticated, isCreator: isCreator, avatar: user?.avatar);
      },
    );
  }
}

class _ShellItem {
  final String label;
  final IconData icon;
  final IconData activeIcon;
  final String route;
  final bool Function(String) matches;

  const _ShellItem(this.label, this.icon, this.activeIcon, this.route, this.matches);
}

List<_ShellItem> _bottomItems(bool isAuthenticated, bool isCreator) {
  if (isCreator) {
    return [
      _ShellItem('Home', Icons.home_outlined, Icons.home, '/home', (p) => p == '/' || p.startsWith('/home')),
      _ShellItem('Dashboard', Icons.bar_chart_outlined, Icons.bar_chart, '/creator', (p) => p.startsWith('/creator') || p.startsWith('/upload')),
      _ShellItem('Search', Icons.search, Icons.search, '/search', (p) => p.startsWith('/search')),
      _ShellItem('Discover', Icons.explore_outlined, Icons.explore, '/discover', (p) => p.startsWith('/discover')),
      _ShellItem('Profile', Icons.person_outline, Icons.person, '/profile', (p) => p.startsWith('/profile')),
    ];
  }
  if (isAuthenticated) {
    return [
      _ShellItem('Home', Icons.home_outlined, Icons.home, '/home', (p) => p == '/' || p.startsWith('/home')),
      _ShellItem('Search', Icons.search, Icons.search, '/search', (p) => p.startsWith('/search')),
      _ShellItem('Discover', Icons.explore_outlined, Icons.explore, '/discover', (p) => p.startsWith('/discover')),
      _ShellItem('Categories', Icons.category_outlined, Icons.category, '/category', (p) => p.startsWith('/category')),
      _ShellItem('Profile', Icons.person_outline, Icons.person, '/profile', (p) => p.startsWith('/profile')),
    ];
  }
  return [
    _ShellItem('Home', Icons.home_outlined, Icons.home, '/home', (p) => p == '/' || p.startsWith('/home')),
    _ShellItem('Search', Icons.search, Icons.search, '/search', (p) => p.startsWith('/search')),
    _ShellItem('Discover', Icons.explore_outlined, Icons.explore, '/discover', (p) => p.startsWith('/discover')),
    _ShellItem('Categories', Icons.category_outlined, Icons.category, '/category', (p) => p.startsWith('/category')),
    _ShellItem('Sign In', Icons.login, Icons.login, '/login', (p) => p.startsWith('/login') || p.startsWith('/register')),
  ];
}

// ===================== TOP BAR (mirrors TopNav.tsx) =====================

class _TopBar extends StatelessWidget {
  final bool isAuthenticated;
  final String? avatar;

  const _TopBar({required this.isAuthenticated, required this.avatar});

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 64,
      padding: const EdgeInsets.symmetric(horizontal: 16),
      decoration: const BoxDecoration(
        color: Color(0x99131313),
        border: Border(bottom: BorderSide(color: Color(0x0DFFFFFF))),
      ),
      child: Row(
        children: [
          if (MediaQuery.of(context).size.width < 1024)
            IconButton(
              icon: const Icon(Icons.menu),
              onPressed: () => Scaffold.of(context).openDrawer(),
            ),
          GestureDetector(
            onTap: () => context.go('/home'),
            child: SizedBox(
              height: 40,
              child: Image.asset('assets/brand/leter-mark-logo.png', fit: BoxFit.contain),
            ),
          ),
          const Spacer(),
          IconButton(
            icon: const Icon(Icons.search),
            onPressed: () => context.go('/search'),
          ),
          if (isAuthenticated)
            IconButton(
              icon: const Icon(Icons.notifications_none),
              onPressed: () => context.go('/settings'),
            ),
          GestureDetector(
            onTap: () => context.go(isAuthenticated ? '/profile' : '/login'),
            child: Container(
              width: 32,
              height: 32,
              decoration: BoxDecoration(
                color: AppColors.surfaceContainerHigh,
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: AppColors.outlineVariant),
              ),
              clipBehavior: Clip.antiAlias,
              child: avatar != null
                  ? Image.network(avatar!, fit: BoxFit.cover)
                  : const Icon(Icons.person, size: 20, color: AppColors.onSurfaceVariant),
            ),
          ),
        ],
      ),
    );
  }
}

// ===================== SIDEBAR (mirrors Sidebar.tsx) =====================

class _SidebarItem {
  final String label;
  final IconData icon;
  final String route;
  final bool authenticated;
  final bool creatorOnly;
  final bool primary;

  const _SidebarItem({
    required this.label,
    required this.icon,
    required this.route,
    this.authenticated = false,
    this.creatorOnly = false,
    this.primary = false,
  });
}

const _mainNav = [
  _SidebarItem(label: 'TV Shows', icon: Icons.live_tv, route: '/tv-shows'),
  _SidebarItem(label: 'Trending', icon: Icons.trending_up, route: '/discover?sort=trending'),
  _SidebarItem(label: 'Top Rated', icon: Icons.star_outline, route: '/discover?sort=top_rated'),
  _SidebarItem(label: 'Discover', icon: Icons.explore_outlined, route: '/discover'),
  _SidebarItem(label: 'Watchlist', icon: Icons.bookmark_border, route: '/watchlist', authenticated: true),
  _SidebarItem(label: 'Downloads', icon: Icons.download_outlined, route: '/downloads', authenticated: true),
  _SidebarItem(label: 'Refer & Earn', icon: Icons.share_outlined, route: '/referrals', authenticated: true),
  _SidebarItem(label: 'Archive Vault', icon: Icons.archive_outlined, route: '/archive', authenticated: true),
  _SidebarItem(label: 'Live Events', icon: Icons.event_outlined, route: '/events'),
  _SidebarItem(label: 'Red Carpet', icon: Icons.star_outline, route: '/red-carpet'),
  _SidebarItem(label: 'Shorts', icon: Icons.video_library_outlined, route: '/hooks', authenticated: true),
];

const _engagementNav = [
  _SidebarItem(label: 'Community', icon: Icons.groups_outlined, route: '/community', authenticated: true),
  _SidebarItem(label: 'Hot Takes', icon: Icons.forum_outlined, route: '/forum', authenticated: true),
  _SidebarItem(label: 'Trivia & Rewards', icon: Icons.quiz_outlined, route: '/trivia', authenticated: true),
];

const _businessNav = [
  _SidebarItem(label: 'Plans', icon: Icons.workspace_premium, route: '/pricing', primary: true),
  _SidebarItem(label: 'Creator Hub', icon: Icons.bar_chart, route: '/creator', authenticated: true, creatorOnly: true, primary: true),
  _SidebarItem(label: 'Upload Film', icon: Icons.cloud_upload_outlined, route: '/upload', authenticated: true, creatorOnly: true, primary: true),
  _SidebarItem(label: 'Promotions', icon: Icons.campaign_outlined, route: '/creator/campaigns', authenticated: true, creatorOnly: true, primary: true),
  _SidebarItem(label: 'Memberships', icon: Icons.card_membership, route: '/creator/memberships', authenticated: true, creatorOnly: true, primary: true),
  _SidebarItem(label: 'Live Events', icon: Icons.live_tv, route: '/creator/events', authenticated: true, creatorOnly: true, primary: true),
  _SidebarItem(label: 'Products', icon: Icons.inventory_2_outlined, route: '/creator/products', authenticated: true, creatorOnly: true, primary: true),
  _SidebarItem(label: 'Courses', icon: Icons.school_outlined, route: '/creator/courses', authenticated: true, creatorOnly: true, primary: true),
  _SidebarItem(label: 'Merch Store', icon: Icons.shopping_bag_outlined, route: '/store', primary: true),
  _SidebarItem(label: 'E-Learning', icon: Icons.school_outlined, route: '/learn', primary: true),
  _SidebarItem(label: 'Watch Party', icon: Icons.groups_outlined, route: '/watch-party', authenticated: true, primary: true),
];

class _DesktopSidebar extends StatelessWidget {
  final bool isAuthenticated;
  final bool isCreator;

  const _DesktopSidebar({required this.isAuthenticated, required this.isCreator});

  List<_SidebarItem> _visible(List<_SidebarItem> items) =>
      items.where((i) => (!i.authenticated || isAuthenticated) && (!i.creatorOnly || isCreator)).toList();

  @override
  Widget build(BuildContext context) {
    final visibleNav = _visible(_mainNav);
    final visibleEngagement = _visible(_engagementNav);
    final visibleBusiness = _visible(_businessNav);
    final location = GoRouterState.of(context).matchedLocation ?? '';

    bool isActive(String route) {
      if (route.contains('?')) {
        return location.startsWith(route.split('?').first);
      }
      return location == route || location.startsWith('$route/');
    }

    Widget itemTile(_SidebarItem item) {
      final active = isActive(item.route);
      return InkWell(
        onTap: () => context.go(item.route.split('?').first),
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
          child: Row(
            children: [
              Icon(item.icon, size: 20,
                color: active ? AppColors.primary : (item.primary ? AppColors.primaryLight : AppColors.onSurfaceVariant.withValues(alpha: 0.6))),
              const SizedBox(width: 12),
              Text(item.label, style: AppTypography.labelMd.copyWith(
                color: active ? AppColors.primary : AppColors.onSurfaceVariant.withValues(alpha: 0.6),
                fontWeight: item.primary ? FontWeight.w600 : FontWeight.w500,
              )),
            ],
          ),
        ),
      );
    }

    Widget divider = const Divider(height: 24, thickness: 0.5, color: Color(0x0DFFFFFF));

    return Container(
      width: 240,
      color: const Color(0xFF0E0E0E),
      padding: const EdgeInsets.only(top: 8, bottom: 8),
      child: SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            ...visibleNav.map(itemTile),
            if (visibleEngagement.isNotEmpty) ...[
              divider,
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 12),
                child: Text('COMMUNITY & ENGAGEMENT',
                  style: TextStyle(fontSize: 10, fontWeight: FontWeight.w600, letterSpacing: 1.2, color: AppColors.onSurfaceVariant.withValues(alpha: 0.5))),
              ),
              const SizedBox(height: 4),
              ...visibleEngagement.map(itemTile),
            ],
            if (!isAuthenticated)
              InkWell(
                onTap: () => context.go('/login'),
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                  child: Row(children: [
                    const Icon(Icons.login, size: 20, color: AppColors.onSurfaceVariant),
                    const SizedBox(width: 12),
                    Text('Sign In', style: AppTypography.labelMd.copyWith(color: AppColors.onSurfaceVariant)),
                  ]),
                ),
              ),
            if (visibleBusiness.isNotEmpty) ...[
              divider,
              ...visibleBusiness.map(itemTile),
            ],
          ],
        ),
      ),
    );
  }
}

// ===================== LAYOUTS =====================

class _MobileLayout extends StatelessWidget {
  final Widget child;
  final bool isAuthenticated;
  final bool isCreator;
  final String? avatar;

  const _MobileLayout({
    required this.child,
    required this.isAuthenticated,
    required this.isCreator,
    this.avatar,
  });

  @override
  Widget build(BuildContext context) {
    final items = _bottomItems(isAuthenticated, isCreator);
    final location = GoRouterState.of(context).matchedLocation ?? '';
    var activeIndex = items.indexWhere((i) => i.matches(location));
    if (activeIndex < 0) activeIndex = 0;

    return Scaffold(
      backgroundColor: AppColors.background,
      drawer: _MobileDrawer(isAuthenticated: isAuthenticated, isCreator: isCreator),
      body: Column(
        children: [
          _TopBar(isAuthenticated: isAuthenticated, avatar: avatar),
          Expanded(child: child),
        ],
      ),
      bottomNavigationBar: Container(
        decoration: const BoxDecoration(
          color: Color(0xE60E0E0E),
          border: Border(top: BorderSide(color: Color(0x0DFFFFFF))),
        ),
        padding: EdgeInsets.only(bottom: MediaQuery.of(context).padding.bottom),
        child: Row(
          children: [
            for (var i = 0; i < items.length; i++)
              Expanded(
                child: InkWell(
                  onTap: () => context.go(items[i].route),
                  child: AnimatedScale(
                    scale: activeIndex == i ? 1.1 : 1.0,
                    duration: const Duration(milliseconds: 150),
                    child: Padding(
                      padding: const EdgeInsets.symmetric(vertical: 8),
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(activeIndex == i ? items[i].activeIcon : items[i].icon,
                            size: 22,
                            color: activeIndex == i ? AppColors.primary : AppColors.onSurfaceVariant.withValues(alpha: 0.6)),
                          const SizedBox(height: 3),
                          Text(items[i].label,
                            style: TextStyle(fontSize: 10, height: 1.1,
                              color: activeIndex == i ? AppColors.primary : AppColors.onSurfaceVariant.withValues(alpha: 0.6))),
                        ],
                      ),
                    ),
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }
}

class _MobileDrawer extends StatelessWidget {
  final bool isAuthenticated;
  final bool isCreator;

  const _MobileDrawer({required this.isAuthenticated, required this.isCreator});

  @override
  Widget build(BuildContext context) {
    return Drawer(
      backgroundColor: const Color(0xFF0E0E0E),
      child: SafeArea(
        child: ListView(
          padding: EdgeInsets.zero,
          children: [
            Padding(
              padding: const EdgeInsets.all(16),
              child: SizedBox(height: 40, child: Image.asset('assets/brand/leter-mark-logo.png', fit: BoxFit.contain)),
            ),
            ListTile(
              leading: const Icon(Icons.person_outline, color: AppColors.onSurfaceVariant),
              title: const Text('Sign In'),
              onTap: () { Navigator.pop(context); context.go('/login'); },
            ),
            ListTile(
              leading: const Icon(Icons.workspace_premium, color: AppColors.primary),
              title: const Text('Plans'),
              onTap: () { Navigator.pop(context); context.go('/pricing'); },
            ),
            ListTile(
              leading: const Icon(Icons.settings_outlined, color: AppColors.onSurfaceVariant),
              title: const Text('Settings'),
              onTap: () { Navigator.pop(context); context.go('/settings'); },
            ),
            ListTile(
              leading: const Icon(Icons.bar_chart, color: AppColors.primary),
              title: const Text('Creator Hub'),
              onTap: () { Navigator.pop(context); context.go('/creator'); },
            ),
          ],
        ),
      ),
    );
  }
}

class _DesktopLayout extends StatelessWidget {
  final Widget child;
  final bool isAuthenticated;
  final bool isCreator;
  final String? avatar;

  const _DesktopLayout({
    required this.child,
    required this.isAuthenticated,
    required this.isCreator,
    this.avatar,
  });

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      body: Row(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          _DesktopSidebar(isAuthenticated: isAuthenticated, isCreator: isCreator),
          Container(width: 1, color: const Color(0x0DFFFFFF)),
          Expanded(
            child: Column(
              children: [
                _TopBar(isAuthenticated: isAuthenticated, avatar: avatar),
                Expanded(child: child),
              ],
            ),
          ),
        ],
      ),
    );
  }
}