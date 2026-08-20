import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../app/theme/app_colors.dart';
import '../../app/theme/app_radius.dart';
import '../../core/localization/l10n.dart';
import '../../core/providers/global_providers.dart';
import '../../core/widgets/app_badge.dart';
import '../../core/widgets/app_button.dart';
import '../../core/widgets/app_card.dart';
import '../../core/widgets/app_empty_state.dart';
import '../../core/widgets/app_error_state.dart';
import '../../core/widgets/app_loading_state.dart';
import '../../core/widgets/app_text_field.dart';

final depositsListProvider = FutureProvider<List<dynamic>>((ref) async {
  final dio = ref.read(dioClientProvider).dio;
  final response = await dio.get('/deposits');
  if (response.data['success'] == true) {
    return (response.data['data'] as List?) ?? [];
  }
  throw Exception(response.data['message'] ?? 'Failed to load deposits');
});

class DepositScreen extends ConsumerWidget {
  const DepositScreen({super.key});

  void _showAddDepositModal(BuildContext context, WidgetRef ref) {
    final amountController = TextEditingController();
    final referenceController = TextEditingController();
    String selectedMethod = 'BKASH';

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      builder: (context) {
        return StatefulBuilder(
          builder: (context, setState) {
            return Padding(
              padding: EdgeInsets.only(
                top: 20,
                left: 20,
                right: 20,
                bottom: MediaQuery.of(context).viewInsets.bottom + 20,
              ),
              child: SingleChildScrollView(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'Submit Deposit',
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.w600,
                        color: AppColors.textPrimaryLight,
                      ),
                    ),
                    const SizedBox(height: 16),
                    AppTextField(
                      label: 'Amount (৳)',
                      hint: '5000',
                      keyboardType: TextInputType.number,
                      controller: amountController,
                      required: true,
                    ),
                    const SizedBox(height: 16),
                    const Text(
                      'Payment Method',
                      style: TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w500,
                        color: AppColors.textSecondaryLight,
                      ),
                    ),
                    const SizedBox(height: 6),
                    DropdownButtonFormField<String>(
                      value: selectedMethod,
                      isExpanded: true,
                      decoration: const InputDecoration(),
                      items: const [
                        DropdownMenuItem(value: 'BKASH', child: Text('bKash')),
                        DropdownMenuItem(value: 'NAGAD', child: Text('Nagad')),
                        DropdownMenuItem(value: 'ROCKET', child: Text('Rocket')),
                        DropdownMenuItem(
                          value: 'BANK_TRANSFER',
                          child: Text('Bank Transfer'),
                        ),
                        DropdownMenuItem(value: 'CASH', child: Text('Cash')),
                      ],
                      onChanged: (val) {
                        if (val != null) setState(() => selectedMethod = val);
                      },
                    ),
                    const SizedBox(height: 16),
                    AppTextField(
                      label: 'Transaction ID / Reference',
                      hint: 'TRX9827162',
                      controller: referenceController,
                    ),
                    const SizedBox(height: 20),
                    AppButton(
                      text: 'Submit Deposit',
                      onPressed: () async {
                        if (amountController.text.isEmpty) return;
                        final dio = ref.read(dioClientProvider).dio;
                        await dio.post('/deposits', data: {
                          'amount': double.parse(amountController.text),
                          'method': selectedMethod,
                          'reference': referenceController.text,
                        });
                        if (context.mounted) Navigator.pop(context);
                        ref.invalidate(depositsListProvider);
                      },
                    ),
                  ],
                ),
              ),
            );
          },
        );
      },
    );
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = AppL10n.of(context);
    final depositsAsync = ref.watch(depositsListProvider);

    return Scaffold(
      appBar: AppBar(
        titleSpacing: 16,
        title: Text(l10n.get('deposits')),
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
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => _showAddDepositModal(context, ref),
        icon: const Icon(Icons.add_rounded, size: 18),
        label: const Text(
          'Add Deposit',
          style: TextStyle(fontSize: 13, fontWeight: FontWeight.w500),
        ),
        backgroundColor: AppColors.primary,
        foregroundColor: Colors.white,
        elevation: 1,
      ),
      body: RefreshIndicator(
        onRefresh: () async => ref.invalidate(depositsListProvider),
        child: depositsAsync.when(
          loading: () => const AppLoadingState(useList: true),
          error: (err, stack) => AppErrorState(
            message: err.toString(),
            onRetry: () => ref.invalidate(depositsListProvider),
          ),
          data: (deposits) {
            if (deposits.isEmpty) {
              return const AppEmptyState(
                title: 'No Deposits Found',
                subtitle: 'Tap + Add Deposit to submit your payment',
                icon: Icons.account_balance_wallet_outlined,
              );
            }

            return ListView.separated(
              padding: const EdgeInsets.all(16),
              itemCount: deposits.length,
              separatorBuilder: (_, __) => const SizedBox(height: 8),
              itemBuilder: (context, index) {
                final item = deposits[index];
                final memberName = item['member']?['user']?['name'] ?? 'Member';
                final amount = item['amount'] ?? 0;
                final method = item['method'] ?? 'CASH';
                final status = item['status'] ?? 'APPROVED';
                final isApproved = status == 'APPROVED';
                final isPending = status == 'PENDING';

                final badgeVariant = isApproved
                    ? AppBadgeVariant.success
                    : isPending
                        ? AppBadgeVariant.warning
                        : AppBadgeVariant.destructive;

                return AppCard(
                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                  child: Row(
                    children: [
                      Container(
                        width: 38,
                        height: 38,
                        decoration: BoxDecoration(
                          color: isApproved
                              ? AppColors.successSoft
                              : AppColors.warningSoft,
                          borderRadius: BorderRadius.circular(AppRadius.md),
                        ),
                        child: Icon(
                          isApproved
                              ? Icons.check_circle_outline_rounded
                              : Icons.hourglass_top_rounded,
                          size: 18,
                          color: isApproved
                              ? AppColors.successText
                              : AppColors.warningText,
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              memberName,
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
                              'Method: $method',
                              style: const TextStyle(
                                fontSize: 12,
                                color: AppColors.textSecondaryLight,
                              ),
                            ),
                          ],
                        ),
                      ),
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.end,
                        children: [
                          Text(
                            '৳ $amount',
                            style: const TextStyle(
                              fontSize: 15,
                              fontWeight: FontWeight.w600,
                              color: AppColors.successText,
                            ),
                          ),
                          const SizedBox(height: 4),
                          AppBadge(text: status, variant: badgeVariant),
                        ],
                      ),
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
}