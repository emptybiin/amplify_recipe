import '../core/app_export.dart';
import '../screen/login_screen/login_screen.dart';
import '../screen/login_screen/binding/login_binding.dart';
import '../screen/splash_screen/splash_screen.dart';
import '../screen/splash_screen/binding/splash_binding.dart';

class AppRoutes {
  static const String splashScreen = '/splash_screen';

  static const String loginScreen = '/login_screen';

  static const String initialRoute = '/initialRoute';

  static List<GetPage> pages = [
    GetPage(
      name: splashScreen,
      page: () => SplashScreen(),
      bindings: [SplashBinding()],
    ),

    GetPage(
      name: loginScreen,
      page: () => LoginScreen(),
      bindings: [LoginBinding()],
    ),

    GetPage(
      name: initialRoute,
      page: () => SplashScreen(),
      bindings: [SplashBinding()],
    )
  ];
}