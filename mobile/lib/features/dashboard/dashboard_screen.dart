import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../app/theme/app_colors.dart';
import '../../app/theme/app_radius.dart';
import '../../core/localization/l10n.dart';
import '../../core/widgets/app_badge.dart';
import '../../core/widgets/app_button.dart';
import '../../core/widgets/app_card.dart';
import '../../core/widgets/app_empty_state.dart';
import '../../core/widgets/app_error_state.dart';
import '../../core/widgets/app_icon_button.dart';
import '../../core/widgets/app_loading_state.dart';
import '../../core/widgets/kpi_card.dart';
import '../auth/auth_provider.dart';
import 'dashboard_provider.dart';
import 'portal_messes_provider.dart';

class DashboardScreen extends ConsumerWidget {
  const DashboardScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = AppL10n.of(context);
    final authState = ref.watch(authProvider);
    final portalAsync = ref.watch(portalMessesProvider);
    final dashboardAsync = ref.watch(dashboardAnalyticsProvider);
    final theme = Theme.of(context);

    final userName = authState.user?['name'] ?? 'there';
    final firstName = userName.split(' ').first;

    return Scaffold(
      appBar: AppBar(
        titleSpacing: 16,
        title: const Text(
          'Portal Dashboard',
          style: TextStyle(fontSize: 17, fontWeight: FontWeight.w600),
        ),
        actions: [
          AppIconButton(
            icon: Icons.notifications_none_rounded,
            color: AppColors.textSecondaryLight,
            onPressed: () => context.push('/notifications'),
            tooltip: l10n.get('notifications'),
          ),
          const SizedBox(width: 16),
        ],
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(1),
          child: Container(
            height: 1,
            color: theme.brightness == Brightness.dark
                ? AppColors.borderDark
                : AppColors.borderLight,
          ),
        ),
      ),
      body: RefreshIndicator(
        onRefresh: () async {
          ref.invalidate(portalMessesProvider);
          ref.invalidate(dashboardAnalyticsProvider);
        },
        child: portalAsync.when(
          loading: () => const AppLoadingState(),
          error: (err, stack) => AppErrorState(
            message: err.toString(),
            onRetry: () => ref.invalidate(portalMessesProvider),
          ),
          data: (messes) {
            return SingleChildScrollView(
              physics: const AlwaysScrollableScrollPhysics(),
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _buildHelloCard(context, l10n, firstName, messes.length),
                  const SizedBox(height: 24),
                  Text(
                    l10n.get('my_messes'),
                    style: const TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.w600,
                      color: AppColors.textPrimaryLight,
                      letterSpacing: -0.2,
                    ),
                  ),
                  const SizedBox(height: 12),
                  if (messes.isEmpty)
                    AppCard(
                      padding: const EdgeInsets.all(32),
                      child: AppEmptyState(
                        title: l10n.get('no_messes'),
                        subtitle: l10n.get('empty_hint'),
                        icon: Icons.home_work_outlined,
                      ),
                    )
                  else
                    ...messes.map(
                      (mess) => Padding(
                        padding: const EdgeInsets.only(bottom: 12),
                        child: _MessCard(mess: mess),
                      ),
                    ),
                  const SizedBox(height: 16),
                  if (authState.activeMessId != null) ...[
                    _buildOverview(context, ref, l10n, dashboardAsync),
                    const SizedBox(height: 16),
                    _buildRecentActivity(context, ref, l10n, dashboardAsync),
                  ],
                ],
              ),
            );
          },
        ),
      ),
    );
  }

  Widget _buildHelloCard(
    BuildContext context,
    AppL10n l10n,
    String firstName,
    int messCount,
  ) {
    return AppCard(
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            '${l10n.get('hello')},',
            style: const TextStyle(
              fontSize: 24,
              fontWeight: FontWeight.w700,
              color: AppColors.textPrimaryLight,
              letterSpacing: -0.3,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            messCount == 0
                ? l10n.get('no_messes')
                : '${l10n.get('member_of').replaceFirst('{count}', '$messCount')}',
            style: const TextStyle(
              fontSize: 14,
              color: AppColors.textSecondaryLight,
            ),
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              Expanded(
                child: AppButton(
                  text: l10n.get('create_new_mess'),
                  icon: Icons.add_circle_outline_rounded,
                  onPressed: () => context.push('/create-mess'),
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: AppButton(
                  text: l10n.get('join_existing_mess'),
                  variant: AppButtonVariant.outline,
                  icon: Icons.group_add_outlined,
                  onPressed: () => context.push('/join-mess'),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildOverview(
    BuildContext context,
    WidgetRef ref,
    AppL10n l10n,
    AsyncValue<Map<String, dynamic>> dashboardAsync,
  ) {
    return dashboardAsync.when(
      loading: () => const AppLoadingState(cardCount: 2),
      error: (err, stack) => const SizedBox.shrink(),
      data: (data) {
        final mealRate = data['mealRate'] ?? 0.0;
        final totalExpense = data['totalExpense'] ?? 0.0;
        final totalDeposit = data['totalDeposit'] ?? 0.0;
        final totalDues = data['totalDues'] ?? 0.0;

        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              l10n.get('quick_actions'),
              style: const TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.w600,
                color: AppColors.textPrimaryLight,
                letterSpacing: -0.2,
              ),
            ),
            const SizedBox(height: 12),
            GridView.count(
              crossAxisCount: 2,
              crossAxisSpacing: 12,
              mainAxisSpacing: 12,
              childAspectRatio: 1.4,
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              children: [
                KPICard(
                  title: l10n.get('meal_rate'),
                  value: '৳ $mealRate',
                  icon: Icons.restaurant_menu_rounded,
                  color: AppColors.primary,
                ),
                KPICard(
                  title: l10n.get('my_deposit'),
                  value: '৳ ${totalDeposit.toStringAsFixed(0)}',
                  icon: Icons.account_balance_wallet_outlined,
                  color: AppColors.success,
                ),
                KPICard(
                  title: l10n.get('my_due'),
                  value: '৳ ${totalDues.toStringAsFixed(0)}',
                  icon: Icons.warning_amber_rounded,
                  color: AppColors.warning,
                ),
                KPICard(
                  title: l10n.get('monthly_expense'),
                  value: '৳ ${totalExpense.toStringAsFixed(0)}',
                  icon: Icons.receipt_long_outlined,
                  color: AppColors.info,
                ),
              ],
            ),
          ],
        );
      },
    );
  }

  Widget _buildRecentActivity(
    BuildContext context,
    WidgetRef ref,
    AppL10n l10n,
    AsyncValue<Map<String, dynamic>> dashboardAsync,
  ) {
    return dashboardAsync.when(
      loading: () => const SizedBox.shrink(),
      error: (err, stack) => const SizedBox.shrink(),
      data: (data) {
        final recentExpenses = (data['recentExpenses'] as List?) ?? [];

        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  l10n.get('recent_activity'),
                  style: const TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.w600,
                    color: AppColors.textPrimaryLight,
                    letterSpacing: -0.2,
                  ),
                ),
                TextButton(
                  onPressed: () => context.push('/expenses'),
                  child: const Text(
                    'View All',
                    style: TextStyle(fontSize: 13, color: AppColors.primary),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 8),
            if (recentExpenses.isEmpty)
              AppCard(
                padding: const EdgeInsets.all(20),
                child: Center(
                  child: Text(
                    l10n.get('no_recent_activity'),
                    style: const TextStyle(
                      fontSize: 13,
                      color: AppColors.textSecondaryLight,
                    ),
                  ),
                ),
              )
            else
              ...recentExpenses.take(5).map((item) {
                final category = item['category']?['name'] ?? 'General';
                final amount = item['amount'] ?? 0;
                final desc = item['description'] ?? category;

                return Padding(
                  padding: const EdgeInsets.only(bottom: 8),
                  child: AppCard(
                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                    child: Row(
                      children: [
                        Container(
                          width: 38,
                          height: 38,
                          decoration: BoxDecoration(
                            color: AppColors.primarySoft,
                            borderRadius: BorderRadius.circular(AppRadius.md),
                          ),
                          child: const Icon(
                            Icons.shopping_basket_outlined,
                            color: AppColors.primary,
                            size: 18,
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                desc,
                                style: const TextStyle(
                                  fontSize: 14,
                                  fontWeight: FontWeight.w500,
                                  color: AppColors.textPrimaryLight,
                                ),
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                              ),
                              const SizedBox(height: 2),
                              Text(
                                category,
                                style: const TextStyle(
                                  fontSize: 12,
                                  color: AppColors.textSecondaryLight,
                                ),
                              ),
                            ],
                          ),
                        ),
                        Text(
                          '৳ $amount',
                          style: const TextStyle(
                            fontSize: 15,
                            fontWeight: FontWeight.w600,
                            color: AppColors.error,
                          ),
                        ),
                      ],
                    ),
                  ),
                );
              }),
          ],
        );
      },
    );
  }
}

