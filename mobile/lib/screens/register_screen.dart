import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../theme/app_colors.dart';
import '../theme/app_typography.dart';
import '../providers/auth_provider.dart';
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
  int? _age;
  final List<String> _selectedGenres = [];

  final _genres = [
    'Action', 'Comedy', 'Drama', 'Horror', 'Sci-Fi', 'Romance',
  ];

  @override
  void dispose() {
    _emailCtl.dispose();
    _passwordCtl.dispose();
    _nameCtl.dispose();
    super.dispose();
  }

  void _submit() {
    if (_step < 3) {
      setState(() => _step++);
    } else {
      ref.read(authProvider.notifier).register(
        _emailCtl.text.trim(), _passwordCtl.text, _nameCtl.text.trim(),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final authState = ref.watch(authProvider);

    if (authState.status == AuthStatus.authenticated) {
      WidgetsBinding.instance.addPostFrameCallback((_) => context.go('/profiles'));
    }

    if (authState.status == AuthStatus.needsVerification) {
      WidgetsBinding.instance.addPostFrameCallback((_) => context.go('/verify-email'));
    }

    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: Stack(
          children: [
            SingleChildScrollView(
              padding: const EdgeInsets.all(24),
              child: Column(
                children: [
                  const SizedBox(height: 20),
                  Icon(Icons.play_circle_fill, size: 50, color: AppColors.primary),
                  const SizedBox(height: 8),
                  Text('NOVAFLIX', style: AppTypography.headlineMd.copyWith(letterSpacing: 3, fontWeight: FontWeight.w900)),
                  const SizedBox(height: 24),
                  ClipRRect(
                    borderRadius: BorderRadius.circular(4),
                    child: LinearProgressIndicator(
                      value: _step / 3,
                      backgroundColor: AppColors.surfaceContainerHighest,
                      valueColor: AlwaysStoppedAnimation(AppColors.primary),
                      minHeight: 4,
                    ),
                  ),
                  const SizedBox(height: 32),
                  AnimatedSwitcher(
                    duration: const Duration(milliseconds: 300),
                    child: _step == 1 ? _step1() : (_step == 2 ? _step2() : _step3()),
                  ),
                  const SizedBox(height: 32),
                  Row(
                    children: [
                      if (_step > 1)
                        Expanded(
                          child: AppButton(label: 'Back', onPressed: () => setState(() => _step--), outlined: true, fullWidth: true),
                        ),
                      if (_step > 1) const SizedBox(width: 12),
                      Expanded(
                        child: AppButton(
                          label: _step == 3 ? 'Complete' : 'Continue',
                          onPressed: _submit,
                          loading: authState.status == AuthStatus.loading,
                        ),
                      ),
                    ],
                  ),
                  if (authState.error != null) ...[
                    const SizedBox(height: 12),
                    Text(authState.error!, style: const TextStyle(color: AppColors.error, fontSize: 13)),
                  ],
                ],
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

  Widget _step1() {
    return Column(
      key: const ValueKey(1),
      children: [
        Text('Create Account', style: AppTypography.headlineMd),
        const SizedBox(height: 8),
        Text('Step 1 of 3 - Credentials', style: TextStyle(color: AppColors.onSurfaceVariant)),
        const SizedBox(height: 24),
        AppInput(controller: _emailCtl, label: 'Email', hint: 'your@email.com', keyboardType: TextInputType.emailAddress),
        const SizedBox(height: 16),
        AppInput(controller: _passwordCtl, label: 'Password', hint: 'Min 6 characters', obscureText: true),
      ],
    );
  }

  Widget _step2() {
    return Column(
      key: const ValueKey(2),
      children: [
        Text('About You', style: AppTypography.headlineMd),
        const SizedBox(height: 8),
        Text('Step 2 of 3', style: TextStyle(color: AppColors.onSurfaceVariant)),
        const SizedBox(height: 24),
        AppInput(controller: _nameCtl, label: 'Display Name', hint: 'How others see you'),
        const SizedBox(height: 16),
        AppInput(
          label: 'Age', hint: 'Your age',
          keyboardType: TextInputType.number,
          onChanged: (v) => _age = int.tryParse(v),
        ),
      ],
    );
  }

  Widget _step3() {
    return Column(
      key: const ValueKey(3),
      children: [
        Text('Taste Profile', style: AppTypography.headlineMd),
        const SizedBox(height: 8),
        Text('Step 3 of 3 - Pick 3 genres', style: TextStyle(color: AppColors.onSurfaceVariant)),
        const SizedBox(height: 24),
        Wrap(
          spacing: 10,
          runSpacing: 10,
          children: _genres.map((g) {
            final selected = _selectedGenres.contains(g);
            return GestureDetector(
              onTap: () {
                setState(() {
                  if (selected) {
                    _selectedGenres.remove(g);
                  } else if (_selectedGenres.length < 3) {
                    _selectedGenres.add(g);
                  }
                });
              },
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
                decoration: BoxDecoration(
                  color: selected ? AppColors.primary.withValues(alpha: 0.2) : AppColors.surfaceContainerHigh,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: selected ? AppColors.primary : AppColors.outlineVariant),
                ),
                child: Text(g,
                  style: TextStyle(
                    color: selected ? AppColors.primary : AppColors.onSurface,
                    fontWeight: selected ? FontWeight.w600 : FontWeight.normal,
                  ),
                ),
              ),
            );
          }).toList(),
        ),
      ],
    );
  }
}
