import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:dio/dio.dart';
import '../../app/theme/app_colors.dart';
import '../../core/providers/global_providers.dart';
import '../../core/widgets/app_button.dart';
import '../../core/widgets/app_card.dart';
import '../../core/widgets/app_error_state.dart';
import '../../core/widgets/app_text_field.dart';
import '../auth/auth_provider.dart';

class CreateMessScreen extends ConsumerStatefulWidget {
  const CreateMessScreen({super.key});

  @override
  ConsumerState<CreateMessScreen> createState() => _CreateMessScreenState();
}

class _CreateMessScreenState extends ConsumerState<CreateMessScreen> {
  final _formKey = GlobalKey<FormState>();
  final _nameController = TextEditingController();
  final _descriptionController = TextEditingController();
  final _addressController = TextEditingController();
  bool _isSubmitting = false;
  String? _error;

  @override
  void dispose() {
    _nameController.dispose();
    _descriptionController.dispose();
    _addressController.dispose();
    super.dispose();
  }

  Future<void> _onCreate() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() {
      _isSubmitting = true;
      _error = null;
    });

    try {
      final dio = ref.read(dioClientProvider).dio;
      final response = await dio.post('/messes', data: {
        'name': _nameController.text.trim(),
        'description': _descriptionController.text.trim(),
        'address': _addressController.text.trim(),
      });

      if (response.data['success'] == true) {
        await ref.read(authProvider.notifier).checkAuthStatus();
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Mess created successfully'),
              backgroundColor: AppColors.success,
            ),
          );
          context.go('/home');
        }
      } else {
        setState(() {
          _error = response.data['message'] ?? 'Failed to create mess';
        });
      }
    } on DioException catch (e) {
      setState(() => _error = 'Failed to create mess. Please try again.');
    } catch (e) {
      setState(() => _error = 'Something went wrong. Please try again.');
    } finally {
      if (mounted) setState(() => _isSubmitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        titleSpacing: 0,
        title: const Text('Create Mess'),
        leading: BackButton(
          onPressed: () => Navigator.of(context).maybePop(),
          color: AppColors.textPrimaryLight,
        ),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Form(
          key: _formKey,
          child: AppCard(
            padding: const EdgeInsets.all(20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Set up your mess',
                  style: TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.w700,
                    color: AppColors.textPrimaryLight,
                    letterSpacing: -0.3,
                  ),
                ),
                const SizedBox(height: 4),
                const Text(
                  'You\'ll become the Manager and Owner.',
                  style: TextStyle(
                    fontSize: 13,
                    color: AppColors.textSecondaryLight,
                  ),
                ),
                const SizedBox(height: 20),
                if (_error != null) ...[
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: AppColors.errorSoft,
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Text(
                      _error!,
                      style: const TextStyle(
                        color: AppColors.errorText,
                        fontSize: 13,
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),
                ],
                AppTextField(
                  label: 'Mess Name',
                  hint: 'Green View Mess',
                  controller: _nameController,
                  prefixIcon: Icons.home_work_outlined,
                  required: true,
                  validator: (val) =>
                      val == null || val.trim().isEmpty ? 'Mess name is required' : null,
                ),
                const SizedBox(height: 16),
                AppTextField(
                  label: 'Description',
                  hint: 'A short description of your mess',
                  controller: _descriptionController,
                  prefixIcon: Icons.notes_outlined,
                  maxLines: 3,
                ),
                const SizedBox(height: 16),
                AppTextField(
                  label: 'Address',
                  hint: 'House 12, Road 5, Dhanmondi',
                  controller: _addressController,
                  prefixIcon: Icons.place_outlined,
                ),
                const SizedBox(height: 24),
                AppButton(
                  text: 'Create Mess',
                  icon: Icons.add_circle_outline_rounded,
                  isLoading: _isSubmitting,
                  onPressed: _onCreate,
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}