import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/widgets/error_view.dart';
import '../auth/auth_provider.dart';
import 'admin_provider.dart';
import 'widgets/admin_drawer.dart';

// ────────────────────────────────────────────────────────────────────────────
// Subscriptions Screen
// ────────────────────────────────────────────────────────────────────────────

class AdminSubscriptionsScreen extends ConsumerWidget {
  const AdminSubscriptionsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final subsAsync = ref.watch(adminSubscriptionsProvider);
    return Scaffold(
      drawer: const AdminDrawer(currentRoute: '/admin/subscriptions'),
      appBar: AppBar(title: const Text('Subscriptions')),
      body: subsAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (err, _) => ErrorView(message: err.toString(), onRetry: () => ref.invalidate(adminSubscriptionsProvider)),
        data: (res) {
          final list = (res['data'] as List?) ?? [];
          if (list.isEmpty) return const Center(child: Text('No subscriptions found'));
          return ListView.builder(
            itemCount: list.length,
            padding: const EdgeInsets.all(12),
            itemBuilder: (ctx, i) {
              final sub = list[i];
              return Card(
                child: ListTile(
                  title: Text(sub['user']?['name'] ?? 'User #${sub['userId']}'),
                  subtitle: Text('Plan: ${sub['plan']?['name'] ?? 'Custom'} • Status: ${sub['status']}'),
                  trailing: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      color: sub['status'] == 'ACTIVE' ? Colors.green.withOpacity(0.12) : Colors.orange.withOpacity(0.12),
                      borderRadius: BorderRadius.circular(6),
                    ),
                    child: Text(sub['status'] ?? 'ACTIVE', style: TextStyle(color: sub['status'] == 'ACTIVE' ? Colors.green : Colors.orange, fontSize: 11, fontWeight: FontWeight.bold)),
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

// ────────────────────────────────────────────────────────────────────────────
// Payments Screen
// ────────────────────────────────────────────────────────────────────────────

class AdminPaymentsScreen extends ConsumerWidget {
  const AdminPaymentsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final paymentsAsync = ref.watch(adminPaymentsProvider);
    return Scaffold(
      drawer: const AdminDrawer(currentRoute: '/admin/payments'),
      appBar: AppBar(title: const Text('Payments')),
      body: paymentsAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (err, _) => ErrorView(message: err.toString(), onRetry: () => ref.invalidate(adminPaymentsProvider)),
        data: (res) {
          final list = (res['data'] as List?) ?? [];
          if (list.isEmpty) return const Center(child: Text('No payment requests'));
          return ListView.builder(
            itemCount: list.length,
            padding: const EdgeInsets.all(12),
            itemBuilder: (ctx, i) {
              final pay = list[i];
              return Card(
                child: ListTile(
                  title: Text('৳ ${pay['amount']} (${pay['paymentMethod']?['name'] ?? 'TRX'})'),
                  subtitle: Text('User: ${pay['user']?['name'] ?? '-'} • Trx: ${pay['transactionId'] ?? '-'}'),
                  trailing: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      if (pay['status'] == 'PENDING') ...[
                        IconButton(
                          icon: const Icon(Icons.check_circle_outline, color: Colors.green),
                          onPressed: () async {
                            await ref.read(adminActionsProvider).approvePayment(pay['id']);
                            ref.invalidate(adminPaymentsProvider);
                          },
                        ),
                        IconButton(
                          icon: const Icon(Icons.highlight_off, color: Colors.red),
                          onPressed: () async {
                            await ref.read(adminActionsProvider).rejectPayment(pay['id']);
                            ref.invalidate(adminPaymentsProvider);
                          },
                        ),
                      ] else
                        Text(pay['status'] ?? '', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 11)),
                    ],
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

// ────────────────────────────────────────────────────────────────────────────
// Payment Methods Screen
// ────────────────────────────────────────────────────────────────────────────

class AdminPaymentMethodsScreen extends ConsumerWidget {
  const AdminPaymentMethodsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final methodsAsync = ref.watch(adminPaymentMethodsProvider);
    return Scaffold(
      drawer: const AdminDrawer(currentRoute: '/admin/payment-methods'),
      appBar: AppBar(title: const Text('Payment Methods')),
      body: methodsAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (err, _) => ErrorView(message: err.toString(), onRetry: () => ref.invalidate(adminPaymentMethodsProvider)),
        data: (list) {
          if (list.isEmpty) return const Center(child: Text('No payment methods configured'));
          return ListView.builder(
            itemCount: list.length,
            padding: const EdgeInsets.all(12),
            itemBuilder: (ctx, i) {
              final pm = list[i];
              return Card(
                child: ListTile(
                  leading: const Icon(Icons.account_balance_wallet_outlined, color: Color(0xFF4338CA)),
                  title: Text(pm['name'] ?? ''),
                  subtitle: Text('Acc: ${pm['accountNumber'] ?? '-'} (${pm['accountType'] ?? 'Personal'})'),
                  trailing: Switch(
                    value: pm['isActive'] ?? true,
                    onChanged: (val) {},
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

// ────────────────────────────────────────────────────────────────────────────
// Plans Screen
// ────────────────────────────────────────────────────────────────────────────

class AdminPlansScreen extends ConsumerWidget {
  const AdminPlansScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final plansAsync = ref.watch(adminPlansProvider);
    return Scaffold(
      drawer: const AdminDrawer(currentRoute: '/admin/plans'),
      appBar: AppBar(title: const Text('Subscription Plans')),
      body: plansAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (err, _) => ErrorView(message: err.toString(), onRetry: () => ref.invalidate(adminPlansProvider)),
        data: (list) {
          if (list.isEmpty) return const Center(child: Text('No plans available'));
          return ListView.builder(
            itemCount: list.length,
            padding: const EdgeInsets.all(12),
            itemBuilder: (ctx, i) {
              final plan = list[i];
              return Card(
                child: ListTile(
                  title: Text(plan['name'] ?? ''),
                  subtitle: Text('Price: ৳ ${plan['price']} • Max Members: ${plan['maxMembers']}'),
                  trailing: Chip(label: Text(plan['tier'] ?? 'FREE', style: const TextStyle(fontSize: 10))),
                ),
              );
            },
          );
        },
      ),
    );
  }
}

// ────────────────────────────────────────────────────────────────────────────
// Coupons Screen
// ────────────────────────────────────────────────────────────────────────────

class AdminCouponsScreen extends ConsumerWidget {
  const AdminCouponsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final couponsAsync = ref.watch(adminCouponsProvider);
    return Scaffold(
      drawer: const AdminDrawer(currentRoute: '/admin/coupons'),
      appBar: AppBar(title: const Text('Coupons')),
      body: couponsAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (err, _) => ErrorView(message: err.toString(), onRetry: () => ref.invalidate(adminCouponsProvider)),
        data: (list) {
          if (list.isEmpty) return const Center(child: Text('No coupons configured'));
          return ListView.builder(
            itemCount: list.length,
            padding: const EdgeInsets.all(12),
            itemBuilder: (ctx, i) {
              final c = list[i];
              return Card(
                child: ListTile(
                  leading: const Icon(Icons.confirmation_number_outlined, color: Colors.orange),
                  title: Text(c['code'] ?? ''),
                  subtitle: Text('Discount: ${c['discountPercent'] ?? 0}% • Used: ${c['usedCount'] ?? 0}'),
                ),
              );
            },
          );
        },
      ),
    );
  }
}

// ────────────────────────────────────────────────────────────────────────────
// Referrals Screen
// ────────────────────────────────────────────────────────────────────────────

class AdminReferralsScreen extends ConsumerWidget {
  const AdminReferralsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final refsAsync = ref.watch(adminReferralsProvider);
    return Scaffold(
      drawer: const AdminDrawer(currentRoute: '/admin/referrals'),
      appBar: AppBar(title: const Text('Referrals')),
      body: refsAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (err, _) => ErrorView(message: err.toString(), onRetry: () => ref.invalidate(adminReferralsProvider)),
        data: (list) {
          if (list.isEmpty) return const Center(child: Text('No referral history'));
          return ListView.builder(
            itemCount: list.length,
            padding: const EdgeInsets.all(12),
            itemBuilder: (ctx, i) {
              final refItem = list[i];
              return Card(
                child: ListTile(
                  title: Text('Referrer: ${refItem['referrer']?['name'] ?? '-'}'),
                  subtitle: Text('Referee: ${refItem['referee']?['name'] ?? '-'}'),
                  trailing: Text('৳ ${refItem['rewardAmount'] ?? 0}', style: const TextStyle(fontWeight: FontWeight.bold)),
                ),
              );
            },
          );
        },
      ),
    );
  }
}

// ────────────────────────────────────────────────────────────────────────────
// Support Tickets Screen
// ────────────────────────────────────────────────────────────────────────────

class AdminSupportScreen extends ConsumerWidget {
  const AdminSupportScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final supportAsync = ref.watch(adminSupportTicketsProvider);
    return Scaffold(
      drawer: const AdminDrawer(currentRoute: '/admin/support'),
      appBar: AppBar(title: const Text('Support Tickets')),
      body: supportAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (err, _) => ErrorView(message: err.toString(), onRetry: () => ref.invalidate(adminSupportTicketsProvider)),
        data: (list) {
          if (list.isEmpty) return const Center(child: Text('No support tickets'));
          return ListView.builder(
            itemCount: list.length,
            padding: const EdgeInsets.all(12),
            itemBuilder: (ctx, i) {
              final t = list[i];
              return Card(
                child: ListTile(
                  leading: const Icon(Icons.support_agent_rounded, color: Colors.blue),
                  title: Text(t['subject'] ?? 'No Subject'),
                  subtitle: Text('User: ${t['user']?['name'] ?? '-'} • Status: ${t['status']}'),
                  trailing: Chip(label: Text(t['priority'] ?? 'MEDIUM', style: const TextStyle(fontSize: 10))),
                ),
              );
            },
          );
        },
      ),
    );
  }
}

// ────────────────────────────────────────────────────────────────────────────
// Announcements Screen
// ────────────────────────────────────────────────────────────────────────────

class AdminAnnouncementsScreen extends ConsumerWidget {
  const AdminAnnouncementsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final annAsync = ref.watch(adminAnnouncementsProvider);
    return Scaffold(
      drawer: const AdminDrawer(currentRoute: '/admin/announcements'),
      appBar: AppBar(title: const Text('Announcements')),
      body: annAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (err, _) => ErrorView(message: err.toString(), onRetry: () => ref.invalidate(adminAnnouncementsProvider)),
        data: (list) {
          if (list.isEmpty) return const Center(child: Text('No announcements published'));
          return ListView.builder(
            itemCount: list.length,
            padding: const EdgeInsets.all(12),
            itemBuilder: (ctx, i) {
              final a = list[i];
              return Card(
                child: ListTile(
                  leading: const Icon(Icons.campaign_rounded, color: Color(0xFF4338CA)),
                  title: Text(a['title'] ?? ''),
                  subtitle: Text(a['description'] ?? ''),
                ),
              );
            },
          );
        },
      ),
    );
  }
}

// ────────────────────────────────────────────────────────────────────────────
// Analytics Screen
// ────────────────────────────────────────────────────────────────────────────

class AdminAnalyticsScreen extends ConsumerWidget {
  const AdminAnalyticsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final analyticsAsync = ref.watch(adminAnalyticsProvider);
    return Scaffold(
      drawer: const AdminDrawer(currentRoute: '/admin/analytics'),
      appBar: AppBar(title: const Text('Platform Analytics')),
      body: analyticsAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (err, _) => ErrorView(message: err.toString(), onRetry: () => ref.invalidate(adminAnalyticsProvider)),
        data: (data) {
          return SingleChildScrollView(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Card(
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text('Growth Overview', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                        const SizedBox(height: 12),
                        Text('Total Users: ${data['totalUsers']}'),
                        Text('New Users (${data['period']}): ${data['newUsers']}'),
                        Text('Total Messes: ${data['totalMesses']}'),
                        Text('Revenue: ৳ ${data['revenue']}'),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          );
        },
      ),
    );
  }
}

// ────────────────────────────────────────────────────────────────────────────
// Audit Logs Screen
// ────────────────────────────────────────────────────────────────────────────

class AdminAuditLogsScreen extends ConsumerWidget {
  const AdminAuditLogsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final auditAsync = ref.watch(adminAuditLogsProvider);
    return Scaffold(
      drawer: const AdminDrawer(currentRoute: '/admin/audit-logs'),
      appBar: AppBar(title: const Text('Audit Logs')),
      body: auditAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (err, _) => ErrorView(message: err.toString(), onRetry: () => ref.invalidate(adminAuditLogsProvider)),
        data: (res) {
          final list = (res['data'] as List?) ?? [];
          if (list.isEmpty) return const Center(child: Text('No audit logs found'));
          return ListView.builder(
            itemCount: list.length,
            padding: const EdgeInsets.all(12),
            itemBuilder: (ctx, i) {
              final log = list[i];
              return Card(
                child: ListTile(
                  dense: true,
                  title: Text('${log['action']} on ${log['entity']}'),
                  subtitle: Text('Actor: ${log['user']?['name'] ?? 'System'} • ${log['createdAt']}'),
                ),
              );
            },
          );
        },
      ),
    );
  }
}

// ────────────────────────────────────────────────────────────────────────────
// System Settings Screen
// ────────────────────────────────────────────────────────────────────────────

class AdminSystemSettingsScreen extends ConsumerWidget {
  const AdminSystemSettingsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final settingsAsync = ref.watch(adminSystemSettingsProvider);
    return Scaffold(
      drawer: const AdminDrawer(currentRoute: '/admin/settings'),
      appBar: AppBar(title: const Text('System Settings')),
      body: settingsAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (err, _) => ErrorView(message: err.toString(), onRetry: () => ref.invalidate(adminSystemSettingsProvider)),
        data: (s) {
          return ListView(
            padding: const EdgeInsets.all(16),
            children: [
              ListTile(title: const Text('App Name'), trailing: Text(s['appName'] ?? '')),
              ListTile(title: const Text('Version'), trailing: Text(s['version'] ?? '')),
              ListTile(title: const Text('Environment'), trailing: Text(s['environment'] ?? '')),
              ListTile(title: const Text('Registration Enabled'), trailing: Text(s['registrationEnabled'] == true ? 'Yes' : 'No')),
            ],
          );
        },
      ),
    );
  }
}

// ────────────────────────────────────────────────────────────────────────────
// Database Monitor Screen
// ────────────────────────────────────────────────────────────────────────────

class AdminDatabaseMonitorScreen extends ConsumerWidget {
  const AdminDatabaseMonitorScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final dbAsync = ref.watch(adminDatabaseStatsProvider);
    return Scaffold(
      drawer: const AdminDrawer(currentRoute: '/admin/database'),
      appBar: AppBar(title: const Text('Database Monitor')),
      body: dbAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (err, _) => ErrorView(message: err.toString(), onRetry: () => ref.invalidate(adminDatabaseStatsProvider)),
        data: (data) {
          final tables = (data['tables'] as Map<String, dynamic>?) ?? {};
          return ListView(
            padding: const EdgeInsets.all(16),
            children: [
              Card(
                child: ListTile(
                  title: Text('Engine: ${data['engine'] ?? '-'}'),
                  subtitle: Text('Status: ${data['status'] ?? 'Healthy'}'),
                ),
              ),
              const SizedBox(height: 12),
              ...tables.entries.map((e) => Card(
                child: ListTile(
                  title: Text(e.key.toUpperCase()),
                  trailing: Text('${e.value} records', style: const TextStyle(fontWeight: FontWeight.bold)),
                ),
              )),
            ],
          );
        },
      ),
    );
  }
}

// ────────────────────────────────────────────────────────────────────────────
// Feature Flags Screen
// ────────────────────────────────────────────────────────────────────────────

class AdminFeatureFlagsScreen extends ConsumerWidget {
  const AdminFeatureFlagsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final flagsAsync = ref.watch(adminFeatureFlagsProvider);
    return Scaffold(
      drawer: const AdminDrawer(currentRoute: '/admin/feature-flags'),
      appBar: AppBar(title: const Text('Feature Flags')),
      body: flagsAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (err, _) => ErrorView(message: err.toString(), onRetry: () => ref.invalidate(adminFeatureFlagsProvider)),
        data: (list) {
          return ListView.builder(
            itemCount: list.length,
            padding: const EdgeInsets.all(12),
            itemBuilder: (ctx, i) {
              final flag = list[i];
              return Card(
                child: ListTile(
                  title: Text(flag['name'] ?? ''),
                  subtitle: Text('Key: ${flag['key']} (${flag['category']})'),
                  trailing: Switch(value: flag['enabled'] ?? true, onChanged: (_) {}),
                ),
              );
            },
          );
        },
      ),
    );
  }
}

// ────────────────────────────────────────────────────────────────────────────
// Backup Manager Screen
// ────────────────────────────────────────────────────────────────────────────

class AdminBackupManagerScreen extends ConsumerWidget {
  const AdminBackupManagerScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final backupAsync = ref.watch(adminBackupStatusProvider);
    return Scaffold(
      drawer: const AdminDrawer(currentRoute: '/admin/backups'),
      appBar: AppBar(title: const Text('Backup Manager')),
      body: backupAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (err, _) => ErrorView(message: err.toString(), onRetry: () => ref.invalidate(adminBackupStatusProvider)),
        data: (b) {
          return ListView(
            padding: const EdgeInsets.all(16),
            children: [
              Card(
                child: ListTile(
                  title: const Text('Auto Backup Frequency'),
                  subtitle: Text(b['frequency'] ?? 'Daily'),
                  trailing: Icon(Icons.check_circle, color: b['autoBackupEnabled'] == true ? Colors.green : Colors.grey),
                ),
              ),
              Card(
                child: ListTile(
                  title: const Text('Total Backups Stored'),
                  trailing: Text('${b['totalBackups'] ?? 0}', style: const TextStyle(fontWeight: FontWeight.bold)),
                ),
              ),
            ],
          );
        },
      ),
    );
  }
}

