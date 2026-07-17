import 'package:flutter_test/flutter_test.dart';
import 'package:novaflix/app.dart';

void main() {
  testWidgets('App renders', (WidgetTester tester) async {
    await tester.pumpWidget(const NovaflixApp());
    expect(find.byType(NovaflixApp), findsOneWidget);
  });
}
