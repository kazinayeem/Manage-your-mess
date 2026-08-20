import 'package:flutter/material.dart';
import '../../app/theme/app_colors.dart';
import '../../app/theme/app_theme.dart';

/// Badge matching the Web `Badge` component variants:
/// primary (emerald-600), success (green-100/green-800),
/// secondary (zinc-100), outline, destructive (red-600), warning (amber), info (sky).
class AppBadge extends StatelessWidget {
  final String text;
  final AppBadgeVariant variant;
  final Color? customColor;
  final Color? customBgColor;
  final double fontSize;
  final IconData? icon;

  const AppBadge({
    super.key,
    required this.text,
    this.variant = AppBadgeVariant.primary,
    this.customColor,
    this.customBgColor,
    this.fontSize = 12,
    this.icon,
  });

  const AppBadge.success(this.text, {super.key, this.icon})
      : variant = AppBadgeVariant.success,
        customColor = null,
        customBgColor = null,
        fontSize = 12;

  const AppBadge.secondary(this.text, {super.key, this.icon})
      : variant = AppBadgeVariant.secondary,
        customColor = null,
        customBgColor = null,
        fontSize = 12;

  const AppBadge.outline(this.text, {super.key, this.icon})
      : variant = AppBadgeVariant.outline,
        customColor = null,
        customBgColor = null,
        fontSize = 12;

  const AppBadge.destructive(this.text, {super.key, this.icon})
      : variant = AppBadgeVariant.destructive,
        customColor = null,
        customBgColor = null,
        fontSize = 12;

  const AppBadge.warning(this.text, {super.key, this.icon})
      : variant = AppBadgeVariant.warning,
        customColor = null,
        customBgColor = null,
        fontSize = 12;

  const AppBadge.info(this.text, {super.key, this.icon})
      : variant = AppBadgeVariant.info,
        customColor = null,
        customBgColor = null,
        fontSize = 12;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    final (fg, bg, border) = _resolve(isDark);

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: customBgColor ?? bg,
        borderRadius: BorderRadius.circular(AppTheme.radiusBadge),
        border: border != null ? Border.all(color: border) : null,
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (icon != null) ...[
            Icon(icon, size: 12, color: customColor ?? fg),
            const SizedBox(width: 4),
          ],
          Text(
            text,
            style: TextStyle(
              color: customColor ?? fg,
              fontSize: fontSize,
              fontWeight: FontWeight.w600,
              letterSpacing: 0.1,
            ),
          ),
        ],
      ),
    );
  }

  (Color, Color, Color?) _resolve(bool isDark) {
    switch (variant) {
      case AppBadgeVariant.primary:
        return (Colors.white, AppColors.primary, null);
      case AppBadgeVariant.success:
        return (
          isDark ? AppColors.successLight : AppColors.successDark,
          isDark ? const Color(0xFF14532D) : AppColors.successLight,
          null,
        );
      case AppBadgeVariant.secondary:
        return (
          isDark ? AppColors.textPrimaryDark : AppColors.textPrimaryLight,
          isDark ? AppColors.surfaceDark : AppColors.surfaceLight,
          null,
        );
      case AppBadgeVariant.outline:
        return (
          isDark ? AppColors.textPrimaryDark : AppColors.textPrimaryLight,
          Colors.transparent,
          isDark ? AppColors.borderDark : AppColors.borderLight,
        );
      case AppBadgeVariant.destructive:
        return (Colors.white, AppColors.error, null);
      case AppBadgeVariant.warning:
        return (
          isDark ? const Color(0xFFFCD34D) : AppColors.warningText,
          isDark ? const Color(0xFF451A03) : AppColors.warningSoft,
          null,
        );
      case AppBadgeVariant.info:
        return (
          isDark ? const Color(0xFF7DD3FC) : AppColors.infoText,
          isDark ? const Color(0xFF0C4A6E) : AppColors.infoSoft,
          null,
        );
      case AppBadgeVariant.default_:
        return (Colors.white, AppColors.primary, null);
    }
  }
}

enum AppBadgeVariant { primary, success, secondary, outline, destructive, warning, info, default_ }

/// Backwards-compatible alias.
typedef BadgeVariant = AppBadgeVariant;