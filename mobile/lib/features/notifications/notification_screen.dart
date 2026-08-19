import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/localization/l10n.dart';
import '../../core/providers/global_providers.dart';
import '../../core/widgets/empty_view.dart';
import '../../core/widgets/error_view.dart';

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
    final theme = Theme.of(context);

    return Scaffold(
      appBar: AppBar(
        title: Text(l10n.get('notifications')),
        actions: [
          IconButton(
            icon: const Icon(Icons.done_all),
            tooltip: 'Mark all as read',
            onPressed: () async {
              final dio = ref.read(dioClientProvider).dio;
              await dio.patch('/notifications/all/read');
              ref.invalidate(notificationsListProvider);
            },
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () async => ref.invalidate(notificationsListProvider),
        child: notificationsAsync.when(
          loading: () => const Center(child: CircularProgressIndicator()),
          error: (err, stack) => ErrorView(
            message: err.toString(),
            onRetry: () => ref.invalidate(notificationsListProvider),
          ),
          data: (data) {
            final list = (data['notifications'] as List?) ?? [];
            if (list.isEmpty) {
              return const EmptyView(
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

                return Card(
                  color: isRead ? null : theme.primaryColor.withOpacity(0.04),
                  child: ListTile(
                    leading: CircleAvatar(
                      backgroundColor: theme.primaryColor.withOpacity(0.12),
                      child: Icon(Icons.notifications_active_outlined, color: theme.primaryColor),
                    ),
                    title: Text(title, style: theme.textTheme.titleSmall),
                    subtitle: Text(msg),
                    trailing: isRead
                        ? null
                        : Container(
                            width: 10,
                            height: 10,
                            decoration: BoxDecoration(
                              color: theme.primaryColor,
                              shape: BoxShape.circle,
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
