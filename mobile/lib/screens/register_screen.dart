import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../theme/app_colors.dart';
import '../theme/app_typography.dart';
import '../providers/auth_provider.dart';
import '../widgets/features/index.dart';
import '../widgets/ui/index.dart';

class RegisterScreen extends ConsumerStatefulWidget {
  const RegisterScreen({super.key});

  @override
  ConsumerState<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends ConsumerState<RegisterScreen> {
  int _step = 1;
  final _emailCtl = TextEditingController();
  final _passwordCtl = TextEditingController();
  final _nameCtl = TextEditingController();
  final _ageCtl = TextEditingController();
  final List<String> _selectedGenres = [];
  final _codeCtl = TextEditingController();

  final _genres = [
    ('Action', Icons.local_fire_department),
    ('Comedy', Icons.theater_comedy),
    ('Sci-Fi', Icons.rocket_launch),
    ('Drama', Icons.sentiment_dissatisfied),
    ('Horror', Icons.dark_mode),
    ('Documentary', Icons.document_scanner),
  ];

  @override
  void dispose() {
    _emailCtl.dispose();
    _passwordCtl.dispose();
    _nameCtl.dispose();
    _ageCtl.dispose();
    _codeCtl.dispose();
    super.dispose();
  }

  void _next() {
    if (_step < 3) {
      setState(() => _step++);
    } else {
      ref.read(authProvider.notifier).register(
        _emailCtl.text.trim(),
        _passwordCtl.text,
        _nameCtl.text.trim(),
      );
    }
  }

  void _prev() {
    if (_step > 1) setState(() => _step--);
  }

  void _toggleGenre(String name) {
    setState(() {
      if (_selectedGenres.contains(name)) {
        _selectedGenres.remove(name);
      } else if (_selectedGenres.length < 3) {
        _selectedGenres.add(name);
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final authState = ref.watch(authProvider);

    if (authState.status == AuthStatus.authenticated) {
      WidgetsBinding.instance.addPostFrameCallback((_) => context.go('/profiles'));
    }

    final maxWidth = MediaQuery.sizeOf(context).width;
    final logoWidth = (maxWidth * 0.9).clamp(200.0, 800.0);

    return Scaffold(
      backgroundColor: AppColors.background,
      body: Stack(
        children: [
          const Positioned.fill(child: ObliqueColumnsBackdrop()),
          SafeArea(
            child: Center(
              child: SingleChildScrollView(
                padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 40),
                child: authState.status == AuthStatus.needsVerification
                    ? _buildVerifyCard(authState)
                    : ConstrainedBox(
                        constraints: const BoxConstraints(maxWidth: 560),
                        child: Column(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Image.asset(
                              'assets/brand/leter-mark-logo.png',
                              width: logoWidth,
                              height: logoWidth / 2,
                              fit: BoxFit.contain,
                              errorBuilder: (_, __, ___) => const SizedBox(height: 110),
                            ),
                            Transform.translate(
                              offset: const Offset(0, -108),
                              child: Column(
                                children: [
                                  Text(
                                    'Join the Cinematic Experience',
                                    style: AppTypography.bodyMd.copyWith(
                                      color: AppColors.onSurfaceVariant,
                                    ),
                                  ),
                                  const SizedBox(height: 8),
                                  _progressBar(),
                                ],
                              ),
                            ),
                            Transform.translate(
                              offset: const Offset(0, -100),
                              child: _formCard(authState),
                            ),
                          ],
                        ),
                      ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _progressBar() {
    return Container(
      width: 360,
      height: 4,
      decoration: BoxDecoration(
        color: AppColors.surfaceVariant.withValues(alpha: 0.5),
        borderRadius: BorderRadius.circular(8),
      ),
      child: AnimatedFractionallySizedBox(
        duration: const Duration(milliseconds: 400),
        widthFactor: _step / 3,
        alignment: Alignment.centerLeft,
        child: Container(
          decoration: BoxDecoration(
            color: AppColors.primaryContainer,
            borderRadius: BorderRadius.circular(8),
          ),
        ),
      ),
    );
  }

  Widget _formCard(AuthState state) {
    return BackdropFilter(
      filter: ImageFilter.blur(sigmaX: 20, sigmaY: 20),
      child: Container(
        width: double.infinity,
        padding: const EdgeInsets.all(24),
        decoration: BoxDecoration(
          color: const Color(0x99131313),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: Colors.white.withValues(alpha: 0.05)),
          boxShadow: [
            BoxShadow(color: Colors.black.withValues(alpha: 0.5), blurRadius: 24),
          ],
        ),
        child: AnimatedSwitcher(
          duration: const Duration(milliseconds: 300),
          child: _step == 1
              ? _step1(state)
              : _step == 2
                  ? _step2(state)
                  : _step3(state),
        ),
      ),
    );
  }

  Widget _step1(AuthState state) {
    final canContinue = _emailCtl.text.trim().isNotEmpty && _passwordCtl.text.isNotEmpty;
    return Column(
      key: const ValueKey(1),
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('Create Account', style: AppTypography.headlineMd),
        const SizedBox(height: 4),
        Text('Step 1 of 3 — Credentials', style: AppTypography.bodyMd.copyWith(color: AppColors.onSurfaceVariant)),
        const SizedBox(height: 20),
        if (state.error != null) _errorBanner(state.error!),
        const SizedBox(height: 20),
        AppInput(controller: _emailCtl, label: 'Email', hint: 'Enter your email', keyboardType: TextInputType.emailAddress),
        const SizedBox(height: 16),
        AppInput(controller: _passwordCtl, label: 'Password', hint: 'Create a password', obscureText: true),
        const SizedBox(height: 24),
        Align(
          alignment: Alignment.centerRight,
          child: AppButton(
            label: 'Continue',
            onPressed: canContinue ? _next : null,
            fullWidth: false,
            height: 44,
          ),
        ),
      ],
    );
  }

  Widget _step2(AuthState state) {
    return Column(
      key: const ValueKey(2),
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('About You', style: AppTypography.headlineMd),
        const SizedBox(height: 4),
        Text('Step 2 of 3 — Details', style: AppTypography.bodyMd.copyWith(color: AppColors.onSurfaceVariant)),
        const SizedBox(height: 20),
        if (state.error != null) _errorBanner(state.error!),
        const SizedBox(height: 20),
        AppInput(controller: _nameCtl, label: 'Display Name', hint: 'How should we call you?'),
        const SizedBox(height: 16),
        AppInput(
          controller: _ageCtl,
          label: 'Age',
          hint: 'Enter your age',
          keyboardType: TextInputType.number,
        ),
        const SizedBox(height: 24),
        Row(
          children: [
            Expanded(
              child: AppButton(
                label: 'Back',
                onPressed: _prev,
                outlined: true,
                fullWidth: true,
                height: 44,
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: AppButton(
                label: 'Continue',
                onPressed: _next,
                fullWidth: true,
                height: 44,
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _step3(AuthState state) {
    final complete = _selectedGenres.length == 3;
    return Column(
      key: const ValueKey(3),
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('Taste Profile', style: AppTypography.headlineMd),
        const SizedBox(height: 4),
        Text('Select 3 genres to personalize your experience.',
          style: AppTypography.labelMd.copyWith(color: AppColors.onSurfaceVariant)),
        const SizedBox(height: 20),
        if (state.error != null) _errorBanner(state.error!),
        const SizedBox(height: 16),
        GridView.count(
          crossAxisCount: 2,
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          mainAxisSpacing: 12,
          crossAxisSpacing: 12,
          childAspectRatio: 2.4,
          children: _genres.map((g) {
            final selected = _selectedGenres.contains(g.$1);
            return GestureDetector(
              onTap: () => _toggleGenre(g.$1),
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 150),
                decoration: BoxDecoration(
                  color: selected
                      ? AppColors.primaryContainer.withValues(alpha: 0.2)
                      : AppColors.surfaceContainer,
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(
                    color: selected ? AppColors.primaryContainer : Colors.transparent,
                  ),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(g.$2, color: selected ? AppColors.primary : AppColors.onSurfaceVariant, size: 18),
                    const SizedBox(width: 8),
                    Text(
                      g.$1,
                      style: AppTypography.labelMd.copyWith(
                        color: selected ? AppColors.primary : AppColors.onSurface,
                      ),
                    ),
                  ],
                ),
              ),
            );
          }).toList(),
        ),
        const SizedBox(height: 24),
        Row(
          children: [
            Expanded(
              child: AppButton(
                label: 'Back',
                onPressed: _prev,
                outlined: true,
                fullWidth: true,
                height: 44,
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: AppButton(
                label: 'Complete Setup',
                onPressed: complete ? _next : null,
                loading: state.status == AuthStatus.loading,
                fullWidth: true,
                height: 44,
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildVerifyCard(AuthState state) {
    return BackdropFilter(
      filter: ImageFilter.blur(sigmaX: 20, sigmaY: 20),
      child: Container(
        width: double.infinity,
        constraints: const BoxConstraints(maxWidth: 440),
        padding: const EdgeInsets.all(28),
        decoration: BoxDecoration(
          color: const Color(0x99131313),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: Colors.white.withValues(alpha: 0.05)),
          boxShadow: [
            BoxShadow(color: Colors.black.withValues(alpha: 0.5), blurRadius: 24),
          ],
        ),
        child: Column(
          children: [
            const Icon(Icons.mark_email_unread, size: 56, color: AppColors.primary),
            const SizedBox(height: 16),
            Text('Verify your email', style: AppTypography.headlineMd),
            const SizedBox(height: 8),
            Text(
              '6-digit code sent to ${state.pendingEmail ?? ''}',
              style: AppTypography.bodyMd.copyWith(color: AppColors.onSurfaceVariant),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 24),
            TextField(
              controller: _codeCtl,
              keyboardType: TextInputType.number,
              maxLength: 6,
              textAlign: TextAlign.center,
              style: const TextStyle(
                color: AppColors.onSurface,
                fontSize: 24,
                fontWeight: FontWeight.bold,
                letterSpacing: 8,
              ),
              decoration: InputDecoration(
                counterText: '',
                hintText: '000000',
                hintStyle: TextStyle(
                  color: AppColors.onSurfaceVariant.withValues(alpha: 0.4),
                  fontSize: 24,
                  letterSpacing: 8,
                ),
                filled: true,
                fillColor: AppColors.surfaceContainerLow,
                contentPadding: const EdgeInsets.symmetric(vertical: 16),
                enabledBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(10),
                  borderSide: BorderSide(color: AppColors.outlineVariant.withValues(alpha: 0.3)),
                ),
                focusedBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(10),
                  borderSide: const BorderSide(color: AppColors.primaryContainer),
                ),
              ),
            ),
            const SizedBox(height: 20),
            SizedBox(
              width: double.infinity,
              child: AppButton(
                label: 'Verify Email',
                onPressed: _codeCtl.text.length == 6
                    ? () => ref.read(authProvider.notifier).verifyEmail(_codeCtl.text)
                    : null,
                loading: state.status == AuthStatus.loading,
              ),
            ),
            if (state.error != null) ...[
              const SizedBox(height: 12),
              Text(
                state.error!,
                style: const TextStyle(color: AppColors.error, fontSize: 13),
                textAlign: TextAlign.center,
              ),
            ],
            const SizedBox(height: 8),
            TextButton(
              onPressed: () => ref.read(authProvider.notifier).resendVerification(),
              child: const Text('Resend code', style: TextStyle(color: AppColors.onSurfaceVariant)),
            ),
          ],
        ),
      ),
    );
  }

  Widget _errorBanner(String message) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: AppColors.errorContainer.withValues(alpha: 0.2),
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: AppColors.error.withValues(alpha: 0.2)),
      ),
      child: Row(
        children: [
          const Icon(Icons.error_outline, color: AppColors.error, size: 18),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              message,
              style: const TextStyle(color: AppColors.error, fontSize: 13),
            ),
          ),
        ],
      ),
    );
  }
}
