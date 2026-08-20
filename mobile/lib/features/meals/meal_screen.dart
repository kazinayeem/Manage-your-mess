import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:dio/dio.dart';
import '../../app/theme/app_colors.dart';
import '../../app/theme/app_radius.dart';
import '../../core/localization/l10n.dart';
import '../../core/providers/global_providers.dart';
import '../../core/errors/app_exception.dart';
import '../../core/widgets/app_badge.dart';
import '../../core/widgets/app_card.dart';
import '../../core/widgets/app_empty_state.dart';
import '../../core/widgets/app_error_state.dart';
import '../../core/widgets/app_loading_state.dart';
import '../auth/auth_provider.dart';

final todayMealProvider = FutureProvider<Map<String, dynamic>>((ref) async {
  final authState = ref.watch(authProvider);
  final activeMessId = authState.activeMessId ??
      (authState.messes.isNotEmpty
          ? authState.messes.first['id']?.toString()
          : null);

  if (activeMessId == null || activeMessId.isEmpty) {
    return {
      'date': DateTime.now().toIso8601String(),
      'breakfast': 0,
      'lunch': 0,
      'dinner': 0,
      'entries': [],
      '_noMess': true,
    };
  }

  try {
    final dio = ref.read(dioClientProvider).dio;
    final response = await dio.get('/meals/today', queryParameters: {
      'messId': activeMessId,
    });
    if (response.data['success'] == true) {
      return response.data['data'] as Map<String, dynamic>;
    }
    throw Exception(response.data['message'] ?? 'Failed to load today meal');
  } on DioException catch (e) {
    throw AppException.fromDioError(e);
  }
});

class MealScreen extends ConsumerWidget {
  const MealScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = AppL10n.of(context);
    final mealAsync = ref.watch(todayMealProvider);

    return Scaffold(
      appBar: AppBar(
        titleSpacing: 16,
        title: Text(l10n.get('meals')),
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
      body: RefreshIndicator(
        onRefresh: () async => ref.invalidate(todayMealProvider),
        child: mealAsync.when(
          loading: () => const AppLoadingState(),
          error: (err, stack) => AppErrorState(
            message: err is AppException
                ? err.message
                : 'Something went wrong while loading meals.',
            onRetry: () => ref.invalidate(todayMealProvider),
          ),
          data: (mealData) {
            if (mealData['_noMess'] == true) {
              return SingleChildScrollView(
                physics: const AlwaysScrollableScrollPhysics(),
                child: SizedBox(
                  height: MediaQuery.of(context).size.height * 0.7,
                  child: const AppEmptyState(
                    title: 'No Mess Selected',
                    subtitle: 'Join or create a mess to start tracking meals',
                    icon: Icons.home_work_outlined,
                  ),
                ),
              );
            }

            final breakfast = mealData['breakfast'] ?? 0;
            final lunch = mealData['lunch'] ?? 0;
            final dinner = mealData['dinner'] ?? 0;
            final total = (breakfast is num ? breakfast : 0) +
                (lunch is num ? lunch : 0) +
                (dinner is num ? dinner : 0);
            final entries = (mealData['entries'] as List?) ?? [];

            return ListView(
              physics: const AlwaysScrollableScrollPhysics(),
              padding: const EdgeInsets.all(16),
              children: [
                AppCard(
                  padding: const EdgeInsets.all(20),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        l10n.get('today_meals'),
                        style: const TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.w600,
                          color: AppColors.textPrimaryLight,
                        ),
                      ),
                      const SizedBox(height: 16),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceAround,
                        children: [
                          _MealCounter(
                            label: l10n.get('breakfast'),
                            count: '$breakfast',
                            icon: Icons.free_breakfast_outlined,
                          ),
                          _MealCounter(
                            label: l10n.get('lunch'),
                            count: '$lunch',
                            icon: Icons.lunch_dining_outlined,
                          ),
                          _MealCounter(
                            label: l10n.get('dinner'),
                            count: '$dinner',
                            icon: Icons.dinner_dining_outlined,
                          ),
                        ],
                      ),
                      const SizedBox(height: 16),
                      Container(height: 1, color: AppColors.borderLight),
                      const SizedBox(height: 16),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(
                            '${l10n.get('total')}:',
                            style: const TextStyle(
                              fontSize: 15,
                              fontWeight: FontWeight.w600,
                              color: AppColors.textPrimaryLight,
                            ),
                          ),
                          Text(
                            '$total',
                            style: const TextStyle(
                              fontSize: 20,
                              fontWeight: FontWeight.w700,
                              color: AppColors.primary,
                              letterSpacing: -0.3,
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 24),
                Text(
                  'Member Meal Breakdown',
                  style: const TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.w600,
                    color: AppColors.textPrimaryLight,
                    letterSpacing: -0.2,
                  ),
                ),
                const SizedBox(height: 12),
                if (entries.isEmpty)
                  const AppCard(
                    padding: EdgeInsets.all(20),
                    child: AppEmptyState(
                      title: 'No Meal Entries Today',
                      subtitle: 'Add meal entries for mess members',
                      icon: Icons.flatware_outlined,
                    ),
                  )
                else
                  ...entries.map((entry) {
                    final memberName = entry['member']?['user']?['name'] ?? 'Member';
                    final b = entry['breakfast'] ?? 0;
                    final l = entry['lunch'] ?? 0;
                    final d = entry['dinner'] ?? 0;
                    final memberTotal = (b is num ? b : 0) +
                        (l is num ? l : 0) +
                        (d is num ? d : 0);

                    return Padding(
                      padding: const EdgeInsets.only(bottom: 8),
                      child: AppCard(
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
                              child: Center(
                                child: Text(
                                  memberName.isNotEmpty
                                      ? memberName[0].toUpperCase()
                                      : 'M',
                                  style: const TextStyle(
                                    fontWeight: FontWeight.w700,
                                    color: AppColors.primary,
                                    fontSize: 14,
                                  ),
                                ),
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
                                    'Breakfast: $b  ·  Lunch: $l  ·  Dinner: $d',
                                    style: const TextStyle(
                                      fontSize: 12,
                                      color: AppColors.textSecondaryLight,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                            AppBadge(
                              text: '$memberTotal',
                              variant: AppBadgeVariant.success,
                            ),
                          ],
                        ),
                      ),
                    );
                  }),
              ],
            );
          },
        ),
      ),
    );
  }
}

class _MealCounter extends StatelessWidget {
  final String label;
  final String count;
  final IconData icon;

  const _MealCounter({
    required this.label,
    required this.count,
    required this.icon,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Container(
          width: 44,
          height: 44,
          decoration: BoxDecoration(
            color: AppColors.primarySoft,
            borderRadius: BorderRadius.circular(AppRadius.lg),
          ),
          child: Icon(icon, size: 22, color: AppColors.primary),
        ),
        const SizedBox(height: 8),
        Text(
          count,
          style: const TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.w700,
            color: AppColors.textPrimaryLight,
          ),
        ),
        const SizedBox(height: 2),
        Text(
          label,
          style: const TextStyle(
            fontSize: 12,
            color: AppColors.textSecondaryLight,
          ),
        ),
      ],
    );
  }
}