import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../app/theme/app_colors.dart';
import '../../app/theme/app_radius.dart';
import '../../core/widgets/app_badge.dart';
import '../../core/widgets/app_card.dart';
import '../../core/widgets/app_empty_state.dart';
import '../../core/widgets/app_error_state.dart';
import '../../core/widgets/app_loading_state.dart';
import '../auth/auth_provider.dart';
import 'admin_provider.dart';
import 'widgets/admin_drawer.dart';

// ─── Shared helpers ───────────────────────────────────────────────────────────

class _AdminScaffold extends StatelessWidget {
  final String title;
  final String route;
  final Widget body;

  const _AdminScaffold({
    required this.title,
    required this.route,
    required this.body,
  });

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      drawer: AdminDrawer(currentRoute: route),
      appBar: AppBar(
        titleSpacing: 16,
        title: Text(title),
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
      body: body,
    );
  }
}

Widget _rowIcon(IconData icon, {Color? color}) {
  return Container(
    width: 38,
    height: 38,
    decoration: BoxDecoration(
      color: (color ?? AppColors.primary).withOpacity(0.12),
      borderRadius: BorderRadius.circular(AppRadius.md),
    ),
    child: Icon(icon, size: 18, color: color ?? AppColors.primary),
  );
}

class _InfoRow extends StatelessWidget {
  final String title;
  final String subtitle;
  final Widget? trailing;
  final IconData? icon;
  final Color? iconColor;

  const _InfoRow({
    required this.title,
    required this.subtitle,
    this.trailing,
    this.icon,
    this.iconColor,
  });

  @override
  Widget build(BuildContext context) {
    return AppCard(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      child: Row(
        children: [
          if (icon != null) ...[
            _rowIcon(icon!, color: iconColor),
            const SizedBox(width: 12),
          ],
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: const TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w500,
                    color: AppColors.textPrimaryLight,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                if (subtitle.isNotEmpty) ...[
                  const SizedBox(height: 2),
                  Text(
                    subtitle,
                    style: const TextStyle(
                      fontSize: 12,
                      color: AppColors.textSecondaryLight,
                    ),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                ],
              ],
            ),
          ),
          if (trailing != null) ...[
            const SizedBox(width: 8),
            trailing!,
          ],
        ],
      ),
    );
  }
}

AppBadgeVariant _statusVariant(String status) {
  switch (status) {
    case 'ACTIVE':
    case 'APPROVED':
    case 'COMPLETED':
      return AppBadgeVariant.success;
    case 'PENDING':
      return AppBadgeVariant.warning;
    case 'REJECTED':
    case 'SUSPENDED':
    case 'CANCELLED':
      return AppBadgeVariant.destructive;
    default:
      return AppBadgeVariant.secondary;
  }
}

// ─── Subscriptions ───────────────────────────────────────────────────────────

class AdminSubscriptionsScreen extends ConsumerWidget {
  const AdminSubscriptionsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final subsAsync = ref.watch(adminSubscriptionsProvider);
    return _AdminScaffold(
      title: 'Subscriptions',
      route: '/admin/subscriptions',
      body: subsAsync.when(
        loading: () => const AppLoadingState(useList: true),
        error: (err, _) => AppErrorState(
          message: err.toString(),
          onRetry: () => ref.invalidate(adminSubscriptionsProvider),
        ),
        data: (res) {
          final list = (res['data'] as List?) ?? [];
          if (list.isEmpty) {
            return const AppEmptyState(
              title: 'No Subscriptions',
              subtitle: 'Subscriptions will appear here',
              icon: Icons.card_membership_outlined,
            );
          }
          return ListView.separated(
            padding: const EdgeInsets.all(16),
            itemCount: list.length,
            separatorBuilder: (_, __) => const SizedBox(height: 8),
            itemBuilder: (ctx, i) {
              final sub = list[i];
              return _InfoRow(
                icon: Icons.card_membership_outlined,
                title: sub['user']?['name'] ?? 'User #${sub['userId']}',
                subtitle:
                    'Plan: ${sub['plan']?['name'] ?? 'Custom'} · Mess: ${sub['mess']?['name'] ?? '-'}',
                trailing: AppBadge(
                  text: sub['status'] ?? 'ACTIVE',
                  variant: _statusVariant(sub['status'] ?? 'ACTIVE'),
                ),
              );
            },
          );
        },
      ),
    );
  }
}

