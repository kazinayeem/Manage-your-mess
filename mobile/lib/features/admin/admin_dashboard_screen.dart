import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../app/theme/app_colors.dart';
import '../../core/widgets/kpi_card.dart';
import '../../core/widgets/shimmer_loader.dart';
import '../../core/widgets/error_view.dart';
import '../auth/auth_provider.dart';
import 'admin_provider.dart';

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
    final theme = Theme.of(context);
    final userName = authState.user?['name'] ?? 'Admin';

    return Scaffold(
      appBar: AppBar(
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              '${_getGreeting()}, $userName 👋',
              style: theme.textTheme.titleMedium?.copyWith(
                fontWeight: FontWeight.bold,
              ),
            ),
            Text(
              'Platform Administration',
              style: theme.textTheme.bodySmall?.copyWith(
                color: AppColors.textSecondaryLight,
              ),
            ),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.notifications_none_rounded),
            onPressed: () => context.push('/admin/audit-logs'),
          ),
          const SizedBox(width: 4),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () async => ref.invalidate(adminDashboardProvider),
        child: dashAsync.when(
          loading: () => const DashboardSkeleton(),
          error: (err, _) => ErrorView(
            message: err.toString(),
            onRetry: () => ref.invalidate(adminDashboardProvider),
          ),
          data: (data) {
            final totalUsers = data['totalUsers'] ?? 0;
            final totalMesses = data['totalMesses'] ?? 0;
            final pendingMesses = data['pendingMesses'] ?? 0;
            final activeSubscriptions = data['activeSubscriptions'] ?? 0;
            final pendingPayments = data['pendingPayments'] ?? 0;
            final totalRevenue = data['totalRevenue'] ?? 0;
            final recentUsers = (data['recentUsers'] as List?) ?? [];
            final recentMesses = (data['recentMesses'] as List?) ?? [];

            return SingleChildScrollView(
              physics: const AlwaysScrollableScrollPhysics(),
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Platform Overview Title
                  Text(
                    'Platform Overview',
                    style: theme.textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 12),

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
                        title: 'Total Users',
                        value: '$totalUsers',
                        icon: Icons.people_rounded,
                        color: const Color(0xFF4338CA),
                      ),
                      KPICard(
                        title: 'Total Messes',
                        value: '$totalMesses',
                        icon: Icons.home_work_rounded,
                        color: const Color(0xFF0F766E),
                      ),
                      KPICard(
                        title: 'Pending Approvals',
                        value: '$pendingMesses',
                        icon: Icons.pending_actions_rounded,
                        color: const Color(0xFFF59E0B),
                        subtitle: pendingMesses > 0
                            ? 'Needs review'
                            : null,
                      ),
                      KPICard(
                        title: 'Revenue',
                        value: '৳ ${_formatNumber(totalRevenue)}',
                        icon: Icons.attach_money_rounded,
                        color: const Color(0xFF10B981),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  GridView.count(
                    crossAxisCount: 2,
                    crossAxisSpacing: 12,
                    mainAxisSpacing: 12,
                    childAspectRatio: 1.35,
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    children: [
                      KPICard(
                        title: 'Active Subs',
                        value: '$activeSubscriptions',
                        icon: Icons.card_membership_rounded,
                        color: const Color(0xFF3B82F6),
                      ),
                      KPICard(
                        title: 'Pending Payments',
                        value: '$pendingPayments',
                        icon: Icons.payment_rounded,
                        color: pendingPayments > 0
                            ? const Color(0xFFEF4444)
                            : const Color(0xFF64748B),
                      ),
                    ],
                  ),
                  const SizedBox(height: 28),

                  // Quick Actions
                  Text(
                    'Quick Actions',
                    style: theme.textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 12),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      _AdminQuickAction(
                        icon: Icons.fact_check_rounded,
                        label: 'Approvals',
                        color: const Color(0xFFF59E0B),
                        badge: pendingMesses > 0
                            ? '$pendingMesses'
                            : null,
                        onTap: () => context.go('/admin/messes'),
                      ),
                      _AdminQuickAction(
                        icon: Icons.people_alt_rounded,
                        label: 'Users',
                        color: const Color(0xFF4338CA),
                        onTap: () => context.go('/admin/users'),
                      ),
                      _AdminQuickAction(
                        icon: Icons.payment_rounded,
                        label: 'Payments',
                        color: const Color(0xFF10B981),
                        badge: pendingPayments > 0
                            ? '$pendingPayments'
                            : null,
                        onTap: () => context.go('/admin/payments'),
                      ),
                      _AdminQuickAction(
                        icon: Icons.analytics_rounded,
                        label: 'Analytics',
                        color: const Color(0xFF3B82F6),
                        onTap: () => context.push('/admin/analytics'),
                      ),
                    ],
                  ),
                  const SizedBox(height: 28),

                  // Recent Users
                  if (recentUsers.isNotEmpty) ...[
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          'Recent Users',
                          style: theme.textTheme.titleMedium?.copyWith(
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        TextButton(
                          onPressed: () => context.go('/admin/users'),
                          child: const Text('View All'),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    ...recentUsers.take(3).map((user) => Card(
                          child: ListTile(
                            leading: CircleAvatar(
                              backgroundColor:
                                  AppColors.primary.withOpacity(0.12),
                              child: Text(
                                (user['name'] ?? 'U')
                                    .toString()
                                    .substring(0, 1)
                                    .toUpperCase(),
                                style: TextStyle(
                                  color: AppColors.primary,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                            ),
                            title: Text(user['name'] ?? 'Unknown',
                                style: theme.textTheme.titleSmall),
                            subtitle: Text(user['email'] ?? ''),
                            trailing: _RoleBadge(
                                role: user['role'] ?? 'MEMBER'),
                          ),
                        )),
                    const SizedBox(height: 20),
                  ],

                  // Recent Messes
                  if (recentMesses.isNotEmpty) ...[
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          'Recent Messes',
                          style: theme.textTheme.titleMedium?.copyWith(
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        TextButton(
                          onPressed: () => context.go('/admin/messes'),
                          child: const Text('View All'),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    ...recentMesses.take(3).map((mess) => Card(
                          child: ListTile(
                            leading: CircleAvatar(
                              backgroundColor:
                                  const Color(0xFF0F766E).withOpacity(0.12),
                              child: const Icon(Icons.home_work_outlined,
                                  color: Color(0xFF0F766E), size: 20),
                            ),
                            title: Text(mess['name'] ?? 'Unknown',
                                style: theme.textTheme.titleSmall),
                            subtitle: Text(
                              'Owner: ${mess['owner']?['name'] ?? '-'} • Members: ${mess['_count']?['members'] ?? 0}',
                            ),
                            trailing: _StatusBadge(
                                status: mess['status'] ?? 'ACTIVE'),
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
                width: 58,
                height: 58,
                decoration: BoxDecoration(
                  color: color.withOpacity(0.12),
                  borderRadius: BorderRadius.circular(16),
                ),
                child: Icon(icon, color: color, size: 26),
              ),
              if (badge != null)
                Positioned(
                  top: -4,
                  right: -4,
                  child: Container(
                    padding: const EdgeInsets.symmetric(
                        horizontal: 6, vertical: 2),
                    decoration: BoxDecoration(
                      color: AppColors.error,
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: Text(
                      badge!,
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 10,
                        fontWeight: FontWeight.bold,
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
                fontSize: 12, fontWeight: FontWeight.w600),
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
    Color badgeColor;
    switch (role) {
      case 'SUPER_ADMIN':
        badgeColor = const Color(0xFFEF4444);
        break;
      case 'ADMIN':
        badgeColor = const Color(0xFFF59E0B);
        break;
      case 'MESS_OWNER':
        badgeColor = const Color(0xFF4338CA);
        break;
      case 'MESS_MANAGER':
        badgeColor = const Color(0xFF0F766E);
        break;
      default:
        badgeColor = const Color(0xFF64748B);
    }
    final display = role.replaceAll('_', ' ');

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: badgeColor.withOpacity(0.12),
        borderRadius: BorderRadius.circular(6),
      ),
      child: Text(
        display,
        style: TextStyle(
          color: badgeColor,
          fontSize: 10,
          fontWeight: FontWeight.w600,
        ),
      ),
    );
  }
}

class _StatusBadge extends StatelessWidget {
  final String status;
  const _StatusBadge({required this.status});

  @override
  Widget build(BuildContext context) {
    Color badgeColor;
    switch (status) {
      case 'ACTIVE':
        badgeColor = const Color(0xFF10B981);
        break;
      case 'PENDING':
        badgeColor = const Color(0xFFF59E0B);
        break;
      case 'SUSPENDED':
        badgeColor = const Color(0xFFEF4444);
        break;
      case 'REJECTED':
        badgeColor = const Color(0xFF64748B);
        break;
      default:
        badgeColor = const Color(0xFF94A3B8);
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: badgeColor.withOpacity(0.12),
        borderRadius: BorderRadius.circular(6),
      ),
      child: Text(
        status,
        style: TextStyle(
          color: badgeColor,
          fontSize: 10,
          fontWeight: FontWeight.w600,
        ),
      ),
    );
  }
}
