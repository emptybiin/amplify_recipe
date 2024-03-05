import 'dart:ffi';
import 'dart:math';

import 'package:amplify_auth_cognito/amplify_auth_cognito.dart';
import 'package:amplify_flutter/amplify_flutter.dart';
import 'package:amplify_recipe/shared/data/authentication_repository.dart';

import '../model/user.dart';

class MockAuthenticationRepository extends AuthenticationRepository {
  @override
  String get name =>
      currentUser?.name.split(' ').first ??
      (throw UserNotFoundException('User has not been retrieved yet'));

  @override
  String get fullName =>
      currentUser?.name ??
      (throw UserNotFoundException('User has not been retrieved yet'));

  @override
  String get email =>
      currentUser?.email ??
      (throw UserNotFoundException('User has not been retrieved yet'));

  @override
  Future<void> confirmUser(String email, String confirmationCode) async {
    try {
      await Amplify.Auth.confirmSignUp(
          username: email, confirmationCode: confirmationCode);
    } on AuthException catch (e) {
      safePrint('로그아웃 오류: ${e.message}');
      rethrow;
    }
  }

  @override
  Future<void> forgotPassword(String email) {
    return Future.delayed(
      const Duration(seconds: 1),
    );
  }

  @override
  Future<void> generateCurrentUserInformation() async {
    try {
      final user = await Amplify.Auth.getCurrentUser();
      final userAttrributes = await Amplify.Auth.fetchUserAttributes();
      currentUser = User(
        id: user.userId,
        name: userAttrributes
            .firstWhere(
              (element) =>
          element.userAttributeKey == CognitoUserAttributeKey.name,
        )
            .value,
        email: userAttrributes
            .firstWhere(
              (element) =>
          element.userAttributeKey == CognitoUserAttributeKey.email,
        )
            .value,
        profilePicture: userAttrributes
            .where(
              (element) =>
          element.userAttributeKey == CognitoUserAttributeKey.picture,
        )
            .firstOrNull
            ?.value,
      );
    } on AuthException catch (e) {
      safePrint('Error fetching auth session : ${e.message}');
      rethrow;
    }
  }

    @override
    Future<bool> isUserLoggedIn() async {
      try {
        final result = await Amplify.Auth.fetchAuthSession(
          options: const FetchAuthSessionOptions(forceRefresh: true),
        );
        if (result.isSignedIn) {
          await generateCurrentUserInformation();
        }
        return result.isSignedIn;
      } on AuthException catch (e) {
        safePrint('Error fetching auth session: ${e.message}');
        rethrow;
      }
    }

    @override
    Future<void> logInWithCredentials(String email, String password) async {
      try {
        final result = await Amplify.Auth.signIn(
          username: email,
          password: password,
        );
        if (!result.isSignedIn &&
            result.nextStep.signInStep == AuthSignInStep.confirmSignUp) {
          throw const UserNotConfirmedException('확인되지 않은 사용자입니다.');
        }
        await generateCurrentUserInformation();
      } on AuthException catch (e) {
        switch (e) {
          case UserNotFoundException _:
            safePrint('존재하지 않는 유저입니다.: $e');
          case UserNotConfirmedException _:
            safePrint('User is not confirmed exception: $e');
          case _:
            safePrint('An unknown error occurred: $e');
        }
        rethrow;
      }
    }

    @override
    Future<void> logInWithFacebook() {
      return Future.delayed(
        const Duration(seconds: 1),
      );
    }

    @override
    Future<void> logInWithGoogle() {
      return Future.delayed(
        const Duration(seconds: 1),
      );
    }

    @override
    Future<void> signOut() {
      return Future.delayed(
        const Duration(seconds: 1),
      );
    }

    @override
    Future<void> signUp(String email, String password, String name) async {
      try {
        await Amplify.Auth.signUp(
          username: email,
          password: password,
          options: SignUpOptions(
            userAttributes: {
              CognitoUserAttributeKey.email: email,
              CognitoUserAttributeKey.name: name,
            },
          ),
        );
      } on AuthException catch (e) {
        switch (e) {
          case UsernameExistsException _:
            safePrint('이미 존재하는 사용자입니다. $e');
          case InvalidParameterException _:
            safePrint('유효하지 않은 파라미터입니다.: $e');
          case _:
            safePrint('알 수 없는 오류가 발생했습니다.: $e');
        }
        rethrow;
      }
    }

  @override
  Future<void> confirmPasswordReset(
    String email,
    String newPassword,
    String confirmationCode,
  ) {
    return Future.delayed(
      const Duration(seconds: 1),
    );
  }
}
