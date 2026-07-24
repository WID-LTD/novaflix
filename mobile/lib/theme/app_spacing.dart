import 'package:flutter/material.dart';

class AppSpacing {
  static const double pageHMobile = 16.0;
  static const double pageHDesktop = 40.0;
  static const double gutter = 16.0;
  static const double maxContentWidth = 1280.0;
  static const double bottomNavHeight = 64.0;

  static EdgeInsets get pageMargin => const EdgeInsets.symmetric(horizontal: pageHMobile);
  static EdgeInsets get pageMarginDesktop => const EdgeInsets.symmetric(horizontal: pageHDesktop);
}
