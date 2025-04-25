import 'package:flutter/material.dart';
import '../../../../../core/app_export.dart';

class CustomDialog extends StatelessWidget {
  final String title;
  final String content;
  final String cancelText;
  final String confirmText;
  final VoidCallback onConfirm;
  final VoidCallback? onCancel;

  const CustomDialog({
    Key? key,
    required this.title,
    required this.content,
    required this.cancelText,
    required this.confirmText,
    required this.onConfirm,
    this.onCancel,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      backgroundColor: PartnerColors.white,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
      ),
      titlePadding: const EdgeInsets.fromLTRB(24, 24, 24, 0),
      contentPadding: const EdgeInsets.fromLTRB(24, 20, 24, 24),
      actionsPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      title: Text(
        title,
        style: PartnerTextStyles.Bold20().copyWith(color: PartnerColors.partnerBlack),
      ),
      content: Text(
        content,
        style: PartnerTextStyles.Regular16().copyWith(color: PartnerColors.partnerBlack),
      ),
      actions: [
        TextButton(
          onPressed: onCancel ?? () => Navigator.of(context).pop(),
          style: TextButton.styleFrom(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
          ),
          child: Text(
            cancelText,
            style: PartnerTextStyles.Medium14().copyWith(color: PartnerColors.primary),
          ),
        ),
        ElevatedButton(
          onPressed: onConfirm,
          style: ElevatedButton.styleFrom(
            backgroundColor: PartnerColors.primary,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(12),
            ),
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
          ),
          child: Text(
            confirmText,
            style: PartnerTextStyles.Medium14().copyWith(color: PartnerColors.white),
          ),
        ),
      ],
    );
  }
}