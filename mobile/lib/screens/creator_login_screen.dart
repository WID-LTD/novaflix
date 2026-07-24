import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../theme/app_colors.dart';
import '../theme/app_typography.dart';
import '../services/api_service.dart';
import '../widgets/ui/index.dart';

class CreatorLoginScreen extends ConsumerStatefulWidget {
  const CreatorLoginScreen({super.key});

  @override
  ConsumerState<CreatorLoginScreen> createState() => _CreatorLoginScreenState();
}

class _CreatorLoginScreenState extends ConsumerState<CreatorLoginScreen> {
  final _emailCtl = TextEditingController();
  final _passwordCtl = TextEditingController();
  bool _loading = false;
  String? _error;

  @override
  void dispose() {
    _emailCtl.dispose();
    _passwordCtl.dispose();
    super.dispose();
  }

  void _login() async {
    setState(() { _loading = true; _error = null; });
    try {
      final api = ref.read(apiServiceProvider);
      final res = await api.creatorLogin(_emailCtl.text.trim(), _passwordCtl.text);
      final data = res.data as Map<String, dynamic>;
      final token = data['token'] as String;
      await api.saveCreatorToken(token);
      if (mounted) context.go('/creator');
    } catch (e) {
      setState(() => _error = e.toString());
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(24),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(Icons.person, size: 60, color: AppColors.primary),
                const SizedBox(height: 16),
                Text('Creator Login', style: AppTypography.headlineMd),
                const SizedBox(height: 32),
                AppInput(controller: _emailCtl, label: 'Email', hint: 'creator@email.com', keyboardType: TextInputType.emailAddress),
                const SizedBox(height: 16),
                AppInput(controller: _passwordCtl, label: 'Password', hint: 'Enter password', obscureText: true),
                const SizedBox(height: 24),
                AppButton(label: 'Sign In', onPressed: _login, loading: _loading),
                if (_error != null) ...[
                  const SizedBox(height: 12),
                  Text(_error!, style: const TextStyle(color: AppColors.error, fontSize: 13)),
                ],
              ],
            ),
          ),
        ),
      ),
    );
  }
}
