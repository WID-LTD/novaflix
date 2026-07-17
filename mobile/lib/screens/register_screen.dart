import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../providers/auth_provider.dart';
import '../theme/app_theme.dart';

class RegisterScreen extends ConsumerStatefulWidget {
  const RegisterScreen({super.key});

  @override
  ConsumerState<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends ConsumerState<RegisterScreen> {
  int _step = 0;

  // Step 1
  final _emailCtrl = TextEditingController();
  final _passwordCtrl = TextEditingController();
  bool _obscure = true;

  // Step 2
  final _displayNameCtrl = TextEditingController();
  final _ageCtrl = TextEditingController();

  // Step 3
  final List<String> _allGenres = ['Action', 'Comedy', 'Sci-Fi', 'Drama', 'Horror', 'Documentary'];
  final Set<String> _selectedGenres = {};

  @override
  void dispose() {
    _emailCtrl.dispose();
    _passwordCtrl.dispose();
    _displayNameCtrl.dispose();
    _ageCtrl.dispose();
    super.dispose();
  }

  void _nextStep() {
    if (_step == 0 && (_emailCtrl.text.isEmpty || _passwordCtrl.text.isEmpty)) return;
    if (_step == 1 && _displayNameCtrl.text.isEmpty) return;
    if (_step == 2 && _selectedGenres.length != 3) return;
    setState(() => _step++);
  }

  void _prevStep() => setState(() => _step--);

  void _submit() {
    final email = _emailCtrl.text.trim();
    final password = _passwordCtrl.text.trim();
    if (email.isEmpty || password.isEmpty) return;
    ref.read(authProvider.notifier).register(email, _displayNameCtrl.text.trim(), password);
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(authProvider);

    ref.listen<AuthState>(authProvider, (prev, next) {
      if (next.status == AuthStatus.needsVerification) {
        context.go('/verify-email');
      }
    });

    return Scaffold(
      body: Container(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [AppTheme.black, AppTheme.dark, AppTheme.black],
          ),
        ),
        child: SafeArea(
          child: Center(
            child: SingleChildScrollView(
              padding: const EdgeInsets.symmetric(horizontal: 32),
              child: Column(
                children: [
                  const Text('NOVAFLIX', style: TextStyle(fontSize: 36, fontWeight: FontWeight.w900, color: AppTheme.red, letterSpacing: 6)),
                  const SizedBox(height: 8),
                  Text(_step == 0 ? 'Create Account' : _step == 1 ? 'About You' : 'Your Taste', style: TextStyle(fontSize: 24, fontWeight: FontWeight.w600, color: AppTheme.white.withValues(alpha: 0.9))),
                  const SizedBox(height: 8),
                  Row(mainAxisAlignment: MainAxisAlignment.center, children: List.generate(3, (i) => Container(
                    margin: const EdgeInsets.symmetric(horizontal: 4),
                    width: 40, height: 4,
                    decoration: BoxDecoration(color: i <= _step ? AppTheme.red : AppTheme.darkGray, borderRadius: BorderRadius.circular(2)),
                  ))),
                  const SizedBox(height: 32),
                  if (_step == 0) ...[
                    TextField(controller: _emailCtrl, decoration: const InputDecoration(labelText: 'Email', prefixIcon: Icon(Icons.email_outlined, color: AppTheme.gray)), keyboardType: TextInputType.emailAddress, textInputAction: TextInputAction.next),
                    const SizedBox(height: 16),
                    TextField(controller: _passwordCtrl, decoration: InputDecoration(labelText: 'Password', prefixIcon: const Icon(Icons.lock_outline, color: AppTheme.gray), suffixIcon: IconButton(icon: Icon(_obscure ? Icons.visibility_off : Icons.visibility, color: AppTheme.gray), onPressed: () => setState(() => _obscure = !_obscure))), obscureText: _obscure, textInputAction: TextInputAction.done, onSubmitted: (_) => _nextStep()),
                  ],
                  if (_step == 1) ...[
                    TextField(controller: _displayNameCtrl, decoration: const InputDecoration(labelText: 'Display Name', prefixIcon: Icon(Icons.person_outline, color: AppTheme.gray)), textInputAction: TextInputAction.next),
                    const SizedBox(height: 16),
                    TextField(controller: _ageCtrl, decoration: const InputDecoration(labelText: 'Age', prefixIcon: Icon(Icons.cake_outlined, color: AppTheme.gray)), keyboardType: TextInputType.number, textInputAction: TextInputAction.done, onSubmitted: (_) => _nextStep()),
                  ],
                  if (_step == 2) ...[
                    Text('Pick 3 genres you love', style: TextStyle(color: AppTheme.gray.withValues(alpha: 0.7))),
                    const SizedBox(height: 16),
                    Wrap(spacing: 12, runSpacing: 12, children: _allGenres.map((g) => GestureDetector(
                      onTap: () => setState(() => _selectedGenres.contains(g) ? _selectedGenres.remove(g) : (_selectedGenres.length < 3 ? _selectedGenres.add(g) : null)),
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
                        decoration: BoxDecoration(
                          color: _selectedGenres.contains(g) ? AppTheme.red.withValues(alpha: 0.2) : AppTheme.card,
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(color: _selectedGenres.contains(g) ? AppTheme.red : AppTheme.darkGray),
                        ),
                        child: Text(g, style: TextStyle(color: _selectedGenres.contains(g) ? AppTheme.red : AppTheme.white, fontWeight: FontWeight.w600)),
                      ),
                    )).toList()),
                    const SizedBox(height: 12),
                    Text('${_selectedGenres.length}/3 selected', style: TextStyle(color: AppTheme.gray.withValues(alpha: 0.6), fontSize: 13)),
                  ],
                  const SizedBox(height: 32),
                  if (state.error != null) Padding(padding: const EdgeInsets.only(bottom: 16), child: Text(state.error!, style: const TextStyle(color: AppTheme.red, fontSize: 13))),
                  Row(
                    children: [
                      if (_step > 0) Expanded(
                        child: SizedBox(height: 48, child: OutlinedButton(
                          onPressed: _prevStep,
                          style: OutlinedButton.styleFrom(foregroundColor: AppTheme.white, side: const BorderSide(color: AppTheme.gray), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8))),
                          child: const Text('Back'),
                        )),
                      ),
                      if (_step > 0) const SizedBox(width: 12),
                      Expanded(
                        child: SizedBox(height: 48, child: ElevatedButton(
                          onPressed: _step < 2 ? _nextStep : (state.status == AuthStatus.loading ? null : _submit),
                          child: state.status == AuthStatus.loading
                              ? const SizedBox(width: 24, height: 24, child: CircularProgressIndicator(strokeWidth: 2, color: AppTheme.white))
                              : Text(_step < 2 ? 'Continue' : 'Complete Setup'),
                        )),
                      ),
                    ],
                  ),
                  if (_step == 0) ...[
                    const SizedBox(height: 24),
                    Row(mainAxisAlignment: MainAxisAlignment.center, children: [
                      Text("Already have an account?", style: TextStyle(color: AppTheme.gray)),
                      TextButton(onPressed: () => context.go('/login'), child: const Text('Sign In')),
                    ]),
                  ],
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
