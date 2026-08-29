import 'package:flutter/material.dart';

enum ScreenSize { mobile, tablet, desktop }

class Breakpoints {
  Breakpoints._();

  static const double mobile = 600;
  static const double tablet = 1024;
}

ScreenSize screenSizeFor(double width) {
  if (width >= Breakpoints.tablet) return ScreenSize.desktop;
  if (width >= Breakpoints.mobile) return ScreenSize.tablet;
  return ScreenSize.mobile;
}

bool isDesktop(BuildContext context) =>
    MediaQuery.sizeOf(context).width >= Breakpoints.tablet;

bool isTablet(BuildContext context) {
  final w = MediaQuery.sizeOf(context).width;
  return w >= Breakpoints.mobile && w < Breakpoints.tablet;
}

bool isMobile(BuildContext context) =>
    MediaQuery.sizeOf(context).width < Breakpoints.mobile;

int gridColumns(double width, {int? maxColumns}) {
  int cols;
  if (width >= 1400) {
    cols = 6;
  } else if (width >= 1000) {
    cols = 5;
  } else if (width >= 700) {
    cols = 4;
  } else if (width >= 480) {
    cols = 3;
  } else {
    cols = 2;
  }
  if (maxColumns != null && cols > maxColumns) cols = maxColumns;
  return cols;
}

double gridAspectRatio(double contentWidth, int columns, {double spacing = 20}) {
  final cellWidth = (contentWidth - (columns - 1) * spacing) / columns;
  return cellWidth / (cellWidth * 1.5 + 42);
}

double responsivePadding(double width) {
  if (width >= Breakpoints.tablet) return 64;
  if (width >= Breakpoints.mobile) return 32;
  return 16;
}

double responsiveMaxContentWidth(double width) {
  if (width >= Breakpoints.tablet) return 1440;
  if (width >= Breakpoints.mobile) return 960;
  return 600;
}

double responsiveCardWidth(double width) {
  if (width >= Breakpoints.tablet) return 180;
  if (width >= Breakpoints.mobile) return 170;
  return 160;
}