// ─── Payments ────────────────────────────────────────────────────────────────

class AdminPaymentsScreen extends ConsumerWidget {
  const AdminPaymentsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final paymentsAsync = ref.watch(adminPaymentsProvider);
    return _AdminScaffold(
      title: 'Payments',
      route: '/admin/payments',
      body: paymentsAsync.when(
        loading: () => const AppLoadingState(useList: true),
        error: (err, _) => AppErrorState(
          message: err.toString(),
          onRetry: () => ref.invalidate(adminPaymentsProvider),
        ),
        data: (res) {
          final list = (res['data'] as List?) ?? [];
          if (list.isEmpty) {
            return const AppEmptyState(
              title: 'No Payment Requests',
              subtitle: 'Payment requests will appear here',
              icon: Icons.payments_outlined,
            );
          }
          return ListView.separated(
            padding: const EdgeInsets.all(16),
            itemCount: list.length,
            separatorBuilder: (_, __) => const SizedBox(height: 8),
            itemBuilder: (ctx, i) {
              final pay = list[i];
              final status = pay['status'] ?? 'PENDING';
              return _InfoRow(
                icon: Icons.payments_outlined,
                title: '৳ ${pay['amount']} (${pay['paymentMethod']?['name'] ?? 'TRX'})',
                subtitle:
                    'User: ${pay['user']?['name'] ?? '-'} · Trx: ${pay['transactionId'] ?? '-'}',
                trailing: status == 'PENDING'
                    ? Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          IconButton(
                            icon: const Icon(
                              Icons.check_circle_outline_rounded,
                              color: AppColors.success,
                            ),
                            tooltip: 'Approve',
                            onPressed: () async {
                              await ref
                                  .read(adminActionsProvider)
                                  .approvePayment(pay['id']);
                              ref.invalidate(adminPaymentsProvider);
                            },
                          ),
                          IconButton(
                            icon: const Icon(
                              Icons.highlight_off_rounded,
                              color: AppColors.error,
                            ),
                            tooltip: 'Reject',
                            onPressed: () async {
                              await ref
                                  .read(adminActionsProvider)
                                  .rejectPayment(pay['id']);
                              ref.invalidate(adminPaymentsProvider);
                            },
                          ),
                        ],
                      )
                    : AppBadge(text: status, variant: _statusVariant(status)),
              );
            },
          );
        },
      ),
    );
  }
}

// ─── Payment Methods ─────────────────────────────────────────────────────────

class AdminPaymentMethodsScreen extends ConsumerWidget {
  const AdminPaymentMethodsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final methodsAsync = ref.watch(adminPaymentMethodsProvider);
    return _AdminScaffold(
      title: 'Payment Methods',
      route: '/admin/payment-methods',
      body: methodsAsync.when(
        loading: () => const AppLoadingState(useList: true),
        error: (err, _) => AppErrorState(
          message: err.toString(),
          onRetry: () => ref.invalidate(adminPaymentMethodsProvider),
        ),
        data: (list) {
          if (list.isEmpty) {
            return const AppEmptyState(
              title: 'No Payment Methods',
              subtitle: 'Configure payment methods to accept payments',
              icon: Icons.account_balance_wallet_outlined,
            );
          }
          return ListView.separated(
            padding: const EdgeInsets.all(16),
            itemCount: list.length,
            separatorBuilder: (_, __) => const SizedBox(height: 8),
            itemBuilder: (ctx, i) {
              final pm = list[i];
              return _InfoRow(
                icon: Icons.account_balance_wallet_outlined,
                title: pm['name'] ?? '',
                subtitle:
                    'Acc: ${pm['accountNumber'] ?? '-'} (${pm['accountType'] ?? 'Personal'})',
                trailing: AppBadge(
                  text: (pm['isActive'] ?? true) == true ? 'Active' : 'Inactive',
                  variant: (pm['isActive'] ?? true) == true
                      ? AppBadgeVariant.success
                      : AppBadgeVariant.secondary,
                ),
              );
            },
          );
        },
      ),
    );
  }
}

// ─── Plans ───────────────────────────────────────────────────────────────────

