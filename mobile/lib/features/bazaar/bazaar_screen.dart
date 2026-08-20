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
      builder: (context) {
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
                  'Create Bazaar Task',
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.w600,
                    color: AppColors.textPrimaryLight,
                  ),
                ),
                const SizedBox(height: 16),
                AppTextField(
                  label: 'Task Title',
                  hint: 'Daily Bazaar (Fish & Vegetables)',
                  controller: titleController,
                  required: true,
                ),
                const SizedBox(height: 16),
                AppTextField(
                  label: 'Expected Budget (৳)',
                  hint: '1500',
                  keyboardType: TextInputType.number,
                  controller: budgetController,
                ),
                const SizedBox(height: 20),
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
                    if (context.mounted) Navigator.pop(context);
                    ref.invalidate(bazaarTasksProvider);
                  },
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = AppL10n.of(context);
    final tasksAsync = ref.watch(bazaarTasksProvider);

    return Scaffold(
      appBar: AppBar(
        titleSpacing: 16,
        title: Text(l10n.get('bazaar')),
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
        onPressed: () => _showAddBazaarModal(context, ref),
        icon: const Icon(Icons.add_rounded, size: 18),
        label: const Text(
          'Add Bazaar',
          style: TextStyle(fontSize: 13, fontWeight: FontWeight.w500),
        ),
        backgroundColor: AppColors.primary,
        foregroundColor: Colors.white,
        elevation: 1,
      ),
      body: RefreshIndicator(
        onRefresh: () async => ref.invalidate(bazaarTasksProvider),
        child: tasksAsync.when(
          loading: () => const AppLoadingState(useList: true),
          error: (err, stack) => AppErrorState(
            message: err.toString(),
            onRetry: () => ref.invalidate(bazaarTasksProvider),
          ),
          data: (tasks) {
            if (tasks.isEmpty) {
              return const AppEmptyState(
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
                final assignee =
                    item['assignment']?['member']?['user']?['name'] ?? 'Unassigned';

                final isDone = status == 'COMPLETED';
                final badgeVariant = isDone
                    ? AppBadgeVariant.success
                    : status == 'PENDING'
                        ? AppBadgeVariant.warning
                        : AppBadgeVariant.info;

                return AppCard(
                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                  child: Row(
                    children: [
                      Container(
                        width: 38,
                        height: 38,
                        decoration: BoxDecoration(
                          color: AppColors.warningSoft,
                          borderRadius: BorderRadius.circular(AppRadius.md),
                        ),
                        child: const Icon(
                          Icons.shopping_cart_outlined,
                          size: 18,
                          color: AppColors.warningText,
                        ),
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
                                fontWeight: FontWeight.w500,
                                color: AppColors.textPrimaryLight,
                              ),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                            const SizedBox(height: 2),
                            Text(
                              'Assigned: $assignee',
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
                            '৳ $budget',
                            style: const TextStyle(
                              fontSize: 15,
                              fontWeight: FontWeight.w600,
                              color: AppColors.textPrimaryLight,
                            ),
                          ),
                          const SizedBox(height: 4),
                          AppBadge(
                            text: status.replaceAll('_', ' '),
                            variant: badgeVariant,
                          ),
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