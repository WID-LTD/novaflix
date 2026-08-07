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
  final _codeCtl = TextEditingController();
  bool _loading = false;
  String? _error;
  bool _needsVerify = false;
  int? _pendingUserId;
  String? _verifyReason;

  @override
  void dispose() {
    _emailCtl.dispose();
    _passwordCtl.dispose();
    _codeCtl.dispose();
    super.dispose();
  }

  Future<void> _login() async {
    setState(() { _loading = true; _error = null; });
    try {
      final api = ref.read(apiServiceProvider);
      final res = await api.creatorLogin(_emailCtl.text.trim(), _passwordCtl.text);
      final data = res.data as Map<String, dynamic>;
      if (data['needsLoginVerification'] == true) {
        setState(() {
          _needsVerify = true;
          _pendingUserId = data['userId'] as int?;
          _verifyReason = data['reason'] as String?;
        });
        return;
      }
      final token = data['token'] as String;
      await api.saveCreatorToken(token);
      if (mounted) context.go('/creator');
    } catch (e) {
      setState(() => _error = e.toString());
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _verify() async {
    setState(() { _loading = true; _error = null; });
    try {
      final api = ref.read(apiServiceProvider);
      final res = await api.creatorLoginVerify(_pendingUserId!, _codeCtl.text);
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
        child: Stack(
          children: [
            Center(
              child: SingleChildScrollView(
                padding: const EdgeInsets.all(24),
                child: _needsVerify ? _buildVerify() : _buildLogin(),
              ),
            ),
            Positioned(
              top: 8,
              left: 12,
              child: AppBackButton(
                onPressed: () {
                  if (context.canPop()) {
                    context.pop();
                  } else {
                    context.go('/home');
                  }
                },
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildLogin() {
    return Column(
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
    );
  }

  Widget _buildVerify() {
    final reason = _verifyReason ?? 'new-device';
    String message;
    switch (reason) {
      case 'new-device':
        message = 'We noticed a sign-in from a new device or network.';
        break;
      case 'inactive':
        message = "You haven't signed in for a while, so we want to confirm it's you.";
        break;
      case 'unknown-location':
        message = 'We noticed a sign-in from an unfamiliar location.';
        break;
      default:
        message = 'Enter the verification code sent to your email.';
    }

    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        const Icon(Icons.verified_user, size: 64, color: AppColors.primary),
        const SizedBox(height: 16),
        Text('Confirm it\'s you', style: AppTypography.headlineMd),
        const SizedBox(height: 8),
        Text('$message A code was sent to ${_emailCtl.text.trim()}.',
          style: AppTypography.bodyMd.copyWith(color: AppColors.onSurfaceVariant),
          textAlign: TextAlign.center,
        ),
        const SizedBox(height: 32),
        AppInput(controller: _codeCtl, hint: 'Enter 6-digit code', keyboardType: TextInputType.number),
        const SizedBox(height: 24),
        AppButton(label: 'Verify & Sign In', onPressed: _verify, loading: _loading),
        if (_error != null) ...[
          const SizedBox(height: 12),
          Text(_error!, style: const TextStyle(color: AppColors.error, fontSize: 13)),
        ],
      ],
    );
  }
}
