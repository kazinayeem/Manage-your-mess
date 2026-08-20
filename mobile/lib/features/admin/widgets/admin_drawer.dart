import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../app/theme/app_colors.dart';
import '../../../app/theme/app_radius.dart';
import '../../auth/auth_provider.dart';

class AdminDrawer extends ConsumerWidget {
  final String currentRoute;
  const AdminDrawer({super.key, required this.currentRoute});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Drawer(
      backgroundColor: isDark ? AppColors.bgDark : AppColors.bgLight,
      child: Column(
        children: [
          Container(
            padding: const EdgeInsets.fromLTRB(20, 48, 20, 20),
            decoration: const BoxDecoration(
              color: AppColors.primary,
            ),
            child: Row(
              children: [
                Container(
                  width: 44,
                  height: 44,
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(AppRadius.lg),
                  ),
                  child: const Center(
                    child: Text(
                      'BM',
                      style: TextStyle(
                        color: AppColors.primary,
                        fontWeight: FontWeight.w700,
                        fontSize: 18,
                        letterSpacing: -0.3,
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
                          fontWeight: FontWeight.w700,
                          fontSize: 15,
                        ),
                      ),
                      Text(
                        'Super Admin',
                        style: TextStyle(
                          color: Colors.white.withOpacity(0.85),
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
          Expanded(
            child: ListView(
              padding: const EdgeInsets.symmetric(vertical: 8),
              children: [
                _buildSectionHeader('PLATFORM'),
                _buildDrawerItem(
                  context,
                  'Dashboard',
                  Icons.dashboard_outlined,
                  '/admin',
                ),
                _buildDrawerItem(
                  context,
                  'Users',
                  Icons.people_outline_rounded,
                  '/admin/users',
                ),
                _buildDrawerItem(
                  context,
                  'Messes',
                  Icons.home_work_outlined,
                  '/admin/messes',
                ),

                _buildSectionHeader('BILLING'),
                _buildDrawerItem(
                  context,
                  'Subscriptions',
                  Icons.card_membership_outlined,
                  '/admin/subscriptions',
                ),
                _buildDrawerItem(
                  context,
                  'Payments',
                  Icons.payment_outlined,
                  '/admin/payments',
                ),
                _buildDrawerItem(
                  context,
                  'Payment Methods',
                  Icons.account_balance_wallet_outlined,
                  '/admin/payment-methods',
                ),
                _buildDrawerItem(
                  context,
                  'Plans',
                  Icons.layers_outlined,
                  '/admin/plans',
                ),
                _buildDrawerItem(
                  context,
                  'Coupons',
                  Icons.confirmation_number_outlined,
                  '/admin/coupons',
                ),
                _buildDrawerItem(
                  context,
                  'Referrals',
                  Icons.card_giftcard_outlined,
                  '/admin/referrals',
                ),

                _buildSectionHeader('COMMUNICATION'),
                _buildDrawerItem(
                  context,
                  'Support Tickets',
                  Icons.support_agent_outlined,
                  '/admin/support',
                ),
                _buildDrawerItem(
                  context,
                  'Announcements',
                  Icons.campaign_outlined,
                  '/admin/announcements',
                ),
                _buildDrawerItem(
                  context,
                  'Email Templates',
                  Icons.email_outlined,
                  '/admin/email-templates',
                ),
                _buildDrawerItem(
                  context,
                  'Notification Templates',
                  Icons.notifications_outlined,
                  '/admin/notification-templates',
                ),

                _buildSectionHeader('ANALYTICS'),
                _buildDrawerItem(
                  context,
                  'Analytics',
                  Icons.analytics_outlined,
                  '/admin/analytics',
                ),
                _buildDrawerItem(
                  context,
                  'Audit Logs',
                  Icons.receipt_long_outlined,
                  '/admin/audit-logs',
                ),

                _buildSectionHeader('SYSTEM'),
                _buildDrawerItem(
                  context,
                  'System Settings',
                  Icons.settings_outlined,
                  '/admin/settings',
                ),
                _buildDrawerItem(
                  context,
                  'Database Monitor',
                  Icons.storage_outlined,
                  '/admin/database',
                ),
                _buildDrawerItem(
                  context,
                  'Feature Flags',
                  Icons.flag_outlined,
                  '/admin/feature-flags',
                ),
                _buildDrawerItem(
                  context,
                  'Backup Manager',
                  Icons.backup_outlined,
                  '/admin/backups',
                ),
                _buildDrawerItem(
                  context,
                  'API Management',
                  Icons.api_outlined,
                  '/admin/api',
                ),
                _buildDrawerItem(
                  context,
                  'Security Center',
                  Icons.shield_outlined,
                  '/admin/security',
                ),

                _buildSectionHeader('ACCOUNT'),
                _buildDrawerItem(
                  context,
                  'Profile',
                  Icons.person_outline_rounded,
                  '/admin/profile',
                ),
                ListTile(
                  dense: true,
                  leading: const Icon(
                    Icons.logout_rounded,
                    color: AppColors.error,
                  ),
                  title: const Text(
                    'Logout',
                    style: TextStyle(
                      color: AppColors.error,
                      fontWeight: FontWeight.w600,
                      fontSize: 13,
                    ),
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
          fontWeight: FontWeight.w700,
          color: AppColors.textFaintLight,
          letterSpacing: 1.2,
        ),
      ),
    );
  }

  Widget _buildDrawerItem(
    BuildContext context,
    String label,
    IconData icon,
    String route,
  ) {
    final bool isSelected = currentRoute == route ||
        (route != '/admin' && currentRoute.startsWith(route));

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
      child: ListTile(
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(AppRadius.md),
        ),
        selected: isSelected,
        selectedTileColor: AppColors.primarySoft,
        dense: true,
        leading: Icon(
          icon,
          size: 20,
          color: isSelected ? AppColors.primary : AppColors.textSecondaryLight,
        ),
        title: Text(
          label,
          style: TextStyle(
            fontSize: 13,
            fontWeight: isSelected ? FontWeight.w600 : FontWeight.w500,
            color: isSelected
                ? AppColors.primaryDark
                : AppColors.textPrimaryLight,
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