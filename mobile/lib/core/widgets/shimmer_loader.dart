import 'package:flutter/material.dart';
import 'package:shimmer/shimmer.dart';
import '../../app/theme/app_colors.dart';
import '../../app/theme/app_theme.dart';

class ShimmerLoader extends StatelessWidget {
  final double width;
  final double height;
  final double borderRadius;

  const ShimmerLoader({
    super.key,
    this.width = double.infinity,
    this.height = 20,
    this.borderRadius = 8,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Shimmer.fromColors(
      baseColor: isDark ? AppColors.surfaceDark : AppColors.borderLight,
      highlightColor: isDark ? AppColors.cardDark : AppColors.surfaceLight,
      child: Container(
        width: width,
        height: height,
        decoration: BoxDecoration(
          color: isDark ? AppColors.surfaceDark : AppColors.borderLight,
          borderRadius: BorderRadius.circular(borderRadius),
        ),
      ),
    );
  }
}

/// Page skeleton matching the Web `PageSkeleton`:
/// title bars, KPI card grid, then a table block.
class PageSkeleton extends StatelessWidget {
  final bool showHeader;
  final int kpiCount;
  final bool showTable;

  const PageSkeleton({
    super.key,
    this.showHeader = true,
    this.kpiCount = 4,
    this.showTable = true,
  });

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      physics: const NeverScrollableScrollPhysics(),
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (showHeader) ...[
            const ShimmerLoader(width: 160, height: 28),
            const SizedBox(height: 8),
            const ShimmerLoader(width: 240, height: 14),
            const SizedBox(height: 24),
          ],
          GridView.count(
            crossAxisCount: 2,
            crossAxisSpacing: 12,
            mainAxisSpacing: 12,
            childAspectRatio: 1.5,
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            children: List.generate(kpiCount, (_) => const ShimmerLoader(height: 90)),
          ),
          if (showTable) ...[
            const SizedBox(height: 24),
            const ShimmerLoader(height: 220, borderRadius: AppTheme.radiusCard),
          ],
        ],
      ),
    );
  }
}

/// Legacy alias used by existing screens.
class DashboardSkeleton extends StatelessWidget {
  const DashboardSkeleton({super.key});

  @override
  Widget build(BuildContext context) => const PageSkeleton();
}