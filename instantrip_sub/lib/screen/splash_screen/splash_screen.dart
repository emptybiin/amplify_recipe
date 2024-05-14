import 'package:flutter/material.dart';
import '../../../core/app_export.dart';
import 'package:instantrip_sub/screen/splash_screen/controller/splash_controller.dart';

class SplashScreen extends GetWidget<SplashController> {
  const SplashScreen({Key? key})
      : super(
          key: key,
        );

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      child: Scaffold(
        body: Container(
          width: SizeUtils.width,
          height: SizeUtils.height,
          decoration: BoxDecoration(
            gradient: LinearGradient(
              begin: Alignment(0.5, 0),
              end: Alignment(0.5, 1),
              colors: [appTheme.blue300, appTheme.blueA40001],
            ),
          ),
          padding: EdgeInsets.only(top: 291.v),
          child: Column(
            children: [
              CustomImageView(
                imagePath: ImageConstant.imgLogo,
                height: 92.v,
                width: 136.h,
              ),
              SizedBox(height: 32.v),
              CustomImageView(
                imagePath: ImageConstant.imgLogotyepWhiteVer,
                height: 26.v,
                width: 136.h,
              ),
              SizedBox(height: 5.v)
            ],
          ),
        ),
      ),
    );
  }
}
