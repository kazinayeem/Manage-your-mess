import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../app/theme/app_colors.dart';
import '../../app/theme/app_radius.dart';
import '../../core/providers/global_providers.dart';
import '../../core/widgets/app_badge.dart';
import '../../core/widgets/app_card.dart';
import '../../core/widgets/app_empty_state.dart';
import '../../core/widgets/app_error_state.dart';
import '../../core/widgets/app_loading_state.dart';

final subscriptionProvider = FutureProvider<Map<String, dynamic>?>((ref) async {
  final dio = ref.read(dioClientProvider).dio;
  final response = await dio.get('/billing/subscription');
  if (response.data['success'] == true) {
    return response.data['data'] as Map<String, dynamic>?;
  }
  return null;
});

class SubscriptionScreen extends ConsumerWidget {
  const SubscriptionScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final subAsync = ref.watch(subscriptionProvider);

    return Scaffold(
      appBar: AppBar(
        titleSpacing: 0,
        title: const Text('Subscription'),
        leading: BackButton(
          onPressed: () => Navigator.of(context).maybePop(),
          color: AppColors.textPrimaryLight,
        ),
      ),
      body: RefreshIndicator(
        onRefresh: () async => ref.invalidate(subscriptionProvider),
        child: subAsync.when(
          loading: () => const AppLoadingState(),
          error: (err, stack) => AppErrorState(
            message: err.toString(),
            onRetry: () => ref.invalidate(subscriptionProvider),
          ),
          data: (sub) {
            if (sub == null) {
              return const AppEmptyState(
                title: 'No Active Subscription',
                subtitle: 'Choose a plan to upgrade your mess',
                icon: Icons.card_membership_outlined,
              );
            }

            final plan = sub['plan'] ?? {};
            final planName = plan['name'] ?? 'Free';
            final status = sub['status'] ?? 'ACTIVE';
            final periodEnd = sub['currentPeriodEnd']?.toString() ?? '';

            return ListView(
              padding: const EdgeInsets.all(16),
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
                              Icons.workspace_premium_outlined,
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
                                  planName,
                                  style: const TextStyle(
                                    fontSize: 18,
                                    fontWeight: FontWeight.w700,
                                    color: AppColors.textPrimaryLight,
                                  ),
                                ),
                                const SizedBox(height: 4),
                                AppBadge(
                                  text: status,
                                  variant: status == 'ACTIVE'
                                      ? AppBadgeVariant.success
                                      : AppBadgeVariant.warning,
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 16),
                      Container(height: 1, color: AppColors.borderLight),
                      const SizedBox(height: 16),
                      _Row(label: 'Plan', value: planName),
                      _Row(label: 'Status', value: status),
                      if (periodEnd.isNotEmpty)
                        _Row(
                          label: 'Renews on',
                          value: _formatDate(periodEnd),
                        ),
                      _Row(
                        label: 'Amount',
                        value: '৳ ${plan['price'] ?? 0}',
                      ),
                    ],
                  ),
                ),
              ],
            );
          },
        ),
      ),
    );
  }

  String _formatDate(String iso) {
    final dt = DateTime.tryParse(iso);
    if (dt == null) return iso;
    return '${dt.day}/${dt.month}/${dt.year}';
  }
}

class _Row extends StatelessWidget {
  final String label;
  final String value;

  const _Row({required this.label, required this.value});

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
              fontWeight: FontWeight.w500,
              color: AppColors.textPrimaryLight,
            ),
          ),
        ],
      ),
    );
  }
}