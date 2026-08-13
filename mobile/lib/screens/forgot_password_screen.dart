import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../services/api_service.dart';
import '../theme/app_colors.dart';
import '../theme/app_typography.dart';
import '../widgets/ui/index.dart';

class ForgotPasswordScreen extends StatefulWidget {
  const ForgotPasswordScreen({super.key});

  @override
  State<ForgotPasswordScreen> createState() => _ForgotPasswordScreenState();
}

class _ForgotPasswordScreenState extends State<ForgotPasswordScreen> {
  final _emailCtl = TextEditingController();
  bool _loading = false;
  String? _error;
  bool _sent = false;

  @override
  void dispose() {
    _emailCtl.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    final email = _emailCtl.text.trim();
    if (email.isEmpty) return;
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final res = await ApiService().forgotPassword(email);
      if ((res.statusCode ?? 0) >= 200 && (res.statusCode ?? 0) < 300) {
        setState(() => _sent = true);
      } else {
        setState(() => _error = _messageFrom(res.data));
      }
    } catch (e) {
      setState(() => _error = 'Could not connect. Check your connection and try again.');
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  String _messageFrom(dynamic data) {
    if (data is Map && data['error'] is String) return data['error'] as String;
    return 'Something went wrong. Please try again.';
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('Reset Password'),
        backgroundColor: AppColors.background,
      ),
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(24),
            child: _sent ? _buildSuccess() : _buildForm(),
          ),
        ),
      ),
    );
  }

  Widget _buildForm() {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        const Icon(Icons.lock_reset, size: 56, color: AppColors.primary),
        const SizedBox(height: 16),
        Text('Forgot your password?', style: AppTypography.headlineMd),
        const SizedBox(height: 8),
        Text(
          'Enter your account email and we\'ll send you a link to reset your password.',
          style: AppTypography.bodyMd.copyWith(color: AppColors.onSurfaceVariant),
          textAlign: TextAlign.center,
        ),
        const SizedBox(height: 32),
        AppInput(
          controller: _emailCtl,
          label: 'Email',
          hint: 'Enter your email',
          keyboardType: TextInputType.emailAddress,
        ),
        const SizedBox(height: 24),
        AppButton(
          label: 'Send Reset Link',
          onPressed: _submit,
          loading: _loading,
        ),
        if (_error != null) ...[
          const SizedBox(height: 12),
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: AppColors.errorContainer.withValues(alpha: 0.2),
              borderRadius: BorderRadius.circular(8),
              border: Border.all(color: AppColors.error.withValues(alpha: 0.2)),
            ),
            child: Row(
              children: [
                const Icon(Icons.error_outline, color: AppColors.error, size: 18),
                const SizedBox(width: 8),
                Expanded(child: Text(_error!, style: const TextStyle(color: AppColors.error, fontSize: 13))),
              ],
            ),
          ),
        ],
        const SizedBox(height: 16),
        TextButton(
          onPressed: () => context.pop(),
          child: const Text('Back to Sign In', style: TextStyle(color: AppColors.primaryLight)),
        ),
      ],
    );
  }

  Widget _buildSuccess() {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        const Icon(Icons.mark_email_read, size: 56, color: AppColors.primary),
        const SizedBox(height: 16),
        Text('Check your inbox', style: AppTypography.headlineMd),
        const SizedBox(height: 8),
        Text(
          'If an account exists for $_emailCtl, a reset link has been sent. Follow the link in the email to choose a new password.',
          style: AppTypography.bodyMd.copyWith(color: AppColors.onSurfaceVariant),
          textAlign: TextAlign.center,
        ),
        const SizedBox(height: 24),
        AppButton(label: 'Back to Sign In', onPressed: () => context.pop()),
      ],
    );
  }
}
