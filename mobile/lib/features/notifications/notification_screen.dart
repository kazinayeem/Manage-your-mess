import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../app/theme/app_colors.dart';
import '../../app/theme/app_radius.dart';
import '../../core/localization/l10n.dart';
import '../../core/providers/global_providers.dart';
import '../../core/widgets/app_card.dart';
import '../../core/widgets/app_empty_state.dart';
import '../../core/widgets/app_error_state.dart';
import '../../core/widgets/app_loading_state.dart';

final notificationsListProvider = FutureProvider<Map<String, dynamic>>((ref) async {
  final dio = ref.read(dioClientProvider).dio;
  final response = await dio.get('/notifications');
  if (response.data['success'] == true) {
    return response.data['data'] as Map<String, dynamic>;
  }
  return {'notifications': [], 'unreadCount': 0};
});

class NotificationScreen extends ConsumerWidget {
  const NotificationScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = AppL10n.of(context);
    final notificationsAsync = ref.watch(notificationsListProvider);

    return Scaffold(
      appBar: AppBar(
        titleSpacing: 0,
        title: Text(l10n.get('notifications')),
        leading: BackButton(
          onPressed: () => Navigator.of(context).maybePop(),
          color: AppColors.textPrimaryLight,
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.done_all_rounded, size: 20),
            color: AppColors.primary,
            tooltip: 'Mark all as read',
            onPressed: () async {
              final dio = ref.read(dioClientProvider).dio;
              await dio.patch('/notifications/all/read');
              ref.invalidate(notificationsListProvider);
            },
          ),
          const SizedBox(width: 8),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () async => ref.invalidate(notificationsListProvider),
        child: notificationsAsync.when(
          loading: () => const AppLoadingState(useList: true),
          error: (err, stack) => AppErrorState(
            message: err.toString(),
            onRetry: () => ref.invalidate(notificationsListProvider),
          ),
          data: (data) {
            final list = (data['notifications'] as List?) ?? [];
            if (list.isEmpty) {
              return const AppEmptyState(
                title: 'No Notifications',
                subtitle: "You're all caught up!",
                icon: Icons.notifications_none_rounded,
              );
            }

            return ListView.separated(
              padding: const EdgeInsets.all(16),
              itemCount: list.length,
              separatorBuilder: (_, __) => const SizedBox(height: 8),
              itemBuilder: (context, index) {
                final item = list[index];
                final title = item['title'] ?? 'Notification';
                final msg = item['message'] ?? '';
                final isRead = item['isRead'] ?? false;

                return AppCard(
                  color: isRead ? null : AppColors.primarySoft,
                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Container(
                        width: 38,
                        height: 38,
                        decoration: BoxDecoration(
                          color: isRead
                              ? AppColors.surfaceLight
                              : AppColors.primarySurface,
                          borderRadius: BorderRadius.circular(AppRadius.md),
                        ),
                        child: Icon(
                          Icons.notifications_active_outlined,
                          size: 18,
                          color: isRead
                              ? AppColors.textSecondaryLight
                              : AppColors.primary,
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              title,
                              style: TextStyle(
                                fontSize: 14,
                                fontWeight: FontWeight.w600,
                                color: AppColors.textPrimaryLight,
                              ),
                            ),
                            if (msg.isNotEmpty) ...[
                              const SizedBox(height: 2),
                              Text(
                                msg,
                                style: const TextStyle(
                                  fontSize: 13,
                                  color: AppColors.textSecondaryLight,
                                ),
                              ),
                            ],
                          ],
                        ),
                      ),
                      if (!isRead)
                        Container(
                          width: 8,
                          height: 8,
                          margin: const EdgeInsets.only(top: 6),
                          decoration: const BoxDecoration(
                            color: AppColors.primary,
                            shape: BoxShape.circle,
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