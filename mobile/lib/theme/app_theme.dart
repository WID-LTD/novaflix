import 'package:flutter/material.dart';

class AppTheme {
  static const Color black = Color(0xFF090909);
  static const Color dark = Color(0xFF111111);
  static const Color card = Color(0xFF181818);
  static const Color red = Color(0xFFE50914);
  static const Color redLight = Color(0xFFFF4D4F);
  static const Color redAccent = Color(0xFFFF8A8A);
  static const Color white = Color(0xFFFFFFFF);
  static const Color gray = Color(0xFF888888);
  static const Color darkGray = Color(0xFF333333);

  static ThemeData get darkTheme {
    return ThemeData(
      brightness: Brightness.dark,
      scaffoldBackgroundColor: black,
      colorScheme: const ColorScheme.dark(
        primary: red,
        secondary: redLight,
        surface: dark,
        error: red,
        onPrimary: white,
        onSecondary: white,
        onSurface: white,
        onError: white,
      ),
      appBarTheme: const AppBarTheme(
        backgroundColor: dark,
        foregroundColor: white,
        elevation: 0,
        centerTitle: true,
      ),
      bottomNavigationBarTheme: const BottomNavigationBarThemeData(
        backgroundColor: dark,
        selectedItemColor: red,
        unselectedItemColor: gray,
        type: BottomNavigationBarType.fixed,
      ),
      cardTheme: CardThemeData(
        color: card,
        elevation: 0,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: card,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
          borderSide: BorderSide.none,
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
          borderSide: const BorderSide(color: red, width: 1.5),
        ),
        labelStyle: const TextStyle(color: gray),
        hintStyle: const TextStyle(color: gray),
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: red,
          foregroundColor: white,
          minimumSize: const Size(double.infinity, 48),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
          textStyle: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
        ),
      ),
      textButtonTheme: TextButtonThemeData(
        style: TextButton.styleFrom(foregroundColor: redLight),
      ),
      dividerTheme: const DividerThemeData(color: darkGray, thickness: 0.5),
      progressIndicatorTheme: const ProgressIndicatorThemeData(color: red),
    );
  }
}