// ────────────────────────────────────────────────────────────────────────────
// API Management Screen
// ────────────────────────────────────────────────────────────────────────────

class AdminApiManagementScreen extends ConsumerWidget {
  const AdminApiManagementScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final apiAsync = ref.watch(adminApiOverviewProvider);
    return Scaffold(
      drawer: const AdminDrawer(currentRoute: '/admin/api'),
      appBar: AppBar(title: const Text('API Management')),
      body: apiAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (err, _) => ErrorView(message: err.toString(), onRetry: () => ref.invalidate(adminApiOverviewProvider)),
        data: (a) {
          return ListView(
            padding: const EdgeInsets.all(16),
            children: [
              Card(
                child: ListTile(
                  title: Text('API Version: ${a['apiVersion']}'),
                  subtitle: Text('Status: ${a['status']} • Latency: ${a['averageLatencyMs']}ms'),
                ),
              ),
              Card(
                child: ListTile(
                  title: const Text('24h Requests'),
                  trailing: Text('${a['totalRequests24h']}', style: const TextStyle(fontWeight: FontWeight.bold)),
                ),
              ),
            ],
          );
        },
      ),
    );
  }
}

// ────────────────────────────────────────────────────────────────────────────
// Email & Notification Templates Screens
// ────────────────────────────────────────────────────────────────────────────

