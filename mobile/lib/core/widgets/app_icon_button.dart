import 'package:flutter/material.dart';
import '../../app/theme/app_colors.dart';

/// Icon button on a soft tinted square — used for AppBar actions
/// (e.g. notifications), matching the web app's quiet icon buttons.
class AppIconButton extends StatelessWidget {
  final IconData icon;
  final VoidCallback? onPressed;
  final String? tooltip;
  final Color? color;
  final Color? backgroundColor;
  final double size;

  const AppIconButton({
    super.key,
    required this.icon,
    this.onPressed,
    this.tooltip,
    this.color,
    this.backgroundColor,
    this.size = 40,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    final iconColor = color ?? (isDark ? AppColors.textPrimaryDark : AppColors.textPrimaryLight);
    final bgColor = backgroundColor ??
        (isDark ? AppColors.surfaceDark : AppColors.surfaceLight);

    return Tooltip(
      message: tooltip ?? '',
      child: Material(
        color: bgColor,
        borderRadius: BorderRadius.circular(8),
        child: InkWell(
          onTap: onPressed,
          borderRadius: BorderRadius.circular(8),
          child: SizedBox(
            width: size,
            height: size,
            child: Icon(icon, size: 20, color: iconColor),
          ),
        ),
      ),
    );
  }
}