import 'package:flutter/material.dart';

class ErrorView extends StatelessWidget {
  final String message;
  final VoidCallback? onRetry;

  const ErrorView({
    super.key,
    required this.message,
    this.onRetry,
  });

  /// Sanitize error messages so raw DioException / stack traces are never shown
  String get _displayMessage {
    final msg = message;
    // Never show raw Dio/technical errors to users
    if (msg.contains('DioException') ||
        msg.contains('SocketException') ||
        msg.contains('HandshakeException') ||
        msg.contains('FormatException') ||
        msg.contains('StatusCode') ||
        msg.contains('RequestOptions') ||
        msg.contains('validateStatus')) {
      return 'Something went wrong. Please try again.';
    }
    // Truncate overly long messages
    if (msg.length > 150) {
      return '${msg.substring(0, 147)}...';
    }
    return msg;
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32.0),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: Colors.redAccent.withOpacity(0.08),
                shape: BoxShape.circle,
              ),
              child: const Icon(Icons.error_outline_rounded,
                  size: 48, color: Colors.redAccent),
            ),
            const SizedBox(height: 20),
            Text(
              _displayMessage,
              style: theme.textTheme.bodyLarge?.copyWith(
                color: theme.textTheme.bodyMedium?.color,
              ),
              textAlign: TextAlign.center,
            ),
            if (onRetry != null) ...[
              const SizedBox(height: 24),
              FilledButton.icon(
                onPressed: onRetry,
                icon: const Icon(Icons.refresh_rounded, size: 18),
                label: const Text('Try Again'),
                style: FilledButton.styleFrom(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}
