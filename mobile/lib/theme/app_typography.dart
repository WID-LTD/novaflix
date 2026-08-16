import 'package:flutter/material.dart';

class AppTypography {
  static const String displayFont = 'Inter';
  static const String labelFont = 'JetBrains Mono';

  static const TextStyle displayLg = TextStyle(
    fontFamily: displayFont, fontSize: 64, fontWeight: FontWeight.w800,
    letterSpacing: -0.04, height: 1.125,
  );
  static const TextStyle displayMd = TextStyle(
    fontFamily: displayFont, fontSize: 48, fontWeight: FontWeight.w800,
    letterSpacing: -0.03, height: 1.167,
  );
  static const TextStyle headlineLg = TextStyle(
    fontFamily: displayFont, fontSize: 40, fontWeight: FontWeight.w700,
    letterSpacing: -0.02, height: 1.2,
  );
  static const TextStyle headlineLgMobile = TextStyle(
    fontFamily: displayFont, fontSize: 28, fontWeight: FontWeight.w700,
    letterSpacing: -0.01, height: 1.286,
  );
  static const TextStyle headlineMd = TextStyle(
    fontFamily: displayFont, fontSize: 24, fontWeight: FontWeight.w600,
    height: 1.333,
  );
  static const TextStyle headlineSm = TextStyle(
    fontFamily: displayFont, fontSize: 20, fontWeight: FontWeight.w600,
    height: 1.4,
  );
  static const TextStyle bodyLg = TextStyle(
    fontFamily: displayFont, fontSize: 18, fontWeight: FontWeight.w400,
    height: 1.556,
  );
  static const TextStyle bodyMd = TextStyle(
    fontFamily: displayFont, fontSize: 16, fontWeight: FontWeight.w400,
    height: 1.5,
  );
  static const TextStyle bodySm = TextStyle(
    fontFamily: displayFont, fontSize: 14, fontWeight: FontWeight.w400,
    height: 1.5,
  );
  static const TextStyle labelLg = TextStyle(
    fontFamily: labelFont, fontSize: 16, fontWeight: FontWeight.w500,
    letterSpacing: 0.05, height: 1.5,
  );
  static const TextStyle labelMd = TextStyle(
    fontFamily: labelFont, fontSize: 14, fontWeight: FontWeight.w500,
    letterSpacing: 0.05, height: 1.429,
  );
  static const TextStyle labelSm = TextStyle(
    fontFamily: labelFont, fontSize: 12, fontWeight: FontWeight.w500,
    height: 1.333,
  );
  static const TextStyle labelXs = TextStyle(
    fontFamily: labelFont, fontSize: 10, fontWeight: FontWeight.w600,
    letterSpacing: 0.05,
  );
}
