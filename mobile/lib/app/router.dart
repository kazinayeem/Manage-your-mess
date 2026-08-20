import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../features/auth/splash_screen.dart';
import '../features/auth/login_screen.dart';
import '../features/auth/register_screen.dart';
import '../features/dashboard/dashboard_screen.dart';
import '../features/dashboard/create_mess_screen.dart';
import '../features/dashboard/join_mess_screen.dart';
import '../features/dashboard/mess_detail_screen.dart';
import '../features/meals/meal_screen.dart';
import '../features/expenses/expense_screen.dart';
import '../features/deposits/deposit_screen.dart';
import '../features/bazaar/bazaar_screen.dart';
import '../features/members/member_list_screen.dart';
import '../features/analytics/analytics_screen.dart';
import '../features/notifications/notification_screen.dart';
import '../features/profile/profile_screen.dart';
import '../features/announcements/announcement_screen.dart';
import '../features/billing/subscription_screen.dart';
import '../features/billing/payments_screen.dart';
import '../features/settings/settings_screen.dart';
import '../features/help/help_center_screen.dart';

// Super Admin imports
import '../features/admin/admin_dashboard_screen.dart';
import '../features/admin/admin_users_screen.dart';
import '../features/admin/admin_user_detail_screen.dart';
import '../features/admin/admin_messes_screen.dart';
import '../features/admin/admin_mess_detail_screen.dart';
import '../features/admin/admin_screens.dart';

final GlobalKey<NavigatorState> _rootNavigatorKey = GlobalKey<NavigatorState>();

