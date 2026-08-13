import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:novaflix/app.dart';

void main() {
  testWidgets('App renders', (WidgetTester tester) async {
    SharedPreferences.setMockInitialValues({});
    await tester.pumpWidget(const ProviderScope(child: NovaflixApp()));
    expect(find.byType(NovaflixApp), findsOneWidget);

    await tester.pump(const Duration(seconds: 6));
    await tester.pumpAndSettle(const Duration(milliseconds: 100));
    expect(find.byType(NovaflixApp), findsOneWidget);
  });
}
