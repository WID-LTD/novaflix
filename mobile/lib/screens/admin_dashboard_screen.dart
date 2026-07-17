import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../theme/app_theme.dart';

class AdminDashboardScreen extends ConsumerStatefulWidget {
  const AdminDashboardScreen({super.key});

  @override
  ConsumerState<AdminDashboardScreen> createState() => _AdminDashboardScreenState();
}

class _AdminDashboardScreenState extends ConsumerState<AdminDashboardScreen> with SingleTickerProviderStateMixin {
  late TabController _tabCtrl;

  @override
  void initState() {
    super.initState();
    _tabCtrl = TabController(length: 4, vsync: this);
  }

  @override
  void dispose() {
    _tabCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.black,
      appBar: AppBar(
        title: const Text('Admin'),
        bottom: TabBar(
          controller: _tabCtrl,
          indicatorColor: AppTheme.red,
          labelColor: AppTheme.white,
          unselectedLabelColor: AppTheme.gray,
          tabs: const [
            Tab(text: 'Stats'),
            Tab(text: 'Users'),
            Tab(text: 'Creators'),
            Tab(text: 'Uploads'),
          ],
        ),
      ),
      body: TabBarView(
        controller: _tabCtrl,
        children: [
          _StatsTab(),
          _UsersTab(),
          _CreatorsTab(),
          _UploadsTab(),
        ],
      ),
    );
  }
}

class _StatsTab extends ConsumerWidget {
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Center(child: Text('Admin stats coming soon', style: TextStyle(color: AppTheme.gray.withValues(alpha: 0.7))));
  }
}

class _UsersTab extends ConsumerWidget {
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Center(child: Text('User management coming soon', style: TextStyle(color: AppTheme.gray.withValues(alpha: 0.7))));
  }
}

class _CreatorsTab extends ConsumerWidget {
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Center(child: Text('Creator management coming soon', style: TextStyle(color: AppTheme.gray.withValues(alpha: 0.7))));
  }
}

class _UploadsTab extends ConsumerWidget {
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Center(child: Text('Upload management coming soon', style: TextStyle(color: AppTheme.gray.withValues(alpha: 0.7))));
  }
}