class AdminPlansScreen extends ConsumerWidget {
  const AdminPlansScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final plansAsync = ref.watch(adminPlansProvider);
    return _AdminScaffold(
      title: 'Subscription Plans',
      route: '/admin/plans',
      body: plansAsync.when(
        loading: () => const AppLoadingState(useList: true),
        error: (err, _) => AppErrorState(
          message: err.toString(),
          onRetry: () => ref.invalidate(adminPlansProvider),
        ),
        data: (list) {
          if (list.isEmpty) {
            return const AppEmptyState(
              title: 'No Plans Available',
              subtitle: 'Plans will appear here',
              icon: Icons.layers_outlined,
            );
          }
          return ListView.separated(
            padding: const EdgeInsets.all(16),
            itemCount: list.length,
            separatorBuilder: (_, __) => const SizedBox(height: 8),
            itemBuilder: (ctx, i) {
              final plan = list[i];
              return _InfoRow(
                icon: Icons.layers_outlined,
                title: plan['name'] ?? '',
                subtitle:
                    'Price: ৳ ${plan['price']} · Max Members: ${plan['maxMembers']}',
                trailing: AppBadge(
                  text: plan['tier'] ?? 'FREE',
                  variant: AppBadgeVariant.default_,
                ),
              );
            },
          );
        },
      ),
    );
  }
}

// ─── Coupons ─────────────────────────────────────────────────────────────────

class AdminCouponsScreen extends ConsumerWidget {
  const AdminCouponsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final couponsAsync = ref.watch(adminCouponsProvider);
    return _AdminScaffold(
      title: 'Coupons',
      route: '/admin/coupons',
      body: couponsAsync.when(
        loading: () => const AppLoadingState(useList: true),
        error: (err, _) => AppErrorState(
          message: err.toString(),
          onRetry: () => ref.invalidate(adminCouponsProvider),
        ),
        data: (list) {
          if (list.isEmpty) {
            return const AppEmptyState(
              title: 'No Coupons',
              subtitle: 'Coupons will appear here',
              icon: Icons.confirmation_number_outlined,
            );
          }
          return ListView.separated(
            padding: const EdgeInsets.all(16),
            itemCount: list.length,
            separatorBuilder: (_, __) => const SizedBox(height: 8),
            itemBuilder: (ctx, i) {
              final c = list[i];
              return _InfoRow(
                icon: Icons.confirmation_number_outlined,
                iconColor: AppColors.warning,
                title: c['code'] ?? '',
                subtitle:
                    'Discount: ${c['discountPercent'] ?? 0}% · Used: ${c['usedCount'] ?? 0}',
              );
            },
          );
        },
      ),
    );
  }
}

// ─── Referrals ───────────────────────────────────────────────────────────────

class AdminReferralsScreen extends ConsumerWidget {
  const AdminReferralsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final refsAsync = ref.watch(adminReferralsProvider);
    return _AdminScaffold(
      title: 'Referrals',
      route: '/admin/referrals',
      body: refsAsync.when(
        loading: () => const AppLoadingState(useList: true),
        error: (err, _) => AppErrorState(
          message: err.toString(),
          onRetry: () => ref.invalidate(adminReferralsProvider),
        ),
        data: (list) {
          if (list.isEmpty) {
            return const AppEmptyState(
              title: 'No Referral History',
              subtitle: 'Referrals will appear here',
              icon: Icons.card_giftcard_outlined,
            );
          }
          return ListView.separated(
            padding: const EdgeInsets.all(16),
            itemCount: list.length,
            separatorBuilder: (_, __) => const SizedBox(height: 8),
            itemBuilder: (ctx, i) {
              final refItem = list[i];
              return _InfoRow(
                icon: Icons.card_giftcard_outlined,
                title: 'Referrer: ${refItem['referrer']?['name'] ?? '-'}',
                subtitle: 'Referee: ${refItem['referee']?['name'] ?? '-'}',
                trailing: Text(
                  '৳ ${refItem['rewardAmount'] ?? 0}',
                  style: const TextStyle(
                    fontSize: 15,
                    fontWeight: FontWeight.w600,
                    color: AppColors.successText,
                  ),
                ),
              );
            },
          );
        },
      ),
    );
  }
}

// ─── Support Tickets ─────────────────────────────────────────────────────────

