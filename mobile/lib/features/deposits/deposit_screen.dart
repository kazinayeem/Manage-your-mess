import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/localization/l10n.dart';
import '../../core/providers/global_providers.dart';
import '../../core/widgets/empty_view.dart';
import '../../core/widgets/error_view.dart';
import '../../core/widgets/app_button.dart';
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
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (context) {
        return StatefulBuilder(
          builder: (context, setState) {
            return Padding(
              padding: EdgeInsets.only(
                top: 24,
                left: 24,
                right: 24,
                bottom: MediaQuery.of(context).viewInsets.bottom + 24,
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Submit Deposit',
                    style: Theme.of(context).textTheme.titleLarge?.copyWith(
                          fontWeight: FontWeight.bold,
                        ),
                  ),
                  const SizedBox(height: 16),
                  AppTextField(
                    label: 'Amount (৳)',
                    hint: '5000',
                    keyboardType: TextInputType.number,
                    controller: amountController,
                  ),
                  const SizedBox(height: 16),
                  DropdownButtonFormField<String>(
                    value: selectedMethod,
                    decoration: const InputDecoration(labelText: 'Payment Method'),
                    items: const [
                      DropdownMenuItem(value: 'BKASH', child: Text('bKash')),
                      DropdownMenuItem(value: 'NAGAD', child: Text('Nagad')),
                      DropdownMenuItem(value: 'ROCKET', child: Text('Rocket')),
                      DropdownMenuItem(value: 'BANK_TRANSFER', child: Text('Bank Transfer')),
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
                  const SizedBox(height: 24),
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
                      Navigator.pop(context);
                      ref.invalidate(depositsListProvider);
                    },
                  ),
                ],
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
    final theme = Theme.of(context);

    return Scaffold(
      appBar: AppBar(
        title: Text(l10n.get('deposits')),
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => _showAddDepositModal(context, ref),
        icon: const Icon(Icons.add),
        label: const Text('Add Deposit'),
        backgroundColor: const Color(0xFF10B981),
      ),
      body: RefreshIndicator(
        onRefresh: () async => ref.invalidate(depositsListProvider),
        child: depositsAsync.when(
          loading: () => const Center(child: CircularProgressIndicator()),
          error: (err, stack) => ErrorView(
            message: err.toString(),
            onRetry: () => ref.invalidate(depositsListProvider),
          ),
          data: (deposits) {
            if (deposits.isEmpty) {
              return const EmptyView(
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

                return Card(
                  child: ListTile(
                    leading: CircleAvatar(
                      backgroundColor: Colors.green.withOpacity(0.12),
                      child: const Icon(Icons.check_circle_outline, color: Colors.green),
                    ),
                    title: Text(memberName, style: theme.textTheme.titleSmall),
                    subtitle: Text('Method: $method • Status: $status'),
                    trailing: Text(
                      '৳ $amount',
                      style: theme.textTheme.titleMedium?.copyWith(
                        fontWeight: FontWeight.bold,
                        color: Colors.green,
                      ),
                    ),
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
