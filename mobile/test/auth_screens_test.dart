import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:novaflix/screens/login_screen.dart';
import 'package:novaflix/screens/register_screen.dart';

Widget wrap(Widget child) {
  return ProviderScope(
    child: MaterialApp(home: child),
  );
}

void main() {
  testWidgets('LoginScreen renders with fallback backdrop (no crash)', (tester) async {
    await tester.pumpWidget(wrap(const LoginScreen()));
    await tester.pump(const Duration(milliseconds: 300));

    expect(find.text('Welcome back'), findsOneWidget);
    expect(find.text('Sign In'), findsWidgets);
    expect(find.byType(TextField), findsWidgets);
  });

  testWidgets('RegisterScreen renders step 1 with email/password fields', (tester) async {
    await tester.pumpWidget(wrap(const RegisterScreen()));
    await tester.pump(const Duration(milliseconds: 300));

    expect(find.text('Create Account'), findsOneWidget);
    expect(find.text('Step 1 of 3 — Credentials'), findsOneWidget);
    expect(find.byType(TextField), findsNWidgets(2));
  });
}