class AdminSupportScreen extends ConsumerWidget {
  const AdminSupportScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final supportAsync = ref.watch(adminSupportTicketsProvider);
    return _AdminScaffold(
      title: 'Support Tickets',
      route: '/admin/support',
      body: supportAsync.when(
        loading: () => const AppLoadingState(useList: true),
        error: (err, _) => AppErrorState(
          message: err.toString(),
          onRetry: () => ref.invalidate(adminSupportTicketsProvider),
        ),
        data: (list) {
          if (list.isEmpty) {
            return const AppEmptyState(
              title: 'No Support Tickets',
              subtitle: 'Support tickets will appear here',
              icon: Icons.support_agent_outlined,
            );
          }
          return ListView.separated(
            padding: const EdgeInsets.all(16),
            itemCount: list.length,
            separatorBuilder: (_, __) => const SizedBox(height: 8),
            itemBuilder: (ctx, i) {
              final t = list[i];
              return _InfoRow(
                icon: Icons.support_agent_outlined,
                iconColor: AppColors.info,
                title: t['subject'] ?? 'No Subject',
                subtitle:
                    'User: ${t['user']?['name'] ?? '-'} · Status: ${t['status']}',
                trailing: AppBadge(
                  text: t['priority'] ?? 'MEDIUM',
                  variant: AppBadgeVariant.secondary,
                ),
              );
            },
          );
        },
      ),
    );
  }
}

// ─── Announcements ───────────────────────────────────────────────────────────

class AdminAnnouncementsScreen extends ConsumerWidget {
  const AdminAnnouncementsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final annAsync = ref.watch(adminAnnouncementsProvider);
    return _AdminScaffold(
      title: 'Announcements',
      route: '/admin/announcements',
      body: annAsync.when(
        loading: () => const AppLoadingState(useList: true),
        error: (err, _) => AppErrorState(
          message: err.toString(),
          onRetry: () => ref.invalidate(adminAnnouncementsProvider),
        ),
        data: (list) {
          if (list.isEmpty) {
            return const AppEmptyState(
              title: 'No Announcements',
              subtitle: 'Announcements will appear here',
              icon: Icons.campaign_outlined,
            );
          }
          return ListView.separated(
            padding: const EdgeInsets.all(16),
            itemCount: list.length,
            separatorBuilder: (_, __) => const SizedBox(height: 8),
            itemBuilder: (ctx, i) {
              final a = list[i];
              return _InfoRow(
                icon: Icons.campaign_outlined,
                title: a['title'] ?? '',
                subtitle: a['description'] ?? '',
              );
            },
          );
        },
      ),
    );
  }
}

// ─── Analytics ───────────────────────────────────────────────────────────────

class AdminAnalyticsScreen extends ConsumerWidget {
  const AdminAnalyticsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final analyticsAsync = ref.watch(adminAnalyticsProvider);
    return _AdminScaffold(
      title: 'Platform Analytics',
      route: '/admin/analytics',
      body: analyticsAsync.when(
        loading: () => const AppLoadingState(),
        error: (err, _) => AppErrorState(
          message: err.toString(),
          onRetry: () => ref.invalidate(adminAnalyticsProvider),
        ),
        data: (data) {
          return ListView(
            padding: const EdgeInsets.all(16),
            children: [
              AppCard(
                padding: const EdgeInsets.all(20),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'Growth Overview',
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w600,
                        color: AppColors.textPrimaryLight,
                      ),
                    ),
                    const SizedBox(height: 16),
                    _MetricLine(label: 'Total Users', value: '${data['totalUsers']}'),
                    _MetricLine(label: 'New Users (${data['period']})', value: '${data['newUsers']}'),
                    _MetricLine(label: 'Total Messes', value: '${data['totalMesses']}'),
                    _MetricLine(label: 'Revenue', value: '৳ ${data['revenue']}'),
                  ],
                ),
              ),
            ],
          );
        },
      ),
    );
  }
}

class _MetricLine extends StatelessWidget {
  final String label;
  final String value;

  const _MetricLine({required this.label, required this.value});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            label,
            style: const TextStyle(
              fontSize: 14,
              color: AppColors.textSecondaryLight,
            ),
          ),
          Text(
            value,
            style: const TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.w600,
              color: AppColors.textPrimaryLight,
            ),
          ),
        ],
      ),
    );
  }
}

// ─── Audit Logs ──────────────────────────────────────────────────────────────

