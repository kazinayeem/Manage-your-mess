import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../auth/auth_provider.dart';

class AdminDrawer extends ConsumerWidget {
  final String currentRoute;
  const AdminDrawer({super.key, required this.currentRoute});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = Theme.of(context);

    return Drawer(
      child: Column(
        children: [
          // Header matching Web sidebar branding
          Container(
            padding: const EdgeInsets.fromLTRB(20, 48, 20, 20),
            decoration: const BoxDecoration(
              color: Color(0xFF4338CA),
            ),
            child: Row(
              children: [
                Container(
                  width: 44,
                  height: 44,
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: const Center(
                    child: Text(
                      'BM',
                      style: TextStyle(
                        color: Color(0xFF4338CA),
                        fontWeight: FontWeight.bold,
                        fontSize: 18,
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'BornoMess Manager',
                        style: TextStyle(
                          color: Colors.white,
                          fontWeight: FontWeight.bold,
                          fontSize: 16,
                        ),
                      ),
                      Text(
                        'Super Admin',
                        style: TextStyle(
                          color: Colors.white.withOpacity(0.8),
                          fontSize: 12,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),

          // Grouped navigation menu
          Expanded(
            child: ListView(
              padding: const EdgeInsets.symmetric(vertical: 8),
              children: [
                _buildSectionHeader('PLATFORM'),
                _buildDrawerItem(context, 'Dashboard', Icons.dashboard_outlined, Icons.dashboard_rounded, '/admin'),
                _buildDrawerItem(context, 'Users', Icons.people_outline_rounded, Icons.people_rounded, '/admin/users'),
                _buildDrawerItem(context, 'Messes', Icons.home_work_outlined, Icons.home_work_rounded, '/admin/messes'),

                _buildSectionHeader('BILLING'),
                _buildDrawerItem(context, 'Subscriptions', Icons.card_membership_outlined, Icons.card_membership_rounded, '/admin/subscriptions'),
                _buildDrawerItem(context, 'Payments', Icons.payment_outlined, Icons.payment_rounded, '/admin/payments'),
                _buildDrawerItem(context, 'Payment Methods', Icons.account_balance_wallet_outlined, Icons.account_balance_wallet_rounded, '/admin/payment-methods'),
                _buildDrawerItem(context, 'Plans', Icons.layers_outlined, Icons.layers_rounded, '/admin/plans'),
                _buildDrawerItem(context, 'Coupons', Icons.confirmation_number_outlined, Icons.confirmation_number_rounded, '/admin/coupons'),
                _buildDrawerItem(context, 'Referrals', Icons.card_giftcard_outlined, Icons.card_giftcard_rounded, '/admin/referrals'),

                _buildSectionHeader('COMMUNICATION'),
                _buildDrawerItem(context, 'Support Tickets', Icons.support_agent_outlined, Icons.support_agent_rounded, '/admin/support'),
                _buildDrawerItem(context, 'Announcements', Icons.campaign_outlined, Icons.campaign_rounded, '/admin/announcements'),
                _buildDrawerItem(context, 'Email Templates', Icons.email_outlined, Icons.email_rounded, '/admin/email-templates'),
                _buildDrawerItem(context, 'Notification Templates', Icons.notifications_outlined, Icons.notifications_rounded, '/admin/notification-templates'),

                _buildSectionHeader('ANALYTICS'),
                _buildDrawerItem(context, 'Analytics', Icons.analytics_outlined, Icons.analytics_rounded, '/admin/analytics'),
                _buildDrawerItem(context, 'Audit Logs', Icons.receipt_long_outlined, Icons.receipt_long_rounded, '/admin/audit-logs'),

                _buildSectionHeader('SYSTEM'),
                _buildDrawerItem(context, 'System Settings', Icons.settings_outlined, Icons.settings_rounded, '/admin/settings'),
                _buildDrawerItem(context, 'Database Monitor', Icons.storage_outlined, Icons.storage_rounded, '/admin/database'),
                _buildDrawerItem(context, 'Feature Flags', Icons.flag_outlined, Icons.flag_rounded, '/admin/feature-flags'),
                _buildDrawerItem(context, 'Backup Manager', Icons.backup_outlined, Icons.backup_rounded, '/admin/backups'),
                _buildDrawerItem(context, 'API Management', Icons.api_outlined, Icons.api_rounded, '/admin/api'),
                _buildDrawerItem(context, 'Security Center', Icons.shield_outlined, Icons.shield_rounded, '/admin/security'),

                _buildSectionHeader('ACCOUNT'),
                _buildDrawerItem(context, 'Profile', Icons.person_outline_rounded, Icons.person_rounded, '/admin/profile'),
                ListTile(
                  leading: const Icon(Icons.logout_rounded, color: Colors.red),
                  title: const Text(
                    'Logout',
                    style: TextStyle(color: Colors.red, fontWeight: FontWeight.bold, fontSize: 13),
                  ),
                  onTap: () async {
                    Navigator.of(context).pop();
                    await ref.read(authProvider.notifier).logout();
                    if (context.mounted) {
                      context.go('/login');
                    }
                  },
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSectionHeader(String title) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 6),
      child: Text(
        title,
        style: const TextStyle(
          fontSize: 10,
          fontWeight: FontWeight.bold,
          color: Color(0xFF64748B),
          letterSpacing: 1.0,
        ),
      ),
    );
  }

  Widget _buildDrawerItem(
    BuildContext context,
    String label,
    IconData icon,
    IconData activeIcon,
    String route,
  ) {
    final bool isSelected = currentRoute == route || (route != '/admin' && currentRoute.startsWith(route));

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
      child: ListTile(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
        selected: isSelected,
        selectedTileColor: const Color(0xFF4338CA).withOpacity(0.1),
        dense: true,
        leading: Icon(
          isSelected ? activeIcon : icon,
          size: 20,
          color: isSelected ? const Color(0xFF4338CA) : const Color(0xFF64748B),
        ),
        title: Text(
          label,
          style: TextStyle(
            fontSize: 13,
            fontWeight: isSelected ? FontWeight.bold : FontWeight.w500,
            color: isSelected ? const Color(0xFF4338CA) : const Color(0xFF1E293B),
          ),
        ),
        onTap: () {
          Navigator.of(context).pop();
          if (!isSelected) {
            context.go(route);
          }
        },
      ),
    );
  }
}
