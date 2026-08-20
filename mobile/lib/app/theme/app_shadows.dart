import 'package:flutter/material.dart';

/// Shadows matching the web app's Tailwind shadow-sm / shadow-md.
class AppShadows {
  static const List<BoxShadow> card = [
    BoxShadow(
      color: Color(0x0F000000), // rgb(0 0 0 / 0.06)
      blurRadius: 2,
      offset: Offset(0, 1),
    ),
    BoxShadow(
      color: Color(0x0F000000), // rgb(0 0 0 / 0.06)
      blurRadius: 1,
      offset: Offset(0, 1),
    ),
  ];

  static const List<BoxShadow> hover = [
    BoxShadow(
      color: Color(0x14000000), // rgb(0 0 0 / 0.08)
      blurRadius: 4,
      offset: Offset(0, 2),
    ),
  ];

  static const List<BoxShadow> none = [];
}