class AdminAuditLogsScreen extends ConsumerWidget {
  const AdminAuditLogsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final auditAsync = ref.watch(adminAuditLogsProvider);
    return _AdminScaffold(
      title: 'Audit Logs',
      route: '/admin/audit-logs',
      body: auditAsync.when(
        loading: () => const AppLoadingState(useList: true),
        error: (err, _) => AppErrorState(
          message: err.toString(),
          onRetry: () => ref.invalidate(adminAuditLogsProvider),
        ),
        data: (res) {
          final list = (res['data'] as List?) ?? [];
          if (list.isEmpty) {
            return const AppEmptyState(
              title: 'No Audit Logs',
              subtitle: 'Audit events will appear here',
              icon: Icons.receipt_long_outlined,
            );
          }
          return ListView.separated(
            padding: const EdgeInsets.all(16),
            itemCount: list.length,
            separatorBuilder: (_, __) => const SizedBox(height: 8),
            itemBuilder: (ctx, i) {
              final log = list[i];
              return _InfoRow(
                icon: Icons.receipt_long_outlined,
                title: '${log['action']} on ${log['entity']}',
                subtitle:
                    'Actor: ${log['user']?['name'] ?? 'System'} · ${log['createdAt']}',
              );
            },
          );
        },
      ),
    );
  }
}

// ─── System Settings ─────────────────────────────────────────────────────────

class AdminSystemSettingsScreen extends ConsumerWidget {
  const AdminSystemSettingsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final settingsAsync = ref.watch(adminSystemSettingsProvider);
    return _AdminScaffold(
      title: 'System Settings',
      route: '/admin/settings',
      body: settingsAsync.when(
        loading: () => const AppLoadingState(),
        error: (err, _) => AppErrorState(
          message: err.toString(),
          onRetry: () => ref.invalidate(adminSystemSettingsProvider),
        ),
        data: (s) {
          return ListView(
            padding: const EdgeInsets.all(16),
            children: [
              AppCard(
                padding: EdgeInsets.zero,
                child: Column(
                  children: [
                    _SettingRow(
                      label: 'App Name',
                      value: s['appName'] ?? '',
                    ),
                    const Divider(height: 1, indent: 16, endIndent: 16),
                    _SettingRow(label: 'Version', value: s['version'] ?? ''),
                    const Divider(height: 1, indent: 16, endIndent: 16),
                    _SettingRow(
                      label: 'Environment',
                      value: s['environment'] ?? '',
                    ),
                    const Divider(height: 1, indent: 16, endIndent: 16),
                    _SettingRow(
                      label: 'Registration Enabled',
                      value: (s['registrationEnabled'] ?? false) == true
                          ? 'Yes'
                          : 'No',
                    ),
                  ],
                ),
              ),
            ],
          );
        },
      ),
    );
  }
}

class _SettingRow extends StatelessWidget {
  final String label;
  final String value;

  const _SettingRow({required this.label, required this.value});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            label,
            style: const TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.w500,
              color: AppColors.textPrimaryLight,
            ),
          ),
          Text(
            value,
            style: const TextStyle(
              fontSize: 14,
              color: AppColors.textSecondaryLight,
            ),
          ),
        ],
      ),
    );
  }
}

// ─── Database Monitor ────────────────────────────────────────────────────────

class AdminDatabaseMonitorScreen extends ConsumerWidget {
  const AdminDatabaseMonitorScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final dbAsync = ref.watch(adminDatabaseStatsProvider);
    return _AdminScaffold(
      title: 'Database Monitor',
      route: '/admin/database',
      body: dbAsync.when(
        loading: () => const AppLoadingState(),
        error: (err, _) => AppErrorState(
          message: err.toString(),
          onRetry: () => ref.invalidate(adminDatabaseStatsProvider),
        ),
        data: (data) {
          final tables = (data['tables'] as Map<String, dynamic>?) ?? {};
          return ListView(
            padding: const EdgeInsets.all(16),
            children: [
              _InfoRow(
                icon: Icons.storage_outlined,
                title: 'Engine: ${data['engine'] ?? '-'}',
                subtitle: 'Status: ${data['status'] ?? 'Healthy'}',
                trailing: AppBadge(
                  text: data['status'] ?? 'HEALTHY',
                  variant: AppBadgeVariant.success,
                ),
              ),
              const SizedBox(height: 12),
              ...tables.entries.map((e) => Padding(
                    padding: const EdgeInsets.only(bottom: 8),
                    child: _InfoRow(
                      icon: Icons.table_chart_outlined,
                      title: e.key.toUpperCase(),
                      subtitle: '${e.value} records',
                    ),
                  )),
            ],
          );
        },
      ),
    );
  }
}

