import 'package:flutter/material.dart';
import '../../app/theme/app_colors.dart';
import 'app_button.dart';

/// Error state matching the web app's error UI: red icon, muted message,
/// and a retry button.
class AppErrorState extends StatelessWidget {
  final String message;
  final VoidCallback? onRetry;

  const AppErrorState({
    super.key,
    required this.message,
    this.onRetry,
  });

  /// Sanitize error messages so raw DioException / stack traces are never shown
  String get _displayMessage {
    final msg = message;
    if (msg.contains('DioException') ||
        msg.contains('SocketException') ||
        msg.contains('HandshakeException') ||
        msg.contains('FormatException') ||
        msg.contains('StatusCode') ||
        msg.contains('RequestOptions') ||
        msg.contains('validateStatus')) {
      return 'Something went wrong. Please try again.';
    }
    if (msg.length > 150) {
      return '${msg.substring(0, 147)}...';
    }
    return msg;
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              width: 56,
              height: 56,
              decoration: BoxDecoration(
                color: isDark ? AppColors.errorLight.withValues(alpha: 0.15) : AppColors.errorLight,
                borderRadius: BorderRadius.circular(12),
              ),
              child: Icon(
                Icons.error_outline_rounded,
                size: 26,
                color: isDark ? AppColors.errorSoft : AppColors.error,
              ),
            ),
            const SizedBox(height: 16),
            Text(
              _displayMessage,
              style: theme.textTheme.bodyMedium?.copyWith(
                color: theme.textTheme.bodySmall?.color,
                height: 1.4,
              ),
              textAlign: TextAlign.center,
            ),
            if (onRetry != null) ...[
              const SizedBox(height: 20),
              AppButton(
                text: 'Try Again',
                variant: AppButtonVariant.outline,
                icon: Icons.refresh_rounded,
                onPressed: onRetry,
                width: 140,
              ),
            ],
          ],
        ),
      ),
    );
  }
}