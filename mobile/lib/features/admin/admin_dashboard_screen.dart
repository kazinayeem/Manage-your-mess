import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../app/theme/app_colors.dart';
import '../../app/theme/app_radius.dart';
import '../../core/widgets/app_badge.dart';
import '../../core/widgets/app_card.dart';
import '../../core/widgets/app_error_state.dart';
import '../../core/widgets/app_icon_button.dart';
import '../../core/widgets/app_loading_state.dart';
import '../../core/widgets/kpi_card.dart';
import '../auth/auth_provider.dart';
import 'admin_provider.dart';
import 'widgets/admin_drawer.dart';

class AdminDashboardScreen extends ConsumerWidget {
  const AdminDashboardScreen({super.key});

  String _getGreeting() {
    final hour = DateTime.now().hour;
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final authState = ref.watch(authProvider);
    final dashAsync = ref.watch(adminDashboardProvider);
    final userName = authState.user?['name'] ?? 'Super Admin';

    return Scaffold(
      drawer: const AdminDrawer(currentRoute: '/admin'),
      appBar: AppBar(
        titleSpacing: 16,
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              '${_getGreeting()}, $userName',
              style: const TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w600,
                color: AppColors.textPrimaryLight,
              ),
            ),
            const Text(
              'Super Admin Overview',
              style: TextStyle(
                fontSize: 12,
                color: AppColors.textSecondaryLight,
              ),
            ),
          ],
        ),
        actions: [
          AppIconButton(
            icon: Icons.notifications_none_rounded,
            color: AppColors.textSecondaryLight,
            onPressed: () {},
            tooltip: 'Notifications',
          ),
          const SizedBox(width: 16),
        ],
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(1),
          child: Container(
            height: 1,
            color: Theme.of(context).brightness == Brightness.dark
                ? AppColors.borderDark
                : AppColors.borderLight,
          ),
        ),
      ),
      body: RefreshIndicator(
        onRefresh: () async => ref.invalidate(adminDashboardProvider),
        child: dashAsync.when(
          loading: () => const AppLoadingState(),
          error: (err, _) => AppErrorState(
            message: err.toString(),
            onRetry: () => ref.invalidate(adminDashboardProvider),
          ),
          data: (data) {
            final totalUsers = data['totalUsers'] ?? 0;
            final activeUsers = data['activeUsers'] ?? totalUsers;
            final totalMesses = data['totalMesses'] ?? 0;
            final totalBranches = data['totalBranches'] ?? 0;
            final totalMembers = data['totalMembers'] ?? 0;
            final monthlyRevenue = data['monthlyRevenue'] ?? 0;
            final annualRevenue = data['annualRevenue'] ?? 0;
            final activeSubscriptions = data['activeSubscriptions'] ?? 0;
            final expiredSubscriptions = data['expiredSubscriptions'] ?? 0;
            final trialAccounts = data['trialAccounts'] ?? 0;
            final pendingPayments = data['pendingPayments'] ?? 0;
            final approvedPayments = data['approvedPayments'] ?? 0;
            final rejectedPayments = data['rejectedPayments'] ?? 0;

            final recentUsers = (data['recentUsers'] as List?) ?? [];
            final recentMesses = (data['recentMesses'] as List?) ?? [];

            return SingleChildScrollView(
              physics: const AlwaysScrollableScrollPhysics(),
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Platform Metrics',
                    style: TextStyle(
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
                        title: 'Total Users',
                        value: '$totalUsers',
                        icon: Icons.people_rounded,
                        color: AppColors.primary,
                      ),
                      KPICard(
                        title: 'Active Users (30d)',
                        value: '$activeUsers',
                        icon: Icons.person_outline_rounded,
                        color: AppColors.success,
                      ),
                      KPICard(
                        title: 'Total Messes',
                        value: '$totalMesses',
                        icon: Icons.home_work_rounded,
                        color: AppColors.info,
                      ),
                      KPICard(
                        title: 'Total Branches',
                        value: '$totalBranches',
                        icon: Icons.account_tree_rounded,
                        color: AppColors.warning,
                      ),
                      KPICard(
                        title: 'Total Members',
                        value: '$totalMembers',
                        icon: Icons.groups_rounded,
                        color: AppColors.primaryDark,
                      ),
                      KPICard(
                        title: 'Monthly Revenue',
                        value: '৳ ${_formatNumber(monthlyRevenue)}',
                        icon: Icons.monetization_on_rounded,
                        color: AppColors.success,
                      ),
                      KPICard(
                        title: 'Annual Revenue',
                        value: '৳ ${_formatNumber(annualRevenue)}',
                        icon: Icons.attach_money_rounded,
                        color: AppColors.primary,
                      ),
                      KPICard(
                        title: 'Active Subs',
                        value: '$activeSubscriptions',
                        icon: Icons.card_membership_rounded,
                        color: AppColors.info,
                      ),
                      KPICard(
                        title: 'Expired Subs',
                        value: '$expiredSubscriptions',
                        icon: Icons.timer_off_rounded,
                        color: AppColors.textSecondaryLight,
                      ),
                      KPICard(
                        title: 'Trial Accounts',
                        value: '$trialAccounts',
                        icon: Icons.hourglass_top_rounded,
                        color: AppColors.warning,
                      ),
                      KPICard(
                        title: 'Pending Payments',
                        value: '$pendingPayments',
                        icon: Icons.pending_actions_rounded,
                        color: pendingPayments > 0
                            ? AppColors.warning
                            : AppColors.textSecondaryLight,
                      ),
                      KPICard(
                        title: 'Approved Payments',
                        value: '$approvedPayments',
                        icon: Icons.check_circle_rounded,
                        color: AppColors.success,
                      ),
                      KPICard(
                        title: 'Rejected Payments',
                        value: '$rejectedPayments',
                        icon: Icons.cancel_rounded,
                        color: AppColors.error,
                      ),
                    ],
                  ),
                  const SizedBox(height: 24),

                  const Text(
                    'Quick Links',
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.w600,
                      color: AppColors.textPrimaryLight,
                      letterSpacing: -0.2,
                    ),
                  ),
                  const SizedBox(height: 12),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      _AdminQuickAction(
                        icon: Icons.people_alt_rounded,
                        label: 'Users',
                        color: AppColors.primary,
                        onTap: () => context.go('/admin/users'),
                      ),
                      _AdminQuickAction(
                        icon: Icons.home_work_rounded,
                        label: 'Messes',
                        color: AppColors.success,
                        onTap: () => context.go('/admin/messes'),
                      ),
                      _AdminQuickAction(
                        icon: Icons.payment_rounded,
                        label: 'Payments',
                        color: AppColors.info,
                        badge: pendingPayments > 0 ? '$pendingPayments' : null,
                        onTap: () => context.go('/admin/payments'),
                      ),
                      _AdminQuickAction(
                        icon: Icons.analytics_rounded,
                        label: 'Analytics',
                        color: AppColors.warning,
                        onTap: () => context.go('/admin/analytics'),
                      ),
                    ],
                  ),
                  const SizedBox(height: 24),

                  if (recentUsers.isNotEmpty) ...[
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text(
                          'Recent Users',
                          style: TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.w600,
                            color: AppColors.textPrimaryLight,
                            letterSpacing: -0.2,
                          ),
                        ),
                        TextButton(
                          onPressed: () => context.go('/admin/users'),
                          child: const Text(
                            'View All',
                            style: TextStyle(fontSize: 13, color: AppColors.primary),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    ...recentUsers.take(3).map((user) => Padding(
                          padding: const EdgeInsets.only(bottom: 8),
                          child: AppCard(
                            padding:
                                const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                            child: Row(
                              children: [
                                Container(
                                  width: 38,
                                  height: 38,
                                  decoration: BoxDecoration(
                                    color: AppColors.primarySoft,
                                    borderRadius: BorderRadius.circular(AppRadius.lg),
                                  ),
                                  child: Center(
                                    child: Text(
                                      (user['name'] ?? 'U')
                                          .toString()
                                          .substring(0, 1)
                                          .toUpperCase(),
                                      style: const TextStyle(
                                        color: AppColors.primary,
                                        fontWeight: FontWeight.w700,
                                      ),
                                    ),
                                  ),
                                ),
                                const SizedBox(width: 12),
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Text(
                                        user['name'] ?? 'Unknown',
                                        style: const TextStyle(
                                          fontSize: 14,
                                          fontWeight: FontWeight.w500,
                                          color: AppColors.textPrimaryLight,
                                        ),
                                      ),
                                      const SizedBox(height: 2),
                                      Text(
                                        user['email'] ?? '',
                                        style: const TextStyle(
                                          fontSize: 12,
                                          color: AppColors.textSecondaryLight,
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                                _RoleBadge(role: user['role'] ?? 'MEMBER'),
                              ],
                            ),
                          ),
                        )),
                    const SizedBox(height: 12),
                  ],

                  if (recentMesses.isNotEmpty) ...[
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text(
                          'Recent Messes',
                          style: TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.w600,
                            color: AppColors.textPrimaryLight,
                            letterSpacing: -0.2,
                          ),
                        ),
                        TextButton(
                          onPressed: () => context.go('/admin/messes'),
                          child: const Text(
                            'View All',
                            style: TextStyle(fontSize: 13, color: AppColors.primary),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    ...recentMesses.take(3).map((mess) => Padding(
                          padding: const EdgeInsets.only(bottom: 8),
                          child: AppCard(
                            padding:
                                const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
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
                                    Icons.home_work_outlined,
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
                                        mess['name'] ?? 'Unknown',
                                        style: const TextStyle(
                                          fontSize: 14,
                                          fontWeight: FontWeight.w500,
                                          color: AppColors.textPrimaryLight,
                                        ),
                                      ),
                                      const SizedBox(height: 2),
                                      Text(
                                        'Owner: ${mess['owner']?['name'] ?? '-'} · Members: ${mess['_count']?['members'] ?? 0}',
                                        style: const TextStyle(
                                          fontSize: 12,
                                          color: AppColors.textSecondaryLight,
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                                _StatusBadge(status: mess['status'] ?? 'ACTIVE'),
                              ],
                            ),
                          ),
                        )),
                  ],
                ],
              ),
            );
          },
        ),
      ),
    );
  }

  String _formatNumber(dynamic number) {
    if (number is num) {
      if (number >= 1000000) {
        return '${(number / 1000000).toStringAsFixed(1)}M';
      }
      if (number >= 1000) {
        return '${(number / 1000).toStringAsFixed(1)}K';
      }
      return number.toStringAsFixed(0);
    }
    return '$number';
  }
}

