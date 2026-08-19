import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../app/theme/app_colors.dart';
import '../../core/widgets/error_view.dart';
import '../../core/widgets/shimmer_loader.dart';
import 'admin_provider.dart';

class AdminMessDetailScreen extends ConsumerWidget {
  final String messId;
  const AdminMessDetailScreen({super.key, required this.messId});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final detailAsync = ref.watch(adminMessDetailProvider(messId));
    final theme = Theme.of(context);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Mess Details'),
      ),
      body: RefreshIndicator(
        onRefresh: () async =>
            ref.invalidate(adminMessDetailProvider(messId)),
        child: detailAsync.when(
          loading: () => const DashboardSkeleton(),
          error: (err, _) => ErrorView(
            message: err.toString(),
            onRetry: () =>
                ref.invalidate(adminMessDetailProvider(messId)),
          ),
          data: (mess) {
            final owner = mess['owner'] as Map?;
            final manager = mess['manager'] as Map?;
            final sub = mess['subscription'] as Map?;
            final plan = sub?['plan'] as Map?;
            final members = (mess['members'] as List?) ?? [];
            final counts = mess['_count'] as Map?;
            final status = mess['status'] ?? 'ACTIVE';

            return SingleChildScrollView(
              physics: const AlwaysScrollableScrollPhysics(),
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Header Card
                  Card(
                    child: Padding(
                      padding: const EdgeInsets.all(20),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              CircleAvatar(
                                radius: 28,
                                backgroundColor:
                                    AppColors.primary.withOpacity(0.12),
                                child: const Icon(
                                    Icons.home_work_rounded,
                                    color: AppColors.primary,
                                    size: 28),
                              ),
                              const SizedBox(width: 16),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment:
                                      CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      mess['name'] ?? 'Unnamed',
                                      style: theme.textTheme.titleLarge
                                          ?.copyWith(
                                        fontWeight: FontWeight.bold,
                                      ),
                                    ),
                                    const SizedBox(height: 4),
                                    _StatusChip(status: status),
                                  ],
                                ),
                              ),
                            ],
                          ),
                          if (mess['address'] != null) ...[
                            const SizedBox(height: 12),
                            Row(
                              children: [
                                const Icon(Icons.location_on_outlined,
                                    size: 16, color: Colors.grey),
                                const SizedBox(width: 6),
                                Expanded(
                                  child: Text(mess['address'],
                                      style: theme.textTheme.bodySmall),
                                ),
                              ],
                            ),
                          ],
                          if (mess['description'] != null) ...[
                            const SizedBox(height: 8),
                            Text(mess['description'],
                                style: theme.textTheme.bodySmall),
                          ],
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: 12),

                  // Stats Row
                  Row(
                    children: [
                      _StatTile(
                          label: 'Members',
                          value: '${counts?['members'] ?? 0}'),
                      const SizedBox(width: 8),
                      _StatTile(
                          label: 'Rooms',
                          value: '${counts?['rooms'] ?? 0}'),
                      const SizedBox(width: 8),
                      _StatTile(
                          label: 'Meals',
                          value: '${counts?['meals'] ?? 0}'),
                      const SizedBox(width: 8),
                      _StatTile(
                          label: 'Expenses',
                          value: '${counts?['expenses'] ?? 0}'),
                    ],
                  ),
                  const SizedBox(height: 16),

                  // Owner Info
                  _InfoSection(
                    title: 'Owner Information',
                    icon: Icons.person_rounded,
                    children: [
                      _InfoRow('Name', owner?['name'] ?? '-'),
                      _InfoRow('Email', owner?['email'] ?? '-'),
                      _InfoRow('Phone', owner?['phone'] ?? '-'),
                    ],
                  ),
                  const SizedBox(height: 12),

                  // Manager Info
                  if (manager != null)
                    _InfoSection(
                      title: 'Manager Information',
                      icon: Icons.manage_accounts_rounded,
                      children: [
                        _InfoRow('Name', manager['name'] ?? '-'),
                        _InfoRow('Email', manager['email'] ?? '-'),
                      ],
                    ),
                  const SizedBox(height: 12),

                  // Subscription
                  _InfoSection(
                    title: 'Subscription',
                    icon: Icons.card_membership_rounded,
                    children: [
                      _InfoRow('Plan', plan?['name'] ?? 'No Plan'),
                      _InfoRow('Tier', plan?['tier'] ?? '-'),
                      _InfoRow('Status', sub?['status'] ?? '-'),
                    ],
                  ),
                  const SizedBox(height: 12),

                  // Members List
                  Text(
                    'Members (${members.length})',
                    style: theme.textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 8),
                  if (members.isEmpty)
                    const Card(
                      child: Padding(
                        padding: EdgeInsets.all(20),
                        child: Center(child: Text('No members')),
                      ),
                    )
                  else
                    ...members.take(10).map((m) {
                      final user = m['user'] as Map?;
                      return Card(
                        child: ListTile(
                          leading: CircleAvatar(
                            radius: 18,
                            backgroundColor:
                                AppColors.primary.withOpacity(0.1),
                            child: Text(
                              (user?['name'] ?? 'U')
                                  .toString()
                                  .substring(0, 1)
                                  .toUpperCase(),
                              style: const TextStyle(
                                color: AppColors.primary,
                                fontWeight: FontWeight.bold,
                                fontSize: 14,
                              ),
                            ),
                          ),
                          title: Text(
                            user?['name'] ?? m['fullName'] ?? '-',
                            style: theme.textTheme.titleSmall,
                          ),
                          subtitle: Text(
                            '${(m['role'] ?? '').toString().replaceAll('_', ' ')} • ${m['status'] ?? ''}',
                          ),
                        ),
                      );
                    }),
                  const SizedBox(height: 24),

                  // Action Buttons
                  _buildActions(context, ref, status, mess['id']),
                  const SizedBox(height: 32),
                ],
              ),
            );
          },
        ),
      ),
    );
  }

  Widget _buildActions(
      BuildContext context, WidgetRef ref, String status, String id) {
    final actions = <Widget>[];

    if (status == 'PENDING') {
      actions.add(_ActionButton(
        label: 'Approve',
        icon: Icons.check_circle_rounded,
        color: const Color(0xFF10B981),
        onTap: () => _confirmAction(
          context,
          ref,
          'Approve this mess?',
          'This will make the mess active on the platform.',
          () => ref.read(adminActionsProvider).approveMess(id),
        ),
      ));
      actions.add(const SizedBox(height: 8));
      actions.add(_ActionButton(
        label: 'Reject',
        icon: Icons.cancel_rounded,
        color: const Color(0xFFEF4444),
        onTap: () => _showRejectDialog(context, ref, id),
      ));
    }

    if (status == 'ACTIVE') {
      actions.add(_ActionButton(
        label: 'Suspend',
        icon: Icons.pause_circle_rounded,
        color: const Color(0xFFF59E0B),
        onTap: () => _confirmAction(
          context,
          ref,
          'Suspend this mess?',
          'The mess will be temporarily disabled.',
          () => ref.read(adminActionsProvider).suspendMess(id),
        ),
      ));
    }

    if (status == 'SUSPENDED' || status == 'REJECTED') {
      actions.add(_ActionButton(
        label: 'Activate',
        icon: Icons.play_circle_rounded,
        color: const Color(0xFF10B981),
        onTap: () => _confirmAction(
          context,
          ref,
          'Activate this mess?',
          'The mess will become active on the platform.',
          () => ref.read(adminActionsProvider).activateMess(id),
        ),
      ));
    }

    if (actions.isEmpty) return const SizedBox.shrink();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Actions',
          style: Theme.of(context).textTheme.titleMedium?.copyWith(
                fontWeight: FontWeight.bold,
              ),
        ),
        const SizedBox(height: 8),
        ...actions,
      ],
    );
  }

  Future<void> _confirmAction(BuildContext context, WidgetRef ref,
      String title, String subtitle, Future<bool> Function() action) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text(title),
        content: Text(subtitle),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('Cancel'),
          ),
          FilledButton(
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('Confirm'),
          ),
        ],
      ),
    );

    if (confirmed != true || !context.mounted) return;

    try {
      final success = await action();
      if (success && context.mounted) {
        ref.invalidate(adminMessDetailProvider(messId));
        ref.invalidate(adminMessesProvider);
        ref.invalidate(adminDashboardProvider);
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Action completed successfully')),
        );
      }
    } catch (e) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed: $e')),
        );
      }
    }
  }

  Future<void> _showRejectDialog(
      BuildContext context, WidgetRef ref, String id) async {
    final reasonController = TextEditingController();
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Reject Mess'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Text('Provide a reason for rejection (optional):'),
            const SizedBox(height: 12),
            TextField(
              controller: reasonController,
              maxLines: 3,
              decoration: const InputDecoration(
                hintText: 'Reason for rejection...',
                border: OutlineInputBorder(),
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('Cancel'),
          ),
          FilledButton(
            style: FilledButton.styleFrom(
              backgroundColor: const Color(0xFFEF4444),
            ),
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('Reject'),
          ),
        ],
      ),
    );

    if (confirmed != true || !context.mounted) return;

    try {
      final success = await ref
          .read(adminActionsProvider)
          .rejectMess(id, reason: reasonController.text.trim());
      if (success && context.mounted) {
        ref.invalidate(adminMessDetailProvider(messId));
        ref.invalidate(adminMessesProvider);
        ref.invalidate(adminDashboardProvider);
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Mess rejected')),
        );
      }
    } catch (e) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed: $e')),
        );
      }
    }
    reasonController.dispose();
  }
}