final appRouter = GoRouter(
  navigatorKey: _rootNavigatorKey,
  initialLocation: '/splash',
  routes: [
    GoRoute(
      path: '/splash',
      builder: (context, state) => const SplashScreen(),
    ),
    GoRoute(
      path: '/login',
      builder: (context, state) => const LoginScreen(),
    ),
    GoRoute(
      path: '/register',
      builder: (context, state) => const RegisterScreen(),
    ),
    GoRoute(
      path: '/create-mess',
      builder: (context, state) => const CreateMessScreen(),
    ),
    GoRoute(
      path: '/join-mess',
      builder: (context, state) => const JoinMessScreen(),
    ),
    GoRoute(
      path: '/mess/:id',
      builder: (context, state) =>
          MessDetailScreen(messId: state.pathParameters['id']!),
    ),

    // ────────────────────────────────────────────────────────────────────────
    // Super Admin Routes (Drawer-based, single shell)
    // ────────────────────────────────────────────────────────────────────────
    GoRoute(
      path: '/admin',
      builder: (context, state) => const AdminDashboardScreen(),
    ),
    GoRoute(
      path: '/admin/users',
      builder: (context, state) => const AdminUsersScreen(),
    ),
    GoRoute(
      path: '/admin/users/:id',
      builder: (context, state) {
        final id = state.pathParameters['id']!;
        return AdminUserDetailScreen(userId: id);
      },
    ),
    GoRoute(
      path: '/admin/messes',
      builder: (context, state) => const AdminMessesScreen(),
    ),
    GoRoute(
      path: '/admin/messes/:id',
      builder: (context, state) {
        final id = state.pathParameters['id']!;
        return AdminMessDetailScreen(messId: id);
      },
    ),
    GoRoute(
      path: '/admin/subscriptions',
      builder: (context, state) => const AdminSubscriptionsScreen(),
    ),
    GoRoute(
      path: '/admin/payments',
      builder: (context, state) => const AdminPaymentsScreen(),
    ),
    GoRoute(
      path: '/admin/payment-methods',
      builder: (context, state) => const AdminPaymentMethodsScreen(),
    ),
    GoRoute(
      path: '/admin/plans',
      builder: (context, state) => const AdminPlansScreen(),
    ),
    GoRoute(
      path: '/admin/coupons',
      builder: (context, state) => const AdminCouponsScreen(),
    ),
    GoRoute(
      path: '/admin/referrals',
      builder: (context, state) => const AdminReferralsScreen(),
    ),
    GoRoute(
      path: '/admin/support',
      builder: (context, state) => const AdminSupportScreen(),
    ),
    GoRoute(
      path: '/admin/announcements',
      builder: (context, state) => const AdminAnnouncementsScreen(),
    ),
    GoRoute(
      path: '/admin/analytics',
      builder: (context, state) => const AdminAnalyticsScreen(),
    ),
    GoRoute(
      path: '/admin/audit-logs',
      builder: (context, state) => const AdminAuditLogsScreen(),
    ),
    GoRoute(
      path: '/admin/settings',
      builder: (context, state) => const AdminSystemSettingsScreen(),
    ),
    GoRoute(
      path: '/admin/database',
      builder: (context, state) => const AdminDatabaseMonitorScreen(),
    ),
    GoRoute(
      path: '/admin/feature-flags',
      builder: (context, state) => const AdminFeatureFlagsScreen(),
    ),
    GoRoute(
      path: '/admin/backups',
      builder: (context, state) => const AdminBackupManagerScreen(),
    ),
    GoRoute(
      path: '/admin/api',
      builder: (context, state) => const AdminApiManagementScreen(),
    ),
    GoRoute(
      path: '/admin/email-templates',
      builder: (context, state) => const AdminEmailTemplatesScreen(),
    ),
    GoRoute(
      path: '/admin/notification-templates',
      builder: (context, state) => const AdminNotificationTemplatesScreen(),
    ),
    GoRoute(
      path: '/admin/security',
      builder: (context, state) => const AdminSecurityCenterScreen(),
    ),
    GoRoute(
      path: '/admin/profile',
      builder: (context, state) => const AdminProfileScreen(),
    ),

    // ────────────────────────────────────────────────────────────────────────
    // Regular Member Shell Route (Bottom Navigation)
    // ────────────────────────────────────────────────────────────────────────
    StatefulShellRoute.indexedStack(
      builder: (context, state, navigationShell) {
        return Scaffold(
          body: navigationShell,
          bottomNavigationBar: Container(
            decoration: BoxDecoration(
              border: Border(
                top: BorderSide(
                  color: Theme.of(context).brightness == Brightness.dark
                      ? const Color(0xFF27272A)
                      : const Color(0xFFE4E4E7),
                ),
              ),
            ),
            child: NavigationBar(
              selectedIndex: navigationShell.currentIndex,
              onDestinationSelected: (index) {
                navigationShell.goBranch(
                  index,
                  initialLocation: index == navigationShell.currentIndex,
                );
              },
              destinations: const [
                NavigationDestination(
                  icon: Icon(Icons.home_outlined),
                  selectedIcon: Icon(Icons.home_rounded),
                  label: 'Home',
                ),
                NavigationDestination(
                  icon: Icon(Icons.restaurant_outlined),
                  selectedIcon: Icon(Icons.restaurant_rounded),
                  label: 'Meals',
                ),
                NavigationDestination(
                  icon: Icon(Icons.receipt_long_outlined),
                  selectedIcon: Icon(Icons.receipt_long_rounded),
                  label: 'Expenses',
                ),
                NavigationDestination(
                  icon: Icon(Icons.shopping_bag_outlined),
                  selectedIcon: Icon(Icons.shopping_bag_rounded),
                  label: 'Bazaar',
                ),
                NavigationDestination(
                  icon: Icon(Icons.person_outline_rounded),
                  selectedIcon: Icon(Icons.person_rounded),
                  label: 'Profile',
                ),
              ],
            ),
          ),
        );
      },
      branches: [
        StatefulShellBranch(
          routes: [
            GoRoute(
              path: '/home',
              builder: (context, state) => const DashboardScreen(),
            ),
          ],
        ),
        StatefulShellBranch(
          routes: [
            GoRoute(
              path: '/meals',
              builder: (context, state) => const MealScreen(),
            ),
          ],
        ),
        StatefulShellBranch(
          routes: [
            GoRoute(
              path: '/expenses',
              builder: (context, state) => const ExpenseScreen(),
            ),
          ],
        ),
        StatefulShellBranch(
          routes: [
            GoRoute(
              path: '/bazaar',
              builder: (context, state) => const BazaarScreen(),
            ),
          ],
        ),
        StatefulShellBranch(
          routes: [
            GoRoute(
              path: '/profile',
              builder: (context, state) => const ProfileScreen(),
            ),
          ],
        ),
      ],
    ),
    GoRoute(
      path: '/deposits',
      builder: (context, state) => const DepositScreen(),
    ),
    GoRoute(
      path: '/members',
      builder: (context, state) => const MemberListScreen(),
    ),
    GoRoute(
      path: '/analytics',
      builder: (context, state) => const AnalyticsScreen(),
    ),
    GoRoute(
      path: '/notifications',
      builder: (context, state) => const NotificationScreen(),
    ),
    GoRoute(
      path: '/announcements',
      builder: (context, state) => const AnnouncementScreen(),
    ),
    GoRoute(
      path: '/subscription',
      builder: (context, state) => const SubscriptionScreen(),
    ),
    GoRoute(
      path: '/payments',
      builder: (context, state) => const PaymentsScreen(),
    ),
    GoRoute(
      path: '/settings',
      builder: (context, state) => const SettingsScreen(),
    ),
    GoRoute(
      path: '/help',
      builder: (context, state) => const HelpCenterScreen(),
    ),
  ],
);