class _AdminQuickAction extends StatelessWidget {
  final IconData icon;
  final String label;
  final Color color;
  final String? badge;
  final VoidCallback onTap;

  const _AdminQuickAction({
    required this.icon,
    required this.label,
    required this.color,
    required this.onTap,
    this.badge,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Column(
        children: [
          Stack(
            clipBehavior: Clip.none,
            children: [
              Container(
                width: 54,
                height: 54,
                decoration: BoxDecoration(
                  color: color.withOpacity(0.12),
                  borderRadius: BorderRadius.circular(AppRadius.xl),
                ),
                child: Icon(icon, color: color, size: 24),
              ),
              if (badge != null)
                Positioned(
                  top: -4,
                  right: -4,
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                    decoration: BoxDecoration(
                      color: AppColors.error,
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: Text(
                      badge!,
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 10,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ),
                ),
            ],
          ),
          const SizedBox(height: 6),
          Text(
            label,
            style: const TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w600,
              color: AppColors.textPrimaryLight,
            ),
          ),
        ],
      ),
    );
  }
}

class _RoleBadge extends StatelessWidget {
  final String role;
  const _RoleBadge({required this.role});

  @override
  Widget build(BuildContext context) {
    final (AppBadgeVariant variant, String text) = switch (role) {
      'SUPER_ADMIN' => (AppBadgeVariant.destructive, role.replaceAll('_', ' ')),
      'MESS_OWNER' => (AppBadgeVariant.info, 'Owner'),
      'MESS_MANAGER' => (AppBadgeVariant.success, 'Manager'),
      _ => (AppBadgeVariant.secondary, role.replaceAll('_', ' ')),
    };
    return AppBadge(text: text, variant: variant);
  }
}

class _StatusBadge extends StatelessWidget {
  final String status;
  const _StatusBadge({required this.status});

  @override
  Widget build(BuildContext context) {
    final variant = switch (status) {
      'ACTIVE' => AppBadgeVariant.success,
      'PENDING' => AppBadgeVariant.warning,
      'SUSPENDED' || 'REJECTED' => AppBadgeVariant.destructive,
      _ => AppBadgeVariant.secondary,
    };
    return AppBadge(text: status, variant: variant);
  }
}