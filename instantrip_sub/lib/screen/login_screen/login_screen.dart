import 'package:flutter/material.dart';
import '../../../core/app_export.dart';
import '../../widgets/custom_elevated_button.dart';
import 'controller/login_controller.dart'; // ignore_for_file: must_be_immutable

class LoginScreen extends GetWidget<LoginController> {
  const LoginScreen({Key? key})
      : super(
    key: key,
  );

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      child: Scaffold(
        extendBody: true,
        extendBodyBehindAppBar: true,
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
          child: Container(
            padding: EdgeInsets.symmetric(
              horizontal: 49.h,
              vertical: 100.v,
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                SizedBox(height: 22.v),
                SizedBox(
                  width: 197.h,
                  child: Text(
                    "내가 찾던\n최저가 항공권\n예약까지 간편하게!",
                    maxLines: 3,
                    overflow: TextOverflow.ellipsis,
                    style: CustomTextStyles.titleLargePrimary!.copyWith(height: 1.75),
                  ),
                ),
                Spacer(),
                _buildContinueWithFacebook(),
                SizedBox(height: 24.v),
                _buildContinueWithGoogle(),
                SizedBox(height: 24.v),
                _buildContinueWithApple(),
                SizedBox(height: 32.v),
                Padding(
                  padding: EdgeInsets.only(left: 1.h),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Padding(
                        padding: EdgeInsets.only(
                          top: 7.v,
                          bottom: 8.v,
                        ),
                        child:
                      ),
                      Text(
                        "또는",
                        style: CustomTextStyles.bodySmallNotoSansPrimary,
                      ),
                      Padding(
                        padding: EdgeInsets.only(
                          top: 7.v,
                          bottom: 8.v,
                        ),
                          child: Divider(height: 2,)
                      )
                    ],
                  ),
                ),
                SizedBox(height: 30.v),
                _buildLoginWithEmail()
              ],
            ),
          ),
        ),
      ),
    );
  }

  /// Section Widget
  Widget _buildContinueWithFacebook() {
    return CustomElevatedButton(
      text: "Facebook으로 계속하기",
      margin: EdgeInsets.only(left: 1.h),
      leftIcon: Container(
        // margin: EdgeInsets.only(right: 10.h),
        child: CustomImageView(
          imagePath: ImageConstant.imgFacebooksymbolpng,
          height: 20.adaptSize,
          width: 20.adaptSize,
        ),
      ),
    );
  }

  /// Section Widget
  Widget _buildContinueWithGoogle() {
    return CustomElevatedButton(
      text: "Google로 계속하기".tr,
      margin: EdgeInsets.only(left: 1.h),
      leftIcon: Container(
        margin: EdgeInsets.only(right: 30.h),
        child: CustomImageView(
          imagePath: ImageConstant.imgGooglesymbolpng,
          height: 20.adaptSize,
          width: 20.adaptSize,
        ),
      ),
    );
  }

  /// Section Widget
  Widget _buildContinueWithApple() {
    return CustomElevatedButton(
      text: "Apple로 계속하기".tr,
      margin: EdgeInsets.only(left: 1.h),
      leftIcon: Container(
        margin: EdgeInsets.only(right: 30.h),
        child: CustomImageView(
          imagePath: ImageConstant.imgApplelogopng,
          height: 20.adaptSize,
          width: 20.adaptSize,
        ),
      ),
    );
  }

  /// Section Widget
  Widget _buildLoginWithEmail() {
    return CustomElevatedButton(
      text: "이메일로 로그인",
      margin: EdgeInsets.only(left: 1.h),
      leftIcon: Container(
        margin: EdgeInsets.only(right: 30.h),
        child: CustomImageView(
          imagePath: ImageConstant.imgLocalpostoffice,
          height: 20.adaptSize,
          width: 20.adaptSize,
        ),
      ),
    );
  }
}