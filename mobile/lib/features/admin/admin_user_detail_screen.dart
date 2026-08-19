import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../app/theme/app_colors.dart';
import '../../core/widgets/error_view.dart';
import '../../core/widgets/shimmer_loader.dart';
import 'admin_provider.dart';

class AdminUserDetailScreen extends ConsumerWidget {
  final String userId;
  const AdminUserDetailScreen({super.key, required this.userId});

  static const _allRoles = [
    'SUPER_ADMIN',
    'ADMIN',
    'MESS_OWNER',
    'MESS_MANAGER',
    'ASSISTANT_MANAGER',
    'ACCOUNTANT',
    'MEMBER',
    'GUEST',
  ];

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final detailAsync = ref.watch(adminUserDetailProvider(userId));
    final theme = Theme.of(context);

    return Scaffold(
      appBar: AppBar(title: const Text('User Details')),
      body: RefreshIndicator(
        onRefresh: () async =>
            ref.invalidate(adminUserDetailProvider(userId)),
        child: detailAsync.when(
          loading: () => const DashboardSkeleton(),
          error: (err, _) => ErrorView(
            message: err.toString(),
            onRetry: () =>
                ref.invalidate(adminUserDetailProvider(userId)),
          ),
          data: (user) {
            final isActive = user['isActive'] ?? true;
            final isLocked = user['isLocked'] ?? false;
            final role = user['role'] ?? 'MEMBER';
            final members = (user['members'] as List?) ?? [];
            final subs = (user['subscriptions'] as List?) ?? [];

            return SingleChildScrollView(
              physics: const AlwaysScrollableScrollPhysics(),
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // User Header
                  Card(
                    child: Padding(
                      padding: const EdgeInsets.all(20),
                      child: Row(
                        children: [
                          CircleAvatar(
                            radius: 32,
                            backgroundColor:
                                AppColors.primary.withOpacity(0.12),
                            child: Text(
                              (user['name'] ?? 'U')
                                  .toString()
                                  .substring(0, 1)
                                  .toUpperCase(),
                              style: const TextStyle(
                                color: AppColors.primary,
                                fontWeight: FontWeight.bold,
                                fontSize: 24,
                              ),
                            ),
                          ),
                          const SizedBox(width: 16),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  user['name'] ?? 'Unknown',
                                  style: theme.textTheme.titleLarge?.copyWith(
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                                const SizedBox(height: 4),
                                Text(user['email'] ?? '',
                                    style: theme.textTheme.bodySmall),
                                const SizedBox(height: 6),
                                Row(
                                  children: [
                                    _RoleBadge(role: role),
                                    const SizedBox(width: 6),
                                    if (!isActive)
                                      _StatusBadge(
                                          label: 'INACTIVE',
                                          color: AppColors.error),
                                    if (isLocked)
                                      _StatusBadge(
                                          label: 'LOCKED',
                                          color: AppColors.error),
                                  ],
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: 12),

                  // Info
                  Card(
                    child: Padding(
                      padding: const EdgeInsets.all(16),
                      child: Column(
                        children: [
                          _DetailRow('Phone', user['phone'] ?? '-'),
                          _DetailRow('Last Login',
                              _formatDate(user['lastLoginAt'])),
                          _DetailRow(
                              'Joined', _formatDate(user['createdAt'])),
                          _DetailRow('Active',
                              isActive ? 'Yes' : 'No'),
                          _DetailRow('Locked',
                              isLocked ? 'Yes' : 'No'),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: 12),

                  // Mess Memberships
                  if (members.isNotEmpty) ...[
                    Text('Mess Memberships (${members.length})',
                        style: theme.textTheme.titleMedium
                            ?.copyWith(fontWeight: FontWeight.bold)),
                    const SizedBox(height: 8),
                    ...members.map((m) {
                      final mess = m['mess'] as Map?;
                      return Card(
                        child: ListTile(
                          leading: const Icon(Icons.home_work_outlined,
                              color: AppColors.primary),
                          title: Text(mess?['name'] ?? '-',
                              style: theme.textTheme.titleSmall),
                          subtitle: Text(
                            '${(m['role'] ?? '').toString().replaceAll('_', ' ')} • ${m['status'] ?? ''}',
                          ),
                        ),
                      );
                    }),
                    const SizedBox(height: 12),
                  ],

                  // Subscriptions
                  if (subs.isNotEmpty) ...[
                    Text('Subscriptions',
                        style: theme.textTheme.titleMedium
                            ?.copyWith(fontWeight: FontWeight.bold)),
                    const SizedBox(height: 8),
                    ...subs.map((s) {
                      final plan = s['plan'] as Map?;
                      return Card(
                        child: ListTile(
                          leading: const Icon(
                              Icons.card_membership_rounded,
                              color: Color(0xFF3B82F6)),
                          title: Text(plan?['name'] ?? '-',
                              style: theme.textTheme.titleSmall),
                          subtitle: Text('Status: ${s['status'] ?? '-'}'),
                        ),
                      );
                    }),
                    const SizedBox(height: 12),
                  ],

                  // Actions
                  Text('Actions',
                      style: theme.textTheme.titleMedium
                          ?.copyWith(fontWeight: FontWeight.bold)),
                  const SizedBox(height: 8),

                  // Change Role
                  SizedBox(
                    width: double.infinity,
                    child: OutlinedButton.icon(
                      onPressed: () =>
                          _showChangeRoleDialog(context, ref, role),
                      icon: const Icon(Icons.swap_horiz_rounded),
                      label: const Text('Change Role'),
                      style: OutlinedButton.styleFrom(
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(height: 8),

                  // Activate / Deactivate
                  SizedBox(
                    width: double.infinity,
                    child: OutlinedButton.icon(
                      onPressed: () => _toggleActive(context, ref, isActive),
                      icon: Icon(
                        isActive
                            ? Icons.block_rounded
                            : Icons.check_circle_outline_rounded,
                        color: isActive ? AppColors.error : AppColors.success,
                      ),
                      label: Text(
                        isActive ? 'Deactivate User' : 'Activate User',
                        style: TextStyle(
                          color:
                              isActive ? AppColors.error : AppColors.success,
                        ),
                      ),
                      style: OutlinedButton.styleFrom(
                        side: BorderSide(
                          color: (isActive ? AppColors.error : AppColors.success)
                              .withOpacity(0.5),
                        ),
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(height: 8),

                  // Lock / Unlock
                  SizedBox(
                    width: double.infinity,
                    child: OutlinedButton.icon(
                      onPressed: () => _toggleLock(context, ref, isLocked),
                      icon: Icon(
                        isLocked
                            ? Icons.lock_open_rounded
                            : Icons.lock_rounded,
                        color: const Color(0xFFF59E0B),
                      ),
                      label: Text(
                        isLocked ? 'Unlock User' : 'Lock User',
                        style: const TextStyle(color: Color(0xFFF59E0B)),
                      ),
                      style: OutlinedButton.styleFrom(
                        side: BorderSide(
                          color: const Color(0xFFF59E0B).withOpacity(0.5),
                        ),
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(height: 32),
                ],
              ),
            );
          },
        ),
      ),
    );
  }

  String _formatDate(dynamic date) {
    if (date == null) return '-';
    try {
      final dt = DateTime.parse(date.toString());
      return '${dt.day}/${dt.month}/${dt.year}';
    } catch (_) {
      return '-';
    }
  }

  Future<void> _showChangeRoleDialog(
      BuildContext context, WidgetRef ref, String currentRole) async {
    final selected = await showDialog<String>(
      context: context,
      builder: (ctx) => SimpleDialog(
        title: const Text('Select New Role'),
        children: _allRoles.map((r) {
          return SimpleDialogOption(
            onPressed: () => Navigator.pop(ctx, r),
            child: Row(
              children: [
                if (r == currentRole)
                  const Icon(Icons.check, size: 18, color: AppColors.primary)
                else
                  const SizedBox(width: 18),
                const SizedBox(width: 12),
                Text(r.replaceAll('_', ' ')),
              ],
            ),
          );
        }).toList(),
      ),
    );

    if (selected == null || selected == currentRole || !context.mounted) return;

    try {
      await ref.read(adminActionsProvider).changeUserRole(userId, selected);
      ref.invalidate(adminUserDetailProvider(userId));
      ref.invalidate(adminUsersProvider);
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Role changed to ${selected.replaceAll('_', ' ')}')),
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

  Future<void> _toggleActive(
      BuildContext context, WidgetRef ref, bool isActive) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text(isActive ? 'Deactivate User?' : 'Activate User?'),
        content: Text(isActive
            ? 'This user will no longer be able to login.'
            : 'This user will be able to login again.'),
        actions: [
          TextButton(
              onPressed: () => Navigator.pop(ctx, false),
              child: const Text('Cancel')),
          FilledButton(
              onPressed: () => Navigator.pop(ctx, true),
              child: const Text('Confirm')),
        ],
      ),
    );
    if (confirmed != true || !context.mounted) return;

    try {
      await ref
          .read(adminActionsProvider)
          .changeUserStatus(userId, isActive: !isActive);
      ref.invalidate(adminUserDetailProvider(userId));
      ref.invalidate(adminUsersProvider);
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
              content: Text(
                  isActive ? 'User deactivated' : 'User activated')),
        );
      }
    } catch (e) {
      if (context.mounted) {
        ScaffoldMessenger.of(context)
            .showSnackBar(SnackBar(content: Text('Failed: $e')));
      }
    }
  }

  Future<void> _toggleLock(
      BuildContext context, WidgetRef ref, bool isLocked) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text(isLocked ? 'Unlock User?' : 'Lock User?'),
        actions: [
          TextButton(
              onPressed: () => Navigator.pop(ctx, false),
              child: const Text('Cancel')),
          FilledButton(
              onPressed: () => Navigator.pop(ctx, true),
              child: const Text('Confirm')),
        ],
      ),
    );
    if (confirmed != true || !context.mounted) return;

    try {
      await ref
          .read(adminActionsProvider)
          .changeUserStatus(userId, isLocked: !isLocked);
      ref.invalidate(adminUserDetailProvider(userId));
      ref.invalidate(adminUsersProvider);
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
              content:
                  Text(isLocked ? 'User unlocked' : 'User locked')),
        );
      }
    } catch (e) {
      if (context.mounted) {
        ScaffoldMessenger.of(context)
            .showSnackBar(SnackBar(content: Text('Failed: $e')));
      }
    }
  }
}

class _RoleBadge extends StatelessWidget {
  final String role;
  const _RoleBadge({required this.role});
  @override
  Widget build(BuildContext context) {
    Color c;
    switch (role) {
      case 'SUPER_ADMIN':
        c = const Color(0xFFEF4444);
        break;
      case 'ADMIN':
        c = const Color(0xFFF59E0B);
        break;
      case 'MESS_OWNER':
        c = const Color(0xFF4338CA);
        break;
      default:
        c = const Color(0xFF64748B);
    }
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: c.withOpacity(0.12),
        borderRadius: BorderRadius.circular(6),
      ),
      child: Text(role.replaceAll('_', ' '),
          style: TextStyle(
              color: c, fontSize: 10, fontWeight: FontWeight.w600)),
    );
  }
}

class _StatusBadge extends StatelessWidget {
  final String label;
  final Color color;
  const _StatusBadge({required this.label, required this.color});
  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: color.withOpacity(0.12),
        borderRadius: BorderRadius.circular(6),
      ),
      child: Text(label,
          style: TextStyle(
              color: color, fontSize: 10, fontWeight: FontWeight.w600)),
    );
  }
}

class _DetailRow extends StatelessWidget {
  final String label;
  final String value;
  const _DetailRow(this.label, this.value);
  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        children: [
          SizedBox(
            width: 100,
            child: Text(label,
                style: Theme.of(context)
                    .textTheme
                    .bodySmall
                    ?.copyWith(color: Colors.grey)),
          ),
          Expanded(
            child:
                Text(value, style: Theme.of(context).textTheme.bodyMedium),
          ),
        ],
      ),
    );
  }
}
