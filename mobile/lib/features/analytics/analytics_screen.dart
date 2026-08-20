import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:fl_chart/fl_chart.dart';
import '../../app/theme/app_colors.dart';
import '../../core/localization/l10n.dart';
import '../../core/providers/global_providers.dart';
import '../../core/widgets/app_card.dart';
import '../../core/widgets/app_error_state.dart';
import '../../core/widgets/app_loading_state.dart';
import '../../core/widgets/app_empty_state.dart';

final expenseTrendProvider = FutureProvider<List<dynamic>>((ref) async {
  final dio = ref.read(dioClientProvider).dio;
  final response = await dio.get('/analytics/expense-trend');
  if (response.data['success'] == true) {
    return (response.data['data'] as List?) ?? [];
  }
  return [];
});

class AnalyticsScreen extends ConsumerWidget {
  const AnalyticsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = AppL10n.of(context);
    final trendAsync = ref.watch(expenseTrendProvider);

    return Scaffold(
      appBar: AppBar(
        titleSpacing: 0,
        title: Text(l10n.get('analytics')),
        leading: BackButton(
          onPressed: () => Navigator.of(context).maybePop(),
          color: AppColors.textPrimaryLight,
        ),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Expense Breakdown & Trend',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.w600,
                color: AppColors.textPrimaryLight,
                letterSpacing: -0.2,
              ),
            ),
            const SizedBox(height: 16),
            AppCard(
              padding: const EdgeInsets.all(20),
              child: SizedBox(
                height: 240,
                child: trendAsync.when(
                  loading: () => const AppLoadingState(),
                  error: (e, s) => AppErrorState(message: e.toString()),
                  data: (expenses) {
                    if (expenses.isEmpty) {
                      return const AppEmptyState(
                        title: 'No Expense Data',
                        subtitle: 'Add expenses to see the trend chart',
                        icon: Icons.show_chart_rounded,
                      );
                    }

                    final spots = <FlSpot>[];
                    for (int i = 0; i < expenses.length && i < 7; i++) {
                      final amt = (expenses[i]['amount'] as num?)?.toDouble() ?? 0;
                      spots.add(FlSpot(i.toDouble(), amt));
                    }

                    final maxY = spots.fold<double>(
                          0,
                          (acc, s) => s.y > acc ? s.y : acc,
                        ) +
                        50;

                    return LineChart(
                      LineChartData(
                        minY: 0,
                        maxY: maxY,
                        gridData: FlGridData(
                          show: true,
                          drawVerticalLine: false,
                          horizontalInterval: (maxY / 4).clamp(1, double.infinity),
                          getDrawingHorizontalLine: (value) =>
                              FlLine(color: AppColors.borderLight, strokeWidth: 1),
                        ),
                        titlesData: const FlTitlesData(
                          rightTitles: AxisTitles(sideTitles: SideTitles(showTitles: false)),
                          topTitles: AxisTitles(sideTitles: SideTitles(showTitles: false)),
                          leftTitles: AxisTitles(
                            sideTitles: SideTitles(
                              showTitles: true,
                              reservedSize: 40,
                              getTitlesWidget: (value, meta) => Text(
                                value.toInt().toString(),
                                style: const TextStyle(
                                  fontSize: 10,
                                  color: AppColors.textFaintLight,
                                ),
                              ),
                            ),
                          ),
                          bottomTitles: AxisTitles(
                            sideTitles: SideTitles(
                              showTitles: true,
                              reservedSize: 28,
                              getTitlesWidget: (value, meta) {
                                final idx = value.toInt();
                                if (idx < 0 || idx >= expenses.length) {
                                  return const SizedBox.shrink();
                                }
                                final dateStr = expenses[idx]['date']?.toString() ?? '';
                                final label = dateStr.length >= 10
                                    ? dateStr.substring(5, 10)
                                    : '${idx + 1}';
                                return Padding(
                                  padding: const EdgeInsets.only(top: 6),
                                  child: Text(
                                    label,
                                    style: const TextStyle(
                                      fontSize: 10,
                                      color: AppColors.textFaintLight,
                                    ),
                                  ),
                                );
                              },
                            ),
                          ),
                        ),
                        borderData: FlBorderData(show: false),
                        lineBarsData: [
                          LineChartBarData(
                            spots: spots,
                            isCurved: true,
                            color: AppColors.primary,
                            barWidth: 2.5,
                            dotData: const FlDotData(show: false),
                            belowBarData: BarAreaData(
                              show: true,
                              color: AppColors.primary.withOpacity(0.12),
                            ),
                          ),
                        ],
                      ),
                    );
                  },
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}