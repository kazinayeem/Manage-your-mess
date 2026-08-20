import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../app/theme/app_colors.dart';
import '../../app/theme/app_radius.dart';
import '../../core/localization/l10n.dart';
import '../../core/providers/global_providers.dart';
import '../../core/widgets/app_badge.dart';
import '../../core/widgets/app_card.dart';
import '../../core/widgets/app_error_state.dart';
import '../../core/widgets/app_loading_state.dart';
import '../../core/widgets/app_button.dart';

final messDetailProvider = FutureProvider.family<Map<String, dynamic>, String>(
  (ref, messId) async {
    final dio = ref.read(dioClientProvider).dio;
    final response = await dio.get('/messes/$messId');
    if (response.data['success'] == true) {
      return response.data['data'] as Map<String, dynamic>;
    }
    throw Exception(response.data['message'] ?? 'Failed to load mess');
  },
);

class MessDetailScreen extends ConsumerWidget {
  final String messId;

  const MessDetailScreen({super.key, required this.messId});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = AppL10n.of(context);
    final messAsync = ref.watch(messDetailProvider(messId));

    return Scaffold(
      appBar: AppBar(
        titleSpacing: 0,
        title: const Text('Mess Details'),
        leading: BackButton(
          onPressed: () => Navigator.of(context).maybePop(),
          color: AppColors.textPrimaryLight,
        ),
      ),
      body: RefreshIndicator(
        onRefresh: () async => ref.invalidate(messDetailProvider(messId)),
        child: messAsync.when(
          loading: () => const AppLoadingState(),
          error: (err, stack) => AppErrorState(
            message: err.toString(),
            onRetry: () => ref.invalidate(messDetailProvider(messId)),
          ),
          data: (mess) {
            final name = mess['name'] ?? 'Mess';
            final description = mess['description']?.toString() ?? '';
            final address = mess['address']?.toString();
            final status = mess['status'] ?? 'ACTIVE';
            final inviteCode = mess['inviteCode']?.toString();
            final ownerName = mess['owner']?['name']?.toString() ?? '-';
            final managerName = mess['manager']?['name']?.toString() ?? '-';
            final memberCount = mess['_count']?['members'] ?? 0;
            final currentMonth = mess['currentMonth']?['label']?.toString() ?? '-';

            return SingleChildScrollView(
              physics: const AlwaysScrollableScrollPhysics(),
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  AppCard(
                    padding: const EdgeInsets.all(20),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Container(
                              width: 48,
                              height: 48,
                              decoration: BoxDecoration(
                                color: AppColors.primarySurface,
                                borderRadius: BorderRadius.circular(AppRadius.lg),
                              ),
                              child: const Icon(
                                Icons.home_work_outlined,
                                color: AppColors.primaryDark,
                                size: 24,
                              ),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    name,
                                    style: const TextStyle(
                                      fontSize: 18,
                                      fontWeight: FontWeight.w600,
                                      color: AppColors.textPrimaryLight,
                                    ),
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                  const SizedBox(height: 4),
                                  AppBadge(
                                    text: status,
                                    variant: status == 'ACTIVE'
                                        ? AppBadgeVariant.default_
                                        : AppBadgeVariant.secondary,
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                        if (description.isNotEmpty) ...[
                          const SizedBox(height: 16),
                          Text(
                            description,
                            style: const TextStyle(
                              fontSize: 14,
                              color: AppColors.textSecondaryLight,
                            ),
                          ),
                        ],
                        if (address != null && address.isNotEmpty) ...[
                          const SizedBox(height: 8),
                          Row(
                            children: [
                              const Icon(
                                Icons.place_outlined,
                                size: 16,
                                color: AppColors.textFaintLight,
                              ),
                              const SizedBox(width: 6),
                              Expanded(
                                child: Text(
                                  address,
                                  style: const TextStyle(
                                    fontSize: 13,
                                    color: AppColors.textFaintLight,
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ],
                        const SizedBox(height: 16),
                        Container(
                          width: double.infinity,
                          height: 1,
                          color: AppColors.borderLight,
                        ),
                        const SizedBox(height: 16),
                        Row(
                          children: [
                            _DetailCell(
                              label: l10n.get('members'),
                              value: '$memberCount',
                            ),
                            _DetailCell(label: l10n.get('month'), value: currentMonth),
                            _DetailCell(label: 'Manager', value: managerName),
                          ],
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 16),
                  if (inviteCode != null && inviteCode.isNotEmpty) ...[
                    AppCard(
                      padding: const EdgeInsets.all(16),
                      child: Row(
                        children: [
                          const Icon(
                            Icons.key_outlined,
                            size: 18,
                            color: AppColors.textSecondaryLight,
                          ),
                          const SizedBox(width: 10),
                          const Text(
                            'Invite Code',
                            style: TextStyle(
                              fontSize: 14,
                              color: AppColors.textSecondaryLight,
                            ),
                          ),
                          const Spacer(),
                          Text(
                            inviteCode,
                            style: const TextStyle(
                              fontSize: 14,
                              fontWeight: FontWeight.w600,
                              color: AppColors.primary,
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 16),
                  ],
                  Text(
                    'Mess Management',
                    style: const TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.w600,
                      color: AppColors.textPrimaryLight,
                      letterSpacing: -0.2,
                    ),
                  ),
                  const SizedBox(height: 12),
                  _SectionTile(
                    icon: Icons.restaurant_menu_rounded,
                    label: l10n.get('meals'),
                    onTap: () => context.push('/meals'),
                  ),
                  _SectionTile(
                    icon: Icons.receipt_long_outlined,
                    label: l10n.get('expenses'),
                    onTap: () => context.push('/expenses'),
                  ),
                  _SectionTile(
                    icon: Icons.shopping_bag_outlined,
                    label: l10n.get('bazaar'),
                    onTap: () => context.push('/bazaar'),
                  ),
                  _SectionTile(
                    icon: Icons.account_balance_wallet_outlined,
                    label: l10n.get('deposits'),
                    onTap: () => context.push('/deposits'),
                  ),
                  _SectionTile(
                    icon: Icons.people_alt_outlined,
                    label: l10n.get('members'),
                    onTap: () => context.push('/members'),
                  ),
                  _SectionTile(
                    icon: Icons.insights_outlined,
                    label: l10n.get('analytics'),
                    onTap: () => context.push('/analytics'),
                  ),
                  const SizedBox(height: 24),
                  Text(
                    'Owner: $ownerName',
                    style: const TextStyle(
                      fontSize: 12,
                      color: AppColors.textFaintLight,
                    ),
                  ),
                ],
              ),
            );
          },
        ),
      ),
    );
  }
}

class _DetailCell extends StatelessWidget {
  final String label;
  final String value;

  const _DetailCell({required this.label, required this.value});

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            label,
            style: const TextStyle(
              fontSize: 12,
              color: AppColors.textSecondaryLight,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            value,
            style: const TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.w500,
              color: AppColors.textPrimaryLight,
            ),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
        ],
      ),
    );
  }
}

class _SectionTile extends StatelessWidget {
  final IconData icon;
  final String label;
  final VoidCallback onTap;

  const _SectionTile({required this.icon, required this.label, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: AppCard(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
        onTap: onTap,
        child: Row(
          children: [
            Container(
              width: 36,
              height: 36,
              decoration: BoxDecoration(
                color: AppColors.primarySoft,
                borderRadius: BorderRadius.circular(AppRadius.md),
              ),
              child: Icon(icon, size: 18, color: AppColors.primary),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Text(
                label,
                style: const TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w500,
                  color: AppColors.textPrimaryLight,
                ),
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