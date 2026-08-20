import 'package:flutter/material.dart';

/// Design tokens matching the Web app (Tailwind zinc + emerald palette).
/// Web source of truth: frontend/app/globals.css + components/ui/*.
class AppColors {
  // ─── Brand / Primary (Emerald — web uses emerald-600) ─────────────────────
  static const Color primary = Color(0xFF059669); // emerald-600
  static const Color primaryDark = Color(0xFF047857); // emerald-700 (hover)
  static const Color primaryLight = Color(0xFF10B981); // emerald-500 (ring/focus)
  static const Color primary50 = Color(0xFFECFDF5); // emerald-50
  static const Color primary100 = Color(0xFFD1FAE5); // emerald-100
  static const Color primary950 = Color(0xFF022C22); // emerald-950 (dark bg)
  static const Color brandGradientStart = Color(0xFF10B981); // emerald-500
  static const Color brandGradientEnd = Color(0xFF0D9488); // teal-600

  // ─── Super Admin accent (Violet — web uses violet-600) ────────────────────
  static const Color adminAccent = Color(0xFF7C3AED); // violet-600
  static const Color adminAccent700 = Color(0xFF6D28D9); // violet-700
  static const Color adminAccent50 = Color(0xFFF5F3FF); // violet-50
  static const Color adminAccent100 = Color(0xFFEDE9FE); // violet-100
  static const Color adminAccent950 = Color(0xFF2E1065); // violet-950

  // ─── Surfaces — Light mode ────────────────────────────────────────────────
  static const Color bgLight = Color(0xFFFAFAFA); // zinc-50 page shell
  static const Color cardLight = Color(0xFFFFFFFF); // white
  static const Color surfaceLight = Color(0xFFF4F4F5); // zinc-100
  static const Color borderLight = Color(0xFFE4E4E7); // zinc-200

  // ─── Surfaces — Dark mode ─────────────────────────────────────────────────
  static const Color bgDark = Color(0xFF09090B); // zinc-950
  static const Color cardDark = Color(0xFF18181B); // zinc-900
  static const Color surfaceDark = Color(0xFF27272A); // zinc-800
  static const Color borderDark = Color(0xFF27272A); // zinc-800

  // ─── Text ─────────────────────────────────────────────────────────────────
  static const Color textPrimaryLight = Color(0xFF09090B); // zinc-950
  static const Color textSecondaryLight = Color(0xFF71717A); // zinc-500
  static const Color textTertiaryLight = Color(0xFFA1A1AA); // zinc-400

  static const Color textPrimaryDark = Color(0xFFFAFAFA); // zinc-50
  static const Color textSecondaryDark = Color(0xFFA1A1AA); // zinc-400
  static const Color textTertiaryDark = Color(0xFF71717A); // zinc-500

  // ─── Status & Feedback (web palette) ──────────────────────────────────────
  static const Color success = Color(0xFF059669); // emerald-600
  static const Color successLight = Color(0xFFDCFCE7); // green-100 badge bg
  static const Color successDark = Color(0xFF166534); // green-800 badge text
  static const Color warning = Color(0xFFD97706); // amber-600
  static const Color warningLight = Color(0xFFFEF3C7); // amber-100
  static const Color error = Color(0xFFDC2626); // red-600
  static const Color errorLight = Color(0xFFFEF2F2); // red-50
  static const Color errorSoft = Color(0xFFEF4444); // red-500 (text)
  static const Color rose = Color(0xFFE11D48); // rose-600 (negative balances)
  static const Color info = Color(0xFF0284C7); // sky-600
  static const Color infoSoft = Color(0xFFE0F2FE); // sky-100
  static const Color infoText = Color(0xFF0369A1); // sky-700

  // Compatibility aliases (used across screens)
  static const Color accent = primary;
  static const Color secondary = adminAccent;
  static const Color errorText = errorSoft;
  static const Color warningSoft = Color(0xFFFEF3C7); // amber-100
  static const Color warningText = Color(0xFFB45309); // amber-700
  static const Color neutralSoft = Color(0xFFF4F4F5); // zinc-100
  static const Color textFaintLight = Color(0xFFA1A1AA); // zinc-400
  static const Color textFaintDark = Color(0xFF71717A); // zinc-500
  static const Color primarySoft = Color(0xFFECFDF5); // emerald-50
  static const Color primarySurface = Color(0xFFD1FAE5); // emerald-100
  static const Color successSoft = Color(0xFFDCFCE7); // green-100
  static const Color successText = Color(0xFF166534); // green-800
}