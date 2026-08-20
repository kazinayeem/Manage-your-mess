import 'package:flutter/material.dart';
import '../../app/theme/app_colors.dart';
import '../../app/theme/app_theme.dart';
import 'app_button.dart';

/// Confirm dialog matching the Web `Dialog` component (rounded-xl, border).
Future<bool> showAppConfirmDialog(
  BuildContext context, {
  required String title,
  required String message,
  String confirmText = 'Confirm',
  String cancelText = 'Cancel',
  bool destructive = false,
  VoidCallback? onConfirm,
}) async {
  final result = await showDialog<bool>(
    context: context,
    builder: (dialogContext) => AlertDialog(
      titlePadding: const EdgeInsets.fromLTRB(24, 24, 24, 0),
      contentPadding: const EdgeInsets.fromLTRB(24, 12, 24, 0),
      actionsPadding: const EdgeInsets.fromLTRB(24, 8, 24, 20),
      title: Text(
        title,
        style: Theme.of(dialogContext).textTheme.titleLarge,
      ),
      content: Text(
        message,
        style: Theme.of(dialogContext).textTheme.bodyMedium?.copyWith(
              color: Theme.of(dialogContext).textTheme.bodySmall?.color,
              height: 1.4,
            ),
      ),
      actions: [
        Row(
          children: [
            Expanded(
              child: AppButton(
                text: cancelText,
                variant: AppButtonVariant.outline,
                onPressed: () => Navigator.of(dialogContext).pop(false),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: AppButton(
                text: confirmText,
                variant: destructive
                    ? AppButtonVariant.destructive
                    : AppButtonVariant.primary,
                onPressed: () => Navigator.of(dialogContext).pop(true),
              ),
            ),
          ],
        ),
      ],
    ),
  );
  if (result == true) onConfirm?.call();
  return result ?? false;
}

/// Inline loading state: centered spinner on muted surface (web-style).
class AppLoading extends StatelessWidget {
  final String? label;

  const AppLoading({super.key, this.label});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          const SizedBox(
            width: 28,
            height: 28,
            child: CircularProgressIndicator(strokeWidth: 2.5),
          ),
          if (label != null) ...[
            const SizedBox(height: 12),
            Text(
              label!,
              style: theme.textTheme.bodySmall,
            ),
          ],
        ],
      ),
    );
  }
}