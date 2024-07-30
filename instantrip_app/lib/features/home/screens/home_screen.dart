import 'package:flutter/material.dart';
import 'package:get/get.dart';
import '../../../shared/data/flight_controller.dart';

class HomeScreen extends StatelessWidget {
  final flightController = Get.put(FlightController());

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('INSTANTrip')),
      body: Obx(() {
        if (flightController.flights.isEmpty) {
          return Center(child: CircularProgressIndicator());
        }
        return ListView.builder(
          itemCount: flightController.flights.length,
          itemBuilder: (context, index) {
            final flight = flightController.flights[index];
            return ListTile(
              title: Text('${flight.arrivalAirport} - ${flight.departureDetail}'),
              subtitle: Text('Fare: ${flight.adultFare}'),
            );
          },
        );
      }),
    );
  }
}
