import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/localization/l10n.dart';
import '../../core/providers/global_providers.dart';
import '../../core/widgets/empty_view.dart';
import '../../core/widgets/error_view.dart';
import '../../core/widgets/app_button.dart';
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
                    'Add New Expense',
                    style: Theme.of(context).textTheme.titleLarge?.copyWith(
                          fontWeight: FontWeight.bold,
                        ),
                  ),
                  const SizedBox(height: 16),
                  AppTextField(
                    label: 'Amount (৳)',
                    hint: '1250',
                    keyboardType: TextInputType.number,
                    controller: amountController,
                  ),
                  const SizedBox(height: 16),
                  categoriesAsync.when(
                    data: (cats) {
                      if (selectedCategoryId == null && cats.isNotEmpty) {
                        selectedCategoryId = cats.first['id'];
                      }
                      return DropdownButtonFormField<String>(
                        value: selectedCategoryId,
                        decoration: const InputDecoration(labelText: 'Category'),
                        items: cats.map<DropdownMenuItem<String>>((c) {
                          return DropdownMenuItem(
                            value: c['id'],
                            child: Text(c['name']),
                          );
                        }).toList(),
                        onChanged: (val) {
                          setState(() => selectedCategoryId = val);
                        },
                      );
                    },
                    loading: () => const CircularProgressIndicator(),
                    error: (_, __) => const SizedBox(),
                  ),
                  const SizedBox(height: 16),
                  AppTextField(
                    label: 'Description',
                    hint: 'Vegetables & Rice',
                    controller: descController,
                  ),
                  const SizedBox(height: 24),
                  AppButton(
                    text: 'Save Expense',
                    onPressed: () async {
                      if (amountController.text.isEmpty || selectedCategoryId == null) return;
                      final dio = ref.read(dioClientProvider).dio;
                      await dio.post('/expenses', data: {
                        'amount': double.parse(amountController.text),
                        'categoryId': selectedCategoryId,
                        'description': descController.text,
                      });
                      Navigator.pop(context);
                      ref.invalidate(expensesListProvider);
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
    final expensesAsync = ref.watch(expensesListProvider);
    final theme = Theme.of(context);

    return Scaffold(
      appBar: AppBar(
        title: Text(l10n.get('expenses')),
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => _showAddExpenseModal(context, ref),
        icon: const Icon(Icons.add),
        label: const Text('Add Expense'),
        backgroundColor: theme.primaryColor,
      ),
      body: RefreshIndicator(
        onRefresh: () async => ref.invalidate(expensesListProvider),
        child: expensesAsync.when(
          loading: () => const Center(child: CircularProgressIndicator()),
          error: (err, stack) => ErrorView(
            message: err.toString(),
            onRetry: () => ref.invalidate(expensesListProvider),
          ),
          data: (expenses) {
            if (expenses.isEmpty) {
              return const EmptyView(
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

                return Card(
                  child: ListTile(
                    leading: CircleAvatar(
                      backgroundColor: theme.primaryColor.withOpacity(0.1),
                      child: Icon(Icons.shopping_bag_outlined, color: theme.primaryColor),
                    ),
                    title: Text(desc, style: theme.textTheme.titleSmall),
                    subtitle: Text('$category • $dateStr'),
                    trailing: Text(
                      '৳ $amount',
                      style: theme.textTheme.titleMedium?.copyWith(
                        fontWeight: FontWeight.bold,
                        color: Colors.redAccent,
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
