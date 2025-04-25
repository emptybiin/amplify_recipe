import 'package:flutter/material.dart';
import '../../../../../core/app_export.dart';

class CustomButton extends StatelessWidget {
  final String text;
  final VoidCallback onPressed;
  final bool isEnabled;
  final double height;

  const CustomButton({
    Key? key,
    required this.text,
    required this.onPressed,
    this.isEnabled = true,
    this.height = 50,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: height,
      width: double.infinity,
      child: ElevatedButton(
        onPressed: isEnabled ? onPressed : null,
        style: ElevatedButton.styleFrom(
          backgroundColor: isEnabled ? PartnerColors.primary : PartnerColors.midGray,
          textStyle: PartnerTextStyles.Bold24(),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(10),
          ),
        ),
        child: Text(text),
      ),
    );
  }
}