// ─── Feature Flags ───────────────────────────────────────────────────────────

class AdminFeatureFlagsScreen extends ConsumerWidget {
  const AdminFeatureFlagsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final flagsAsync = ref.watch(adminFeatureFlagsProvider);
    return _AdminScaffold(
      title: 'Feature Flags',
      route: '/admin/feature-flags',
      body: flagsAsync.when(
        loading: () => const AppLoadingState(useList: true),
        error: (err, _) => AppErrorState(
          message: err.toString(),
          onRetry: () => ref.invalidate(adminFeatureFlagsProvider),
        ),
        data: (list) {
          return ListView.separated(
            padding: const EdgeInsets.all(16),
            itemCount: list.length,
            separatorBuilder: (_, __) => const SizedBox(height: 8),
            itemBuilder: (ctx, i) {
              final flag = list[i];
              final enabled = flag['enabled'] ?? true;
              return _InfoRow(
                icon: Icons.flag_outlined,
                title: flag['name'] ?? '',
                subtitle: 'Key: ${flag['key']} (${flag['category']})',
                trailing: AppBadge(
                  text: enabled ? 'Enabled' : 'Disabled',
                  variant: enabled
                      ? AppBadgeVariant.success
                      : AppBadgeVariant.secondary,
                ),
              );
            },
          );
        },
      ),
    );
  }
}

// ─── Backup Manager ──────────────────────────────────────────────────────────

class AdminBackupManagerScreen extends ConsumerWidget {
  const AdminBackupManagerScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final backupAsync = ref.watch(adminBackupStatusProvider);
    return _AdminScaffold(
      title: 'Backup Manager',
      route: '/admin/backups',
      body: backupAsync.when(
        loading: () => const AppLoadingState(),
        error: (err, _) => AppErrorState(
          message: err.toString(),
          onRetry: () => ref.invalidate(adminBackupStatusProvider),
        ),
        data: (b) {
          final autoEnabled = b['autoBackupEnabled'] == true;
          return ListView(
            padding: const EdgeInsets.all(16),
            children: [
              _InfoRow(
                icon: Icons.backup_outlined,
                title: 'Auto Backup Frequency',
                subtitle: b['frequency'] ?? 'Daily',
                trailing: AppBadge(
                  text: autoEnabled ? 'Enabled' : 'Disabled',
                  variant: autoEnabled
                      ? AppBadgeVariant.success
                      : AppBadgeVariant.secondary,
                ),
              ),
              const SizedBox(height: 8),
              _InfoRow(
                icon: Icons.inventory_2_outlined,
                title: 'Total Backups Stored',
                subtitle: '${b['totalBackups'] ?? 0} backups',
              ),
            ],
          );
        },
      ),
    );
  }
}

// ─── API Management ──────────────────────────────────────────────────────────

class AdminApiManagementScreen extends ConsumerWidget {
  const AdminApiManagementScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final apiAsync = ref.watch(adminApiOverviewProvider);
    return _AdminScaffold(
      title: 'API Management',
      route: '/admin/api',
      body: apiAsync.when(
        loading: () => const AppLoadingState(),
        error: (err, _) => AppErrorState(
          message: err.toString(),
          onRetry: () => ref.invalidate(adminApiOverviewProvider),
        ),
        data: (a) {
          return ListView(
            padding: const EdgeInsets.all(16),
            children: [
              _InfoRow(
                icon: Icons.api_outlined,
                title: 'API Version: ${a['apiVersion']}',
                subtitle:
                    'Status: ${a['status']} · Latency: ${a['averageLatencyMs']}ms',
                trailing: AppBadge(
                  text: a['status'] ?? 'OPERATIONAL',
                  variant: AppBadgeVariant.success,
                ),
              ),
              const SizedBox(height: 8),
              _InfoRow(
                icon: Icons.traffic_outlined,
                title: '24h Requests',
                subtitle: '${a['totalRequests24h']}',
              ),
            ],
          );
        },
      ),
    );
  }
}

