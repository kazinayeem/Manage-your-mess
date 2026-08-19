import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/localization/l10n.dart';
import '../../core/providers/global_providers.dart';
import '../../core/widgets/empty_view.dart';
import '../../core/widgets/error_view.dart';
import '../../core/widgets/app_button.dart';
import '../../core/widgets/app_text_field.dart';

final bazaarTasksProvider = FutureProvider<List<dynamic>>((ref) async {
  final dio = ref.read(dioClientProvider).dio;
  final response = await dio.get('/bazaar');
  if (response.data['success'] == true) {
    return (response.data['data'] as List?) ?? [];
  }
  throw Exception(response.data['message'] ?? 'Failed to load bazaar tasks');
});

class BazaarScreen extends ConsumerWidget {
  const BazaarScreen({super.key});

  void _showAddBazaarModal(BuildContext context, WidgetRef ref) {
    final titleController = TextEditingController();
    final budgetController = TextEditingController();

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (context) {
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
                'Create Bazaar Task',
                style: Theme.of(context).textTheme.titleLarge?.copyWith(
                      fontWeight: FontWeight.bold,
                    ),
              ),
              const SizedBox(height: 16),
              AppTextField(
                label: 'Task Title',
                hint: 'Daily Bazaar (Fish & Vegetables)',
                controller: titleController,
              ),
              const SizedBox(height: 16),
              AppTextField(
                label: 'Expected Budget (৳)',
                hint: '1500',
                keyboardType: TextInputType.number,
                controller: budgetController,
              ),
              const SizedBox(height: 24),
              AppButton(
                text: 'Create Task',
                onPressed: () async {
                  if (titleController.text.isEmpty) return;
                  final dio = ref.read(dioClientProvider).dio;
                  await dio.post('/bazaar', data: {
                    'title': titleController.text,
                    'budget': double.tryParse(budgetController.text) ?? 0,
                    'date': DateTime.now().toIso8601String(),
                  });
                  Navigator.pop(context);
                  ref.invalidate(bazaarTasksProvider);
                },
              ),
            ],
          ),
        );
      },
    );
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = AppL10n.of(context);
    final tasksAsync = ref.watch(bazaarTasksProvider);
    final theme = Theme.of(context);

    return Scaffold(
      appBar: AppBar(
        title: Text(l10n.get('bazaar')),
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => _showAddBazaarModal(context, ref),
        icon: const Icon(Icons.add),
        label: const Text('Add Bazaar'),
        backgroundColor: const Color(0xFFF59E0B),
      ),
      body: RefreshIndicator(
        onRefresh: () async => ref.invalidate(bazaarTasksProvider),
        child: tasksAsync.when(
          loading: () => const Center(child: CircularProgressIndicator()),
          error: (err, stack) => ErrorView(
            message: err.toString(),
            onRetry: () => ref.invalidate(bazaarTasksProvider),
          ),
          data: (tasks) {
            if (tasks.isEmpty) {
              return const EmptyView(
                title: 'No Bazaar Tasks',
                subtitle: 'Tap + Add Bazaar to assign or record shopping',
                icon: Icons.shopping_bag_outlined,
              );
            }

            return ListView.separated(
              padding: const EdgeInsets.all(16),
              itemCount: tasks.length,
              separatorBuilder: (_, __) => const SizedBox(height: 8),
              itemBuilder: (context, index) {
                final item = tasks[index];
                final title = item['title'] ?? 'Bazaar Task';
                final budget = item['expectedBudget'] ?? 0;
                final status = item['status'] ?? 'ASSIGNED';
                final assignee = item['assignment']?['member']?['user']?['name'] ?? 'Unassigned';

                return Card(
                  child: ListTile(
                    leading: CircleAvatar(
                      backgroundColor: Colors.amber.withOpacity(0.15),
                      child: const Icon(Icons.shopping_cart_outlined, color: Colors.amber),
                    ),
                    title: Text(title, style: theme.textTheme.titleSmall),
                    subtitle: Text('Assigned: $assignee • Status: $status'),
                    trailing: Text(
                      '৳ $budget',
                      style: theme.textTheme.titleMedium?.copyWith(
                        fontWeight: FontWeight.bold,
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
