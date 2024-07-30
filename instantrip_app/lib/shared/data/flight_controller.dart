import 'package:get/get.dart';
import 'flight_service.dart';

class FlightController extends GetxController {
  var flights = <Flight>[].obs;
  final FlightService _flightService = FlightService();

  @override
  void onInit() {
    super.onInit();
    flights.bindStream(_flightService.getFlights());
  }
}
