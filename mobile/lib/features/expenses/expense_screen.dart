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

final expensesListProvider = FutureProvider<List<dynamic>>((ref) async {
  final dio = ref.read(dioClientProvider).dio;
  final response = await dio.get('/expenses');
  if (response.data['success'] == true) {
    return (response.data['data'] as List?) ?? [];
  }
  throw Exception(response.data['message'] ?? 'Failed to load expenses');
});

final expenseCategoriesProvider = FutureProvider<List<dynamic>>((ref) async {
  final dio = ref.read(dioClientProvider).dio;
  final response = await dio.get('/expenses/categories');
  if (response.data['success'] == true) {
    return (response.data['data'] as List?) ?? [];
  }
  return [];
});

class ExpenseScreen extends ConsumerWidget {
  const ExpenseScreen({super.key});

  void _showAddExpenseModal(BuildContext context, WidgetRef ref) {
    final categoriesAsync = ref.read(expenseCategoriesProvider);
    final amountController = TextEditingController();
    final descController = TextEditingController();
    String? selectedCategoryId;

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
                      'Add New Expense',
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.w600,
                        color: AppColors.textPrimaryLight,
                      ),
                    ),
                    const SizedBox(height: 16),
                    AppTextField(
                      label: 'Amount (৳)',
                      hint: '1250',
                      keyboardType: TextInputType.number,
                      controller: amountController,
                      required: true,
                    ),
                    const SizedBox(height: 16),
                    categoriesAsync.when(
                      data: (cats) {
                        if (selectedCategoryId == null && cats.isNotEmpty) {
                          selectedCategoryId = cats.first['id'];
                        }
                        return Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text(
                              'Category',
                              style: TextStyle(
                                fontSize: 14,
                                fontWeight: FontWeight.w500,
                                color: AppColors.textSecondaryLight,
                              ),
                            ),
                            const SizedBox(height: 6),
                            DropdownButtonFormField<String>(
                              value: selectedCategoryId,
                              isExpanded: true,
                              decoration: const InputDecoration(hintText: 'Select category'),
                              items: cats.map<DropdownMenuItem<String>>((c) {
                                return DropdownMenuItem(
                                  value: c['id'],
                                  child: Text(
                                    c['name'],
                                    style: const TextStyle(fontSize: 14),
                                  ),
                                );
                              }).toList(),
                              onChanged: (val) {
                                setState(() => selectedCategoryId = val);
                              },
                            ),
                          ],
                        );
                      },
                      loading: () => const Padding(
                        padding: EdgeInsets.all(12),
                        child: Center(
                          child: SizedBox(
                            width: 20,
                            height: 20,
                            child: CircularProgressIndicator(
                              strokeWidth: 2,
                              color: AppColors.primary,
                            ),
                          ),
                        ),
                      ),
                      error: (_, __) => const SizedBox(),
                    ),
                    const SizedBox(height: 16),
                    AppTextField(
                      label: 'Description',
                      hint: 'Vegetables & Rice',
                      controller: descController,
                    ),
                    const SizedBox(height: 20),
                    AppButton(
                      text: 'Save Expense',
                      onPressed: () async {
                        if (amountController.text.isEmpty || selectedCategoryId == null) {
                          return;
                        }
                        final dio = ref.read(dioClientProvider).dio;
                        await dio.post('/expenses', data: {
                          'amount': double.parse(amountController.text),
                          'categoryId': selectedCategoryId,
                          'description': descController.text,
                        });
                        if (context.mounted) Navigator.pop(context);
                        ref.invalidate(expensesListProvider);
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
    final expensesAsync = ref.watch(expensesListProvider);

    return Scaffold(
      appBar: AppBar(
        titleSpacing: 16,
        title: Text(l10n.get('expenses')),
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
        onPressed: () => _showAddExpenseModal(context, ref),
        icon: const Icon(Icons.add_rounded, size: 18),
        label: const Text(
          'Add Expense',
          style: TextStyle(fontSize: 13, fontWeight: FontWeight.w500),
        ),
        backgroundColor: AppColors.primary,
        foregroundColor: Colors.white,
        elevation: 1,
      ),
      body: RefreshIndicator(
        onRefresh: () async => ref.invalidate(expensesListProvider),
        child: expensesAsync.when(
          loading: () => const AppLoadingState(useList: true),
          error: (err, stack) => AppErrorState(
            message: err.toString(),
            onRetry: () => ref.invalidate(expensesListProvider),
          ),
          data: (expenses) {
            if (expenses.isEmpty) {
              return const AppEmptyState(
                title: 'No Expenses Recorded',
                subtitle: 'Tap + Add Expense to create your first entry',
                icon: Icons.receipt_long_outlined,
              );
            }

            return ListView.separated(
              padding: const EdgeInsets.all(16),
              itemCount: expenses.length,
              separatorBuilder: (_, __) => const SizedBox(height: 8),
              itemBuilder: (context, index) {
                final item = expenses[index];
                final category = item['category']?['name'] ?? 'General';
                final amount = item['amount'] ?? 0;
                final desc = item['description'] ?? category;
                final dateStr = item['date'] != null
                    ? DateTime.parse(item['date']).toString().split(' ')[0]
                    : '';

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
                          Icons.shopping_bag_outlined,
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
                              desc,
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
                              dateStr.isEmpty ? category : '$category · $dateStr',
                              style: const TextStyle(
                                fontSize: 12,
                                color: AppColors.textSecondaryLight,
                              ),
                            ),
                          ],
                        ),
                      ),
                      Text(
                        '৳ $amount',
                        style: const TextStyle(
                          fontSize: 15,
                          fontWeight: FontWeight.w600,
                          color: AppColors.error,
                        ),
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