class AdminEmailTemplatesScreen extends ConsumerWidget {
  const AdminEmailTemplatesScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final emailAsync = ref.watch(adminEmailTemplatesProvider);
    return Scaffold(
      drawer: const AdminDrawer(currentRoute: '/admin/email-templates'),
      appBar: AppBar(title: const Text('Email Templates')),
      body: emailAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (err, _) => ErrorView(message: err.toString(), onRetry: () => ref.invalidate(adminEmailTemplatesProvider)),
        data: (list) {
          return ListView.builder(
            itemCount: list.length,
            padding: const EdgeInsets.all(12),
            itemBuilder: (ctx, i) {
              final item = list[i];
              return Card(
                child: ListTile(
                  leading: const Icon(Icons.email_outlined, color: Colors.blue),
                  title: Text(item['name'] ?? ''),
                  subtitle: Text(item['subject'] ?? ''),
                ),
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
    return Scaffold(
      drawer: const AdminDrawer(currentRoute: '/admin/notification-templates'),
      appBar: AppBar(title: const Text('Notification Templates')),
      body: notifAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (err, _) => ErrorView(message: err.toString(), onRetry: () => ref.invalidate(adminNotificationTemplatesProvider)),
        data: (list) {
          return ListView.builder(
            itemCount: list.length,
            padding: const EdgeInsets.all(12),
            itemBuilder: (ctx, i) {
              final item = list[i];
              return Card(
                child: ListTile(
                  leading: const Icon(Icons.notifications_outlined, color: Colors.purple),
                  title: Text(item['name'] ?? ''),
                  subtitle: Text('Channel: ${item['channel']}'),
                ),
              );
            },
          );
        },
      ),
    );
  }
}

// ────────────────────────────────────────────────────────────────────────────
// Security Center Screen
// ────────────────────────────────────────────────────────────────────────────

class AdminSecurityCenterScreen extends ConsumerWidget {
  const AdminSecurityCenterScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final secAsync = ref.watch(adminSecurityOverviewProvider);
    return Scaffold(
      drawer: const AdminDrawer(currentRoute: '/admin/security'),
      appBar: AppBar(title: const Text('Security Center')),
      body: secAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (err, _) => ErrorView(message: err.toString(), onRetry: () => ref.invalidate(adminSecurityOverviewProvider)),
        data: (s) {
          return ListView(
            padding: const EdgeInsets.all(16),
            children: [
              Card(
                child: ListTile(
                  title: const Text('Active Sessions'),
                  trailing: Text('${s['activeSessions'] ?? 0}', style: const TextStyle(fontWeight: FontWeight.bold)),
                ),
              ),
              Card(
                child: ListTile(
                  title: const Text('Locked Accounts'),
                  trailing: Text('${s['lockedAccounts'] ?? 0}', style: const TextStyle(fontWeight: FontWeight.bold)),
                ),
              ),
            ],
          );
        },
      ),
    );
  }
}

// ────────────────────────────────────────────────────────────────────────────
// Profile Screen
// ────────────────────────────────────────────────────────────────────────────

class AdminProfileScreen extends ConsumerWidget {
  const AdminProfileScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = ref.watch(authProvider).user;
    return Scaffold(
      drawer: const AdminDrawer(currentRoute: '/admin/profile'),
      appBar: AppBar(title: const Text('Super Admin Profile')),
      body: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            const CircleAvatar(radius: 40, child: Icon(Icons.person, size: 40)),
            const SizedBox(height: 16),
            Text(user?['name'] ?? 'Super Admin', style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
            Text(user?['email'] ?? '', style: const TextStyle(color: Colors.grey)),
            const SizedBox(height: 24),
            Card(
              child: ListTile(
                title: const Text('Role'),
                trailing: Text(user?['role'] ?? 'SUPER_ADMIN', style: const TextStyle(color: Colors.red, fontWeight: FontWeight.bold)),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