class _StatusChip extends StatelessWidget {
  final String status;
  const _StatusChip({required this.status});

  @override
  Widget build(BuildContext context) {
    Color c;
    switch (status) {
      case 'ACTIVE':
        c = const Color(0xFF10B981);
        break;
      case 'PENDING':
        c = const Color(0xFFF59E0B);
        break;
      case 'SUSPENDED':
        c = const Color(0xFFEF4444);
        break;
      default:
        c = const Color(0xFF64748B);
    }
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 3),
      decoration: BoxDecoration(
        color: c.withOpacity(0.12),
        borderRadius: BorderRadius.circular(6),
      ),
      child: Text(status,
          style:
              TextStyle(color: c, fontSize: 11, fontWeight: FontWeight.w600)),
    );
  }
}

class _StatTile extends StatelessWidget {
  final String label;
  final String value;
  const _StatTile({required this.label, required this.value});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Expanded(
      child: Card(
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 8),
          child: Column(
            children: [
              Text(value,
                  style: theme.textTheme.titleMedium
                      ?.copyWith(fontWeight: FontWeight.bold)),
              const SizedBox(height: 2),
              Text(label,
                  style: theme.textTheme.bodySmall,
                  textAlign: TextAlign.center),
            ],
          ),
        ),
      ),
    );
  }
}

