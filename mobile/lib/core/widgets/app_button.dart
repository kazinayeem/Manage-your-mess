import 'package:flutter/material.dart';
import '../../app/theme/app_colors.dart';
import '../../app/theme/app_theme.dart';

/// Button matching the Web `Button` component (CVA variants):
/// default (emerald-600), outline, secondary, destructive, ghost, link.
class AppButton extends StatelessWidget {
  final String text;
  final VoidCallback? onPressed;
  final bool isLoading;
  final AppButtonVariant variant;
  final IconData? icon;
  final Color? backgroundColor;
  final double? width;
  final double? height;
  final AppButtonSize size;
  final EdgeInsetsGeometry padding;

  const AppButton({
    super.key,
    required this.text,
    this.onPressed,
    this.isLoading = false,
    this.variant = AppButtonVariant.primary,
    this.icon,
    this.backgroundColor,
    this.width,
    this.height,
    this.size = AppButtonSize.md,
    this.padding = const EdgeInsets.symmetric(horizontal: 16),
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    final (bg, fg, border, hasShadow) = _resolve(isDark);

    final h = height ?? switch (size) {
          AppButtonSize.sm => 32.0,
          AppButtonSize.md => 40.0,
          AppButtonSize.lg => 48.0,
        };
    final radius = size == AppButtonSize.sm ? 6.0 : AppTheme.radiusButton.toDouble();

    return SizedBox(
      width: width,
      height: h,
      child: ElevatedButton(
        onPressed: isLoading ? null : onPressed,
        style: ElevatedButton.styleFrom(
          backgroundColor: backgroundColor ?? bg,
          foregroundColor: fg,
          elevation: hasShadow ? 1 : 0,
          shadowColor: Colors.black.withOpacity(0.1),
          side: border != null ? BorderSide(color: border, width: 1) : null,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(radius),
          ),
          padding: padding,
          disabledBackgroundColor: (backgroundColor ?? bg).withOpacity(0.5),
          disabledForegroundColor: fg.withOpacity(0.7),
          textStyle: TextStyle(
            fontSize: size == AppButtonSize.sm ? 13 : 14,
            fontWeight: FontWeight.w500,
          ),
        ),
        child: isLoading
            ? SizedBox(
                width: 20,
                height: 20,
                child: CircularProgressIndicator(
                  strokeWidth: 2.5,
                  color: fg,
                ),
              )
            : Row(
                mainAxisSize: MainAxisSize.min,
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  if (icon != null) ...[
                    Icon(icon, size: 16),
                    const SizedBox(width: 8),
                  ],
                  Flexible(
                    child: Text(
                      text,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                ],
              ),
      ),
    );
  }

  (Color, Color, Color?, bool) _resolve(bool isDark) {
    switch (variant) {
      case AppButtonVariant.primary:
        return (AppColors.primary, Colors.white, null, true);
      case AppButtonVariant.outline:
        return (
          isDark ? AppColors.bgDark : AppColors.cardLight,
          AppColors.textPrimaryLight,
          isDark ? AppColors.borderDark : AppColors.borderLight,
          true,
        );
      case AppButtonVariant.secondary:
        return (
          isDark ? AppColors.surfaceDark : AppColors.surfaceLight,
          isDark ? AppColors.textPrimaryDark : AppColors.textPrimaryLight,
          null,
          true,
        );
      case AppButtonVariant.destructive:
        return (AppColors.error, Colors.white, null, true);
      case AppButtonVariant.ghost:
        return (
          Colors.transparent,
          isDark ? AppColors.textPrimaryDark : AppColors.textPrimaryLight,
          null,
          false,
        );
      case AppButtonVariant.link:
        return (Colors.transparent, AppColors.primary, null, false);
    }
  }
}

enum AppButtonVariant { primary, outline, secondary, destructive, ghost, link }

enum AppButtonSize { sm, md, lg }