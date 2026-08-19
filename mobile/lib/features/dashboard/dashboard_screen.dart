import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../app/theme/app_colors.dart';
import '../../core/localization/l10n.dart';
import '../../core/widgets/kpi_card.dart';
import '../../core/widgets/shimmer_loader.dart';
import '../../core/widgets/error_view.dart';
import '../auth/auth_provider.dart';
import 'dashboard_provider.dart';

class DashboardScreen extends ConsumerWidget {
  const DashboardScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = AppL10n.of(context);
    final authState = ref.watch(authProvider);
    final dashboardAsync = ref.watch(dashboardAnalyticsProvider);
    final theme = Theme.of(context);

    final userName = authState.user?['name'] ?? 'User';

    return Scaffold(
      appBar: AppBar(
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              '${l10n.get('good_morning')}, $userName 👋',
              style: theme.textTheme.titleMedium?.copyWith(
                fontWeight: FontWeight.bold,
              ),
            ),
            Text(
              authState.messes.isNotEmpty
                  ? (authState.messes.first['name'] ?? 'My Mess')
                  : 'BornoMess Manager',
              style: theme.textTheme.bodySmall,
            ),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.notifications_none_rounded),
            onPressed: () => context.push('/notifications'),
          ),
          const SizedBox(width: 8),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () async {
          ref.invalidate(dashboardAnalyticsProvider);
        },
        child: dashboardAsync.when(
          loading: () => const DashboardSkeleton(),
          error: (err, stack) => ErrorView(
            message: err.toString(),
            onRetry: () => ref.invalidate(dashboardAnalyticsProvider),
          ),
          data: (data) {
            final mealRate = data['mealRate'] ?? 0.0;
            final totalExpense = data['totalExpense'] ?? 0.0;
            final totalDeposit = data['totalDeposit'] ?? 0.0;
            final totalDues = data['totalDues'] ?? 0.0;
            final recentExpenses = (data['recentExpenses'] as List?) ?? [];

            return SingleChildScrollView(
              physics: const AlwaysScrollableScrollPhysics(),
              padding: const EdgeInsets.all(16.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // KPI Grid
                  GridView.count(
                    crossAxisCount: 2,
                    crossAxisSpacing: 12,
                    mainAxisSpacing: 12,
                    childAspectRatio: 1.35,
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    children: [
                      KPICard(
                        title: l10n.get('meal_rate'),
                        value: '৳ $mealRate',
                        icon: Icons.restaurant_menu_rounded,
                        color: const Color(0xFF0F766E),
                      ),
                      KPICard(
                        title: l10n.get('my_deposit'),
                        value: '৳ ${totalDeposit.toStringAsFixed(0)}',
                        icon: Icons.account_balance_wallet_outlined,
                        color: const Color(0xFF10B981),
                      ),
                      KPICard(
                        title: l10n.get('my_due'),
                        value: '৳ ${totalDues.toStringAsFixed(0)}',
                        icon: Icons.warning_amber_rounded,
                        color: const Color(0xFFEF4444),
                      ),
                      KPICard(
                        title: l10n.get('monthly_expense'),
                        value: '৳ ${totalExpense.toStringAsFixed(0)}',
                        icon: Icons.receipt_long_outlined,
                        color: const Color(0xFF4338CA),
                      ),
                    ],
                  ),
                  const SizedBox(height: 24),

                  // Quick Actions
                  Text(
                    l10n.get('quick_actions'),
                    style: theme.textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 12),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      _QuickActionButton(
                        icon: Icons.flatware_rounded,
                        label: 'Meal',
                        color: const Color(0xFF0F766E),
                        onTap: () => context.push('/meals'),
                      ),
                      _QuickActionButton(
                        icon: Icons.add_shopping_cart_rounded,
                        label: 'Expense',
                        color: const Color(0xFF4338CA),
                        onTap: () => context.push('/expenses'),
                      ),
                      _QuickActionButton(
                        icon: Icons.add_card_rounded,
                        label: 'Deposit',
                        color: const Color(0xFF10B981),
                        onTap: () => context.push('/deposits'),
                      ),
                      _QuickActionButton(
                        icon: Icons.shopping_bag_outlined,
                        label: 'Bazaar',
                        color: const Color(0xFFF59E0B),
                        onTap: () => context.push('/bazaar'),
                      ),
                    ],
                  ),
                  const SizedBox(height: 28),

                  // Recent Expenses Activity
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        l10n.get('recent_activity'),
                        style: theme.textTheme.titleMedium?.copyWith(
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      TextButton(
                        onPressed: () => context.push('/expenses'),
                        child: const Text('View All'),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),

                  if (recentExpenses.isEmpty)
                    Card(
                      child: Padding(
                        padding: const EdgeInsets.all(24.0),
                        child: Center(
                          child: Text(
                            'No recent expense activity',
                            style: theme.textTheme.bodySmall,
                          ),
                        ),
                      ),
                    )
                  else
                    ListView.separated(
                      shrinkWrap: true,
                      physics: const NeverScrollableScrollPhysics(),
                      itemCount: recentExpenses.length,
                      separatorBuilder: (_, __) => const SizedBox(height: 8),
                      itemBuilder: (context, index) {
                        final item = recentExpenses[index];
                        final category = item['category']?['name'] ?? 'General';
                        final amount = item['amount'] ?? 0;
                        final desc = item['description'] ?? category;

                        return Card(
                          child: ListTile(
                            leading: CircleAvatar(
                              backgroundColor: theme.primaryColor.withOpacity(0.1),
                              child: Icon(
                                Icons.shopping_basket_outlined,
                                color: theme.primaryColor,
                                size: 20,
                              ),
                            ),
                            title: Text(
                              desc,
                              style: theme.textTheme.titleSmall,
                            ),
                            subtitle: Text(category),
                            trailing: Text(
                              '৳ $amount',
                              style: theme.textTheme.titleMedium?.copyWith(
                                fontWeight: FontWeight.bold,
                                color: AppColors.error,
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

class _QuickActionButton extends StatelessWidget {
  final IconData icon;
  final String label;
  final Color color;
  final VoidCallback onTap;

  const _QuickActionButton({
    required this.icon,
    required this.label,
    required this.color,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Column(
        children: [
          Container(
            width: 58,
            height: 58,
            decoration: BoxDecoration(
              color: color.withOpacity(0.12),
              borderRadius: BorderRadius.circular(16),
            ),
            child: Icon(icon, color: color, size: 26),
          ),
          const SizedBox(height: 6),
          Text(
            label,
            style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600),
          ),
        ],
      ),
    );
  }
}
