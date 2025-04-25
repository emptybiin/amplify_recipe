import 'package:flutter/material.dart';
import 'search_engine_screen.dart';

class HomeScreen extends StatelessWidget {
  const HomeScreen({super.key});
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('제휴사 검색 엔진')),
      body: ListView(
        padding: const EdgeInsets.all(16.0),
        children: [
          ElevatedButton(
            child: const Text('아고다'),
            onPressed: () => navigateToSearch(context, 'agoda'),
          ),
          ElevatedButton(
            child: const Text('카약'),
            onPressed: () => navigateToSearch(context, 'kayak'),
          ),
          ElevatedButton(
            child: const Text('호텔스컴바인'),
            onPressed: () => navigateToSearch(context, 'hotelscombined'),
          ),
          ElevatedButton(
            child: const Text('트립닷컴 호텔'),
            onPressed: () => navigateToSearch(context, 'trip_hotels'),
          ),
          ElevatedButton(
            child: const Text('트립닷컴 항공'),
            onPressed: () => navigateToSearch(context, 'trip_flights'),
          ),
          ElevatedButton(
            child: const Text('스카이스캐너'),
            onPressed: () => navigateToSearch(context, 'skyscanner'),
          ),
        ],
      ),
    );
  }

  void navigateToSearch(BuildContext context, String engine) {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (_) => SearchEngineScreen(engine: engine),
      ),
    );
  }
}