class _MessCard extends StatelessWidget {
  final PortalMess mess;

  const _MessCard({required this.mess});

  @override
  Widget build(BuildContext context) {
    final l10n = AppL10n.of(context);

    return AppCard(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                width: 44,
                height: 44,
                decoration: BoxDecoration(
                  color: AppColors.primarySurface,
                  borderRadius: BorderRadius.circular(AppRadius.lg),
                ),
                child: const Icon(
                  Icons.home_work_outlined,
                  color: AppColors.primaryDark,
                  size: 22,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      mess.name,
                      style: const TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w600,
                        color: AppColors.textPrimaryLight,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 2),
                    Text(
                      '${l10n.get('role')}: ${mess.role.replaceAll('_', ' ')}',
                      style: const TextStyle(
                        fontSize: 13,
                        color: AppColors.textSecondaryLight,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              _InfoCell(
                label: l10n.get('members'),
                value: '${mess.memberCount ?? '—'}',
              ),
              _InfoCell(label: l10n.get('plan'), value: mess.plan ?? '—'),
              _InfoCell(
                label: l10n.get('month'),
                value: mess.currentMonth ?? '—',
              ),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'Status',
                      style: TextStyle(
                        fontSize: 12,
                        color: AppColors.textSecondaryLight,
                      ),
                    ),
                    const SizedBox(height: 4),
                    AppBadge(
                      text: mess.isActive ? 'Active' : 'Pending',
                      variant: mess.isActive
                          ? AppBadgeVariant.default_
                          : AppBadgeVariant.secondary,
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          if (mess.lastActivity != null) ...[
            Text(
              'Last activity ${_relativeTime(mess.lastActivity!)}',
              style: const TextStyle(
                fontSize: 12,
                color: AppColors.textFaintLight,
              ),
            ),
            const SizedBox(height: 12),
          ],
          AppButton(
            text: l10n.get('open_mess'),
            icon: Icons.arrow_forward_rounded,
            onPressed: () => context.push('/mess/${mess.id}'),
          ),
        ],
      ),
    );
  }

  String _relativeTime(DateTime time) {
    final diff = DateTime.now().difference(time);
    if (diff.inMinutes < 1) return 'just now';
    if (diff.inHours < 1) return '${diff.inMinutes}m ago';
    if (diff.inDays < 1) return '${diff.inHours}h ago';
    if (diff.inDays < 7) return '${diff.inDays}d ago';
    return '${time.day}/${time.month}/${time.year}';
  }
}

class _InfoCell extends StatelessWidget {
  final String label;
  final String value;

  const _InfoCell({required this.label, required this.value});

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            label,
            style: const TextStyle(
              fontSize: 12,
              color: AppColors.textSecondaryLight,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            value,
            style: const TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.w500,
              color: AppColors.textPrimaryLight,
            ),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
        ],
      ),
    );
  }
}