import 'package:cloud_firestore/cloud_firestore.dart';

class FlightService {
  final FirebaseFirestore _db = FirebaseFirestore.instance;

  Stream<List<Flight>> getFlights() {
    return _db.collection('flights').snapshots().map((snapshot) =>
        snapshot.docs.map((doc) => Flight.fromFirestore(doc)).toList());
  }
}

class Flight {
  final String id;
  final String arrivalAirport;
  final String departureDetail;
  final int adultFare;

  Flight({required this.id, required this.arrivalAirport, required this.departureDetail, required this.adultFare});

  factory Flight.fromFirestore(DocumentSnapshot doc) {
    Map data = doc.data() as Map;
    return Flight(
      id: doc.id,
      arrivalAirport: data['arrival_airport'] ?? '',
      departureDetail: data['departure_detail'] ?? '',
      adultFare: data['adult_fare'] ?? 0,
    );
  }
}