class _InfoSection extends StatelessWidget {
  final String title;
  final IconData icon;
  final List<Widget> children;
  const _InfoSection(
      {required this.title, required this.icon, required this.children});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(icon, size: 18, color: AppColors.primary),
                const SizedBox(width: 8),
                Text(title,
                    style: theme.textTheme.titleSmall
                        ?.copyWith(fontWeight: FontWeight.bold)),
              ],
            ),
            const SizedBox(height: 12),
            ...children,
          ],
        ),
      ),
    );
  }
}

class _InfoRow extends StatelessWidget {
  final String label;
  final String value;
  const _InfoRow(this.label, this.value);

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 6),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 80,
            child: Text(label,
                style: Theme.of(context).textTheme.bodySmall?.copyWith(
                      color: Colors.grey,
                    )),
          ),
          Expanded(
            child: Text(value, style: Theme.of(context).textTheme.bodyMedium),
          ),
        ],
      ),
    );
  }
}

class _ActionButton extends StatelessWidget {
  final String label;
  final IconData icon;
  final Color color;
  final VoidCallback onTap;
  const _ActionButton(
      {required this.label,
      required this.icon,
      required this.color,
      required this.onTap});

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: double.infinity,
      child: OutlinedButton.icon(
        onPressed: onTap,
        icon: Icon(icon, color: color),
        label: Text(label, style: TextStyle(color: color)),
        style: OutlinedButton.styleFrom(
          side: BorderSide(color: color.withOpacity(0.5)),
          padding: const EdgeInsets.symmetric(vertical: 14),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
        ),
      ),
    );
  }
}
