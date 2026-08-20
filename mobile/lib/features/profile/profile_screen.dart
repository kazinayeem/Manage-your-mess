import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../app/theme/app_colors.dart';
import '../../app/theme/app_radius.dart';
import '../../core/localization/l10n.dart';
import '../auth/auth_provider.dart';
import '../../core/widgets/app_badge.dart';
import '../../core/widgets/app_card.dart';

class ProfileScreen extends ConsumerWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = AppL10n.of(context);
    final authState = ref.watch(authProvider);

    final user = authState.user;
    final name = user?['name'] ?? 'User';
    final email = user?['email'] ?? '';
    final role = user?['role'] ?? 'MEMBER';

    return Scaffold(
      appBar: AppBar(
        titleSpacing: 16,
        title: Text(l10n.get('profile')),
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
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          AppCard(
            padding: const EdgeInsets.all(20),
            child: Row(
              children: [
                Container(
                  width: 56,
                  height: 56,
                  decoration: BoxDecoration(
                    color: AppColors.primarySurface,
                    borderRadius: BorderRadius.circular(AppRadius.lg),
                  ),
                  child: Center(
                    child: Text(
                      name.isNotEmpty ? name[0].toUpperCase() : 'U',
                      style: const TextStyle(
                        fontSize: 24,
                        fontWeight: FontWeight.w700,
                        color: AppColors.primaryDark,
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        name,
                        style: const TextStyle(
                          fontSize: 17,
                          fontWeight: FontWeight.w600,
                          color: AppColors.textPrimaryLight,
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                      const SizedBox(height: 2),
                      Text(
                        email,
                        style: const TextStyle(
                          fontSize: 13,
                          color: AppColors.textSecondaryLight,
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                      const SizedBox(height: 8),
                      AppBadge(
                        text: role.replaceAll('_', ' '),
                        variant: role == 'SUPER_ADMIN'
                            ? AppBadgeVariant.destructive
                            : AppBadgeVariant.success,
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 20),
          Text(
            'Portal',
            style: const TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.w600,
              color: AppColors.textPrimaryLight,
              letterSpacing: -0.2,
            ),
          ),
          const SizedBox(height: 12),
          AppCard(
            padding: EdgeInsets.zero,
            child: Column(
              children: [
                _MenuTile(
                  icon: Icons.notifications_none_rounded,
                  title: l10n.get('notifications'),
                  onTap: () => context.push('/notifications'),
                ),
                const Divider(height: 1, indent: 64),
                _MenuTile(
                  icon: Icons.campaign_outlined,
                  title: l10n.get('announcements'),
                  onTap: () => context.push('/announcements'),
                ),
                const Divider(height: 1, indent: 64),
                _MenuTile(
                  icon: Icons.workspace_premium_outlined,
                  title: l10n.get('subscription'),
                  onTap: () => context.push('/subscription'),
                ),
                const Divider(height: 1, indent: 64),
                _MenuTile(
                  icon: Icons.payments_outlined,
                  title: l10n.get('payments'),
                  onTap: () => context.push('/payments'),
                ),
                const Divider(height: 1, indent: 64),
                _MenuTile(
                  icon: Icons.settings_outlined,
                  title: l10n.get('settings'),
                  onTap: () => context.push('/settings'),
                ),
                const Divider(height: 1, indent: 64),
                _MenuTile(
                  icon: Icons.help_outline_rounded,
                  title: l10n.get('help_center'),
                  onTap: () => context.push('/help'),
                ),
              ],
            ),
          ),
          const SizedBox(height: 20),
          AppCard(
            padding: EdgeInsets.zero,
            child: _MenuTile(
              icon: Icons.logout_rounded,
              title: l10n.get('logout'),
              iconColor: AppColors.error,
              titleColor: AppColors.error,
              onTap: () async {
                await ref.read(authProvider.notifier).logout();
                if (context.mounted) {
                  context.go('/login');
                }
              },
            ),
          ),
        ],
      ),
    );
  }
}

class _MenuTile extends StatelessWidget {
  final IconData icon;
  final String title;
  final VoidCallback? onTap;
  final Color? iconColor;
  final Color? titleColor;

  const _MenuTile({
    required this.icon,
    required this.title,
    this.onTap,
    this.iconColor,
    this.titleColor,
  });

  @override
  Widget build(BuildContext context) {
    final color = iconColor ?? AppColors.textSecondaryLight;

    return InkWell(
      onTap: onTap,
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        child: Row(
          children: [
            Container(
              width: 36,
              height: 36,
              decoration: BoxDecoration(
                color: color.withOpacity(0.1),
                borderRadius: BorderRadius.circular(AppRadius.md),
              ),
              child: Icon(icon, size: 18, color: color),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Text(
                title,
                style: TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w500,
                  color: titleColor ?? AppColors.textPrimaryLight,
                ),
              ),
            ),
            if (onTap != null)
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