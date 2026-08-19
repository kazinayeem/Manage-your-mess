import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/localization/l10n.dart';
import '../../core/providers/global_providers.dart';
import '../../core/widgets/empty_view.dart';
import '../../core/widgets/error_view.dart';

final todayMealProvider = FutureProvider<Map<String, dynamic>>((ref) async {
  final dio = ref.read(dioClientProvider).dio;
  final response = await dio.get('/meals/today');
  if (response.data['success'] == true) {
    return response.data['data'] as Map<String, dynamic>;
  }
  throw Exception(response.data['message'] ?? 'Failed to load today meal');
});

class MealScreen extends ConsumerWidget {
  const MealScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = AppL10n.of(context);
    final mealAsync = ref.watch(todayMealProvider);
    final theme = Theme.of(context);

    return Scaffold(
      appBar: AppBar(
        title: Text(l10n.get('meals')),
      ),
      body: RefreshIndicator(
        onRefresh: () async => ref.invalidate(todayMealProvider),
        child: mealAsync.when(
          loading: () => const Center(child: CircularProgressIndicator()),
          error: (err, stack) => ErrorView(
            message: err.toString(),
            onRetry: () => ref.invalidate(todayMealProvider),
          ),
          data: (mealData) {
            final breakfast = mealData['breakfast'] ?? 0;
            final lunch = mealData['lunch'] ?? 0;
            final dinner = mealData['dinner'] ?? 0;
            final total = breakfast + lunch + dinner;
            final entries = (mealData['entries'] as List?) ?? [];

            return SingleChildScrollView(
              physics: const AlwaysScrollableScrollPhysics(),
              padding: const EdgeInsets.all(16.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Summary Card
                  Card(
                    child: Padding(
                      padding: const EdgeInsets.all(20.0),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            l10n.get('today_meals'),
                            style: theme.textTheme.titleMedium?.copyWith(
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          const SizedBox(height: 16),
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceAround,
                            children: [
                              _MealCounter(
                                label: l10n.get('breakfast'),
                                count: '$breakfast',
                                icon: Icons.free_breakfast_outlined,
                              ),
                              _MealCounter(
                                label: l10n.get('lunch'),
                                count: '$lunch',
                                icon: Icons.lunch_dining_outlined,
                              ),
                              _MealCounter(
                                label: l10n.get('dinner'),
                                count: '$dinner',
                                icon: Icons.dinner_dining_outlined,
                              ),
                            ],
                          ),
                          const Divider(height: 32),
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Text(
                                '${l10n.get('total')}:',
                                style: theme.textTheme.titleMedium,
                              ),
                              Text(
                                '$total',
                                style: theme.textTheme.headlineMedium?.copyWith(
                                  color: theme.primaryColor,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: 24),

                  Text(
                    'Member Meal Breakdown',
                    style: theme.textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 12),

                  if (entries.isEmpty)
                    const EmptyView(
                      title: 'No Meal Entries Today',
                      subtitle: 'Add meal entries for mess members',
                      icon: Icons.flatware_outlined,
                    )
                  else
                    ListView.separated(
                      shrinkWrap: true,
                      physics: const NeverScrollableScrollPhysics(),
                      itemCount: entries.length,
                      separatorBuilder: (_, __) => const SizedBox(height: 8),
                      itemBuilder: (context, index) {
                        final entry = entries[index];
                        final memberName = entry['member']?['user']?['name'] ?? 'Member';
                        final b = entry['breakfast'] ?? 0;
                        final l = entry['lunch'] ?? 0;
                        final d = entry['dinner'] ?? 0;

                        return Card(
                          child: ListTile(
                            title: Text(memberName, style: theme.textTheme.titleSmall),
                            subtitle: Text('Breakfast: $b  |  Lunch: $l  |  Dinner: $d'),
                            trailing: CircleAvatar(
                              radius: 16,
                              backgroundColor: theme.primaryColor.withOpacity(0.12),
                              child: Text(
                                '${b + l + d}',
                                style: TextStyle(
                                  color: theme.primaryColor,
                                  fontWeight: FontWeight.bold,
                                  fontSize: 12,
                                ),
                              ),
                            ),
                          ),
                        );
                      },
                    ),
                ],
              ),
            );
          },
        ),
      ),
    );
  }
}

class _MealCounter extends StatelessWidget {
  final String label;
  final String count;
  final IconData icon;

  const _MealCounter({
    required this.label,
    required this.count,
    required this.icon,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Column(
      children: [
        Icon(icon, size: 28, color: theme.primaryColor),
        const SizedBox(height: 6),
        Text(count, style: theme.textTheme.titleLarge?.copyWith(fontWeight: FontWeight.bold)),
        const SizedBox(height: 2),
        Text(label, style: theme.textTheme.bodySmall),
      ],
    );
  }
}
