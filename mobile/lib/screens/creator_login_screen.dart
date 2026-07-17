import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../services/api_service.dart';
import '../theme/app_theme.dart';

class CreatorLoginScreen extends ConsumerStatefulWidget {
  const CreatorLoginScreen({super.key});

  @override
  ConsumerState<CreatorLoginScreen> createState() => _CreatorLoginScreenState();
}

class _CreatorLoginScreenState extends ConsumerState<CreatorLoginScreen> {
  final _emailCtrl = TextEditingController();
  final _passwordCtrl = TextEditingController();
  bool _loading = false;
  String? _error;

  @override
  void dispose() {
    _emailCtrl.dispose();
    _passwordCtrl.dispose();
    super.dispose();
  }

  Future<void> _login() async {
    setState(() { _loading = true; _error = null; });
    try {
      final api = ref.read(apiServiceProvider);
      final res = await api.creatorLogin(_emailCtrl.text.trim(), _passwordCtrl.text.trim());
      final data = res.data as Map<String, dynamic>;
      final token = data['token'] as String;
      await api.saveCreatorToken(token);
      if (context.mounted) context.go('/creator');
    } catch (e) {
      setState(() => _error = 'Invalid credentials or not a creator account');
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.black,
      appBar: AppBar(title: const Text('Creator Access')),
      body: Center(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 32),
          child: Column(
            children: [
              const Icon(Icons.auto_awesome, size: 48, color: AppTheme.red),
              const SizedBox(height: 16),
              const Text('Creator Login', style: TextStyle(fontSize: 24, fontWeight: FontWeight.w700, color: AppTheme.white)),
              const SizedBox(height: 32),
              TextField(
                controller: _emailCtrl,
                decoration: const InputDecoration(labelText: 'Email', prefixIcon: Icon(Icons.email_outlined, color: AppTheme.gray)),
                keyboardType: TextInputType.emailAddress,
              ),
              const SizedBox(height: 16),
              TextField(
                controller: _passwordCtrl,
                decoration: const InputDecoration(labelText: 'Password', prefixIcon: Icon(Icons.lock_outline, color: AppTheme.gray)),
                obscureText: true,
              ),
              if (_error != null) Padding(
                padding: const EdgeInsets.only(top: 16),
                child: Text(_error!, style: const TextStyle(color: AppTheme.red, fontSize: 13)),
              ),
              const SizedBox(height: 24),
              SizedBox(width: double.infinity, height: 48, child: ElevatedButton(
                onPressed: _loading ? null : _login,
                child: _loading
                    ? const SizedBox(width: 24, height: 24, child: CircularProgressIndicator(strokeWidth: 2, color: AppTheme.white))
                    : const Text('Sign In as Creator'),
              )),
            ],
          ),
        ),
      ),
    );
  }
}
