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

final paymentRequestsProvider = FutureProvider<List<dynamic>>((ref) async {
  final dio = ref.read(dioClientProvider).dio;
  final response = await dio.get('/billing/my-payment-requests');
  if (response.data['success'] == true) {
    return (response.data['data'] as List?) ?? [];
  }
  return [];
});

class PaymentsScreen extends ConsumerWidget {
  const PaymentsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final paymentsAsync = ref.watch(paymentRequestsProvider);

    return Scaffold(
      appBar: AppBar(
        titleSpacing: 0,
        title: const Text('Payments'),
        leading: BackButton(
          onPressed: () => Navigator.of(context).maybePop(),
          color: AppColors.textPrimaryLight,
        ),
      ),
      body: RefreshIndicator(
        onRefresh: () async => ref.invalidate(paymentRequestsProvider),
        child: paymentsAsync.when(
          loading: () => const AppLoadingState(useList: true),
          error: (err, stack) => AppErrorState(
            message: err.toString(),
            onRetry: () => ref.invalidate(paymentRequestsProvider),
          ),
          data: (items) {
            if (items.isEmpty) {
              return const AppEmptyState(
                title: 'No Payment Requests',
                subtitle: 'Your subscription payments will appear here',
                icon: Icons.payments_outlined,
              );
            }

            return ListView.separated(
              padding: const EdgeInsets.all(16),
              itemCount: items.length,
              separatorBuilder: (_, __) => const SizedBox(height: 8),
              itemBuilder: (context, index) {
                final item = items[index];
                final plan = item['plan']?['name'] ?? 'Plan';
                final amount = item['amount'] ?? 0;
                final method = item['paymentMethod']?['name'] ?? '—';
                final status = item['status'] ?? 'PENDING';
                final createdAt = item['createdAt']?.toString() ?? '';

                final badgeVariant = status == 'APPROVED'
                    ? AppBadgeVariant.success
                    : status == 'REJECTED'
                        ? AppBadgeVariant.destructive
                        : AppBadgeVariant.warning;

                return AppCard(
                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                  child: Row(
                    children: [
                      Container(
                        width: 38,
                        height: 38,
                        decoration: BoxDecoration(
                          color: AppColors.primarySoft,
                          borderRadius: BorderRadius.circular(AppRadius.md),
                        ),
                        child: const Icon(
                          Icons.payments_outlined,
                          size: 18,
                          color: AppColors.primary,
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              '$plan · ৳ $amount',
                              style: const TextStyle(
                                fontSize: 14,
                                fontWeight: FontWeight.w500,
                                color: AppColors.textPrimaryLight,
                              ),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                            const SizedBox(height: 2),
                            Text(
                              createdAt.isEmpty
                                  ? 'Method: $method'
                                  : 'Method: $method · ${_formatDate(createdAt)}',
                              style: const TextStyle(
                                fontSize: 12,
                                color: AppColors.textSecondaryLight,
                              ),
                            ),
                          ],
                        ),
                      ),
                      AppBadge(text: status, variant: badgeVariant),
                    ],
                  ),
                );
              },
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