// ─── Email & Notification Templates ──────────────────────────────────────────

class AdminEmailTemplatesScreen extends ConsumerWidget {
  const AdminEmailTemplatesScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final emailAsync = ref.watch(adminEmailTemplatesProvider);
    return _AdminScaffold(
      title: 'Email Templates',
      route: '/admin/email-templates',
      body: emailAsync.when(
        loading: () => const AppLoadingState(useList: true),
        error: (err, _) => AppErrorState(
          message: err.toString(),
          onRetry: () => ref.invalidate(adminEmailTemplatesProvider),
        ),
        data: (list) {
          return ListView.separated(
            padding: const EdgeInsets.all(16),
            itemCount: list.length,
            separatorBuilder: (_, __) => const SizedBox(height: 8),
            itemBuilder: (ctx, i) {
              final item = list[i];
              return _InfoRow(
                icon: Icons.email_outlined,
                iconColor: AppColors.info,
                title: item['name'] ?? '',
                subtitle: item['subject'] ?? '',
              );
            },
          );
        },
      ),
    );
  }
}

class AdminNotificationTemplatesScreen extends ConsumerWidget {
  const AdminNotificationTemplatesScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final notifAsync = ref.watch(adminNotificationTemplatesProvider);
    return _AdminScaffold(
      title: 'Notification Templates',
      route: '/admin/notification-templates',
      body: notifAsync.when(
        loading: () => const AppLoadingState(useList: true),
        error: (err, _) => AppErrorState(
          message: err.toString(),
          onRetry: () => ref.invalidate(adminNotificationTemplatesProvider),
        ),
        data: (list) {
          return ListView.separated(
            padding: const EdgeInsets.all(16),
            itemCount: list.length,
            separatorBuilder: (_, __) => const SizedBox(height: 8),
            itemBuilder: (ctx, i) {
              final item = list[i];
              return _InfoRow(
                icon: Icons.notifications_outlined,
                iconColor: AppColors.warning,
                title: item['name'] ?? '',
                subtitle: 'Channel: ${item['channel']}',
              );
            },
          );
        },
      ),
    );
  }
}

// ─── Security Center ─────────────────────────────────────────────────────────

class AdminSecurityCenterScreen extends ConsumerWidget {
  const AdminSecurityCenterScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final secAsync = ref.watch(adminSecurityOverviewProvider);
    return _AdminScaffold(
      title: 'Security Center',
      route: '/admin/security',
      body: secAsync.when(
        loading: () => const AppLoadingState(),
        error: (err, _) => AppErrorState(
          message: err.toString(),
          onRetry: () => ref.invalidate(adminSecurityOverviewProvider),
        ),
        data: (s) {
          return ListView(
            padding: const EdgeInsets.all(16),
            children: [
              _InfoRow(
                icon: Icons.lock_outline_rounded,
                title: 'Active Sessions',
                subtitle: '${s['activeSessions'] ?? 0}',
              ),
              const SizedBox(height: 8),
              _InfoRow(
                icon: Icons.gpp_bad_outlined,
                title: 'Locked Accounts',
                subtitle: '${s['lockedAccounts'] ?? 0}',
              ),
            ],
          );
        },
      ),
    );
  }
}

// ─── Profile ─────────────────────────────────────────────────────────────────

class AdminProfileScreen extends ConsumerWidget {
  const AdminProfileScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = ref.watch(authProvider).user;
    return _AdminScaffold(
      title: 'Super Admin Profile',
      route: '/admin/profile',
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          AppCard(
            padding: const EdgeInsets.all(20),
            child: Column(
              children: [
                Container(
                  width: 72,
                  height: 72,
                  decoration: BoxDecoration(
                    color: AppColors.primarySoft,
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: const Icon(
                    Icons.person_outline_rounded,
                    size: 36,
                    color: AppColors.primary,
                  ),
                ),
                const SizedBox(height: 16),
                Text(
                  user?['name'] ?? 'Super Admin',
                  style: const TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.w700,
                    color: AppColors.textPrimaryLight,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  user?['email'] ?? '',
                  style: const TextStyle(
                    fontSize: 13,
                    color: AppColors.textSecondaryLight,
                  ),
                ),
                const SizedBox(height: 12),
                const AppBadge(
                  text: 'SUPER ADMIN',
                  variant: AppBadgeVariant.destructive,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}