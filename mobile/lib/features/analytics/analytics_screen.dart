import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:fl_chart/fl_chart.dart';
import '../../core/localization/l10n.dart';
import '../../core/providers/global_providers.dart';
import '../../core/widgets/error_view.dart';

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
    final theme = Theme.of(context);

    return Scaffold(
      appBar: AppBar(
        title: Text(l10n.get('analytics')),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Expense Breakdown & Trend',
              style: theme.textTheme.titleMedium?.copyWith(
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 16),
            Card(
              child: Padding(
                padding: const EdgeInsets.all(20.0),
                child: SizedBox(
                  height: 240,
                  child: trendAsync.when(
                    loading: () => const Center(child: CircularProgressIndicator()),
                    error: (e, s) => ErrorView(message: e.toString()),
                    data: (expenses) {
                      if (expenses.isEmpty) {
                        return const Center(child: Text('No expense data available for charts'));
                      }

                      final spots = <FlSpot>[];
                      for (int i = 0; i < expenses.length && i < 7; i++) {
                        final amt = (expenses[i]['amount'] as num?)?.toDouble() ?? 0;
                        spots.add(FlSpot(i.toDouble(), amt));
                      }

                      return LineChart(
                        LineChartData(
                          gridData: const FlGridData(show: false),
                          titlesData: const FlTitlesData(
                            rightTitles: AxisTitles(sideTitles: SideTitles(showTitles: false)),
                            topTitles: AxisTitles(sideTitles: SideTitles(showTitles: false)),
                          ),
                          borderData: FlBorderData(show: false),
                          lineBarsData: [
                            LineChartBarData(
                              spots: spots,
                              isCurved: true,
                              color: theme.primaryColor,
                              barWidth: 3,
                              belowBarData: BarAreaData(
                                show: true,
                                color: theme.primaryColor.withOpacity(0.15),
                              ),
                            ),
                          ],
                        ),
                      );
                    },
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
