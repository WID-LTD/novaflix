import 'package:flutter/material.dart';

class AppTypography {
  static const String displayFont = 'Inter';
  static const String labelFont = 'JetBrains Mono';

  static const TextStyle displayLg = TextStyle(
    fontFamily: displayFont, fontSize: 64, fontWeight: FontWeight.w700,
    letterSpacing: -0.02,
  );
  static const TextStyle displayMd = TextStyle(
    fontFamily: displayFont, fontSize: 48, fontWeight: FontWeight.w700,
    letterSpacing: -0.02,
  );
  static const TextStyle headlineLg = TextStyle(
    fontFamily: displayFont, fontSize: 40, fontWeight: FontWeight.w600,
  );
  static const TextStyle headlineMd = TextStyle(
    fontFamily: displayFont, fontSize: 24, fontWeight: FontWeight.w600,
  );
  static const TextStyle headlineSm = TextStyle(
    fontFamily: displayFont, fontSize: 20, fontWeight: FontWeight.w600,
  );
  static const TextStyle bodyLg = TextStyle(
    fontFamily: displayFont, fontSize: 18, fontWeight: FontWeight.w400,
  );
  static const TextStyle bodyMd = TextStyle(
    fontFamily: displayFont, fontSize: 16, fontWeight: FontWeight.w400,
  );
  static const TextStyle bodySm = TextStyle(
    fontFamily: displayFont, fontSize: 14, fontWeight: FontWeight.w400,
  );
  static const TextStyle labelLg = TextStyle(
    fontFamily: displayFont, fontSize: 16, fontWeight: FontWeight.w500,
  );
  static const TextStyle labelMd = TextStyle(
    fontFamily: displayFont, fontSize: 14, fontWeight: FontWeight.w500,
  );
  static const TextStyle labelSm = TextStyle(
    fontFamily: displayFont, fontSize: 12, fontWeight: FontWeight.w500,
  );
  static const TextStyle labelXs = TextStyle(
    fontFamily: labelFont, fontSize: 10, fontWeight: FontWeight.w600,
    letterSpacing: 0.05,
  );
}
