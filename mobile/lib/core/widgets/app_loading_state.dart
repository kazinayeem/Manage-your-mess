import 'package:flutter/material.dart';
import '../../app/theme/app_colors.dart';
import '../../app/theme/app_shadows.dart';
import 'shimmer_loader.dart';

/// Loading state matching the web app's page skeleton:
/// card-shaped placeholders with a soft shimmer.
class AppLoadingState extends StatelessWidget {
  final bool useList;
  final int cardCount;

  const AppLoadingState({
    super.key,
    this.useList = false,
    this.cardCount = 3,
  });

  @override
  Widget build(BuildContext context) {
    if (useList) {
      return ListView.separated(
        padding: const EdgeInsets.all(16),
        itemCount: cardCount,
        separatorBuilder: (_, __) => const SizedBox(height: 12),
        itemBuilder: (_, __) => const _LoadingCard(height: 96),
      );
    }
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        const ShimmerLoader(height: 28, width: 160),
        const SizedBox(height: 8),
        const ShimmerLoader(height: 14, width: 240),
        const SizedBox(height: 24),
        for (var i = 0; i < cardCount; i++) ...[
          const _LoadingCard(height: 72),
          const SizedBox(height: 12),
        ],
      ],
    );
  }
}

class _LoadingCard extends StatelessWidget {
  final double height;
  const _LoadingCard({required this.height});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    final bg = isDark ? AppColors.surfaceDark : AppColors.surfaceLight;

    return Container(
      height: height,
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: isDark ? AppColors.borderDark : AppColors.borderLight,
        ),
        boxShadow: isDark ? null : AppShadows.card,
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(12),
        child: ShimmerLoader(height: height),
      ),
    );
  }
}