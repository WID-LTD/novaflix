import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'providers/auth_provider.dart';
import 'routes/app_router.dart';
import 'theme/app_theme.dart';

class NovaflixApp extends ConsumerStatefulWidget {
  const NovaflixApp({super.key});

  @override
  ConsumerState<NovaflixApp> createState() => _NovaflixAppState();
}

class _NovaflixAppState extends ConsumerState<NovaflixApp> {
  @override
  void initState() {
    super.initState();
    ref.listen(authProvider, (_, next) {
      routerRefreshNotifier.update(next.status);
    });
  }

  @override
  Widget build(BuildContext context) {
    return MaterialApp.router(
      title: 'NovaFlix',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.darkTheme,
      routerConfig: appRouter(ref),
    );
  }
}
