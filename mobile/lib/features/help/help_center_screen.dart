import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../app/theme/app_colors.dart';
import '../../app/theme/app_radius.dart';
import '../../core/widgets/app_card.dart';

class HelpCenterScreen extends StatelessWidget {
  const HelpCenterScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        titleSpacing: 0,
        title: const Text('Help Center'),
        leading: BackButton(
          onPressed: () => Navigator.of(context).maybePop(),
          color: AppColors.textPrimaryLight,
        ),
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          const Text(
            'How can we help?',
            style: TextStyle(
              fontSize: 22,
              fontWeight: FontWeight.w700,
              color: AppColors.textPrimaryLight,
              letterSpacing: -0.3,
            ),
          ),
          const SizedBox(height: 4),
          const Text(
            'Find answers about BornoMess Manager',
            style: TextStyle(
              fontSize: 13,
              color: AppColors.textSecondaryLight,
            ),
          ),
          const SizedBox(height: 20),
          _HelpTile(
            icon: Icons.home_work_outlined,
            title: 'Create a Mess',
            subtitle: 'Set up your mess and become the manager',
          ),
          _HelpTile(
            icon: Icons.group_add_outlined,
            title: 'Join a Mess',
            subtitle: 'Use an invite code to join an existing mess',
          ),
          _HelpTile(
            icon: Icons.restaurant_menu_outlined,
            title: 'Track Meals',
            subtitle: 'Record breakfast, lunch and dinner daily',
          ),
          _HelpTile(
            icon: Icons.receipt_long_outlined,
            title: 'Expenses & Bazaar',
            subtitle: 'Log spending and assign bazaar tasks',
          ),
          _HelpTile(
            icon: Icons.account_balance_wallet_outlined,
            title: 'Deposits & Dues',
            subtitle: 'Submit deposits and review balances',
          ),
          _HelpTile(
            icon: Icons.support_agent_rounded,
            title: 'Contact Support',
            subtitle: 'support@bornomess.com',
            onTap: () {
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('Contact support@bornomess.com')),
              );
            },
          ),
        ],
      ),
    );
  }
}

class _HelpTile extends StatelessWidget {
  final IconData icon;
  final String title;
  final String subtitle;
  final VoidCallback? onTap;

  const _HelpTile({
    required this.icon,
    required this.title,
    required this.subtitle,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: AppCard(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        onTap: onTap,
        child: Row(
          children: [
            Container(
              width: 40,
              height: 40,
              decoration: BoxDecoration(
                color: AppColors.primarySoft,
                borderRadius: BorderRadius.circular(AppRadius.lg),
              ),
              child: Icon(icon, size: 20, color: AppColors.primary),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: const TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w600,
                      color: AppColors.textPrimaryLight,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    subtitle,
                    style: const TextStyle(
                      fontSize: 12,
                      color: AppColors.textSecondaryLight,
                    ),
                  ),
                ],
              ),
            ),
            const Icon(
              Icons.chevron_right_rounded,
              size: 20,
              color: AppColors.textFaintLight,
            ),
          ],
        ),
      ),
    );
  }
}