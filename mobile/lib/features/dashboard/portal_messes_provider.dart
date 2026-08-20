import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/providers/global_providers.dart';
import '../auth/auth_provider.dart';

class PortalMess {
  final String id;
  final String name;
  final String? logo;
  final String status;
  final String role;
  final int? memberCount;
  final String? currentMonth;
  final String? plan;
  final DateTime? lastActivity;

  const PortalMess({
    required this.id,
    required this.name,
    this.logo,
    required this.status,
    required this.role,
    this.memberCount,
    this.currentMonth,
    this.plan,
    this.lastActivity,
  });

  bool get isActive => status == 'ACTIVE';
}

/// Enriches the auth messes with member count / role from GET /messes
/// and current month label from GET /messes/:id (existing endpoints only).
final portalMessesProvider = FutureProvider<List<PortalMess>>((ref) async {
  final authState = ref.watch(authProvider);
  final baseMesses = authState.messes;
  if (baseMesses.isEmpty) return const [];

  final dio = ref.read(dioClientProvider).dio;

  Map<String, dynamic> enriched = {};
  Map<String, dynamic> details = {};

  try {
    final listRes = await dio.get('/messes');
    if (listRes.data['success'] == true) {
      for (final m in (listRes.data['data'] as List? ?? [])) {
        enriched[m['id']?.toString()] = m;
      }
    }
  } catch (_) {}

  try {
    final activeId = authState.activeMessId;
    if (activeId != null && activeId.isNotEmpty) {
      final detailRes = await dio.get('/messes/$activeId');
      if (detailRes.data['success'] == true) {
        details = detailRes.data['data'] as Map<String, dynamic>;
      }
    }
  } catch (_) {}

  return baseMesses.map<PortalMess>((m) {
    final id = m['id']?.toString() ?? '';
    final fromList = enriched[id];
    final isActiveMess = id == authState.activeMessId;
    final detail = isActiveMess ? details : <String, dynamic>{};

    return PortalMess(
      id: id,
      name: m['name']?.toString() ?? 'Mess',
      logo: m['logo']?.toString(),
      status: fromList?['status']?.toString() ?? m['status']?.toString() ?? 'ACTIVE',
      role: fromList?['role']?.toString() ?? 'MEMBER',
      memberCount: (detail['_count']?['members'] as num?)?.toInt() ??
          (fromList?['memberCount'] as num?)?.toInt(),
      currentMonth: detail['currentMonth']?['label']?.toString(),
      plan: m['subscriptionId'] == null ? 'Free' : 'Active',
      lastActivity: _parseDate(m['updatedAt']),
    );
  }).toList();
});

DateTime? _parseDate(dynamic value) {
  if (value is String) {
    return DateTime.tryParse(value);
  }
  return null;
}