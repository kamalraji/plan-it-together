/// Event venue model for normalized event_venues table
class EventVenue {
  final String id;
  final String eventId;
  final String name;
  final String? address;
  final String? city;
  final String? state;
  final String? country;
  final String? postalCode;
  final int? capacity;
  final double? latitude;
  final double? longitude;
  final List<String> accessibilityFeatures;
  final String? accessibilityNotes;
  final String? googlePlaceId;
  final DateTime createdAt;
  final DateTime updatedAt;

  const EventVenue({
    required this.id,
    required this.eventId,
    required this.name,
    this.address,
    this.city,
    this.state,
    this.country,
    this.postalCode,
    this.capacity,
    this.latitude,
    this.longitude,
    this.accessibilityFeatures = const [],
    this.accessibilityNotes,
    this.googlePlaceId,
    required this.createdAt,
    required this.updatedAt,
  });

  /// Full formatted address
  String get fullAddress {
    final parts = <String>[];
    if (address != null && address!.isNotEmpty) parts.add(address!);
    if (city != null && city!.isNotEmpty) parts.add(city!);
    if (state != null && state!.isNotEmpty) parts.add(state!);
    if (country != null && country!.isNotEmpty) parts.add(country!);
    if (postalCode != null && postalCode!.isNotEmpty) parts.add(postalCode!);
    return parts.join(', ');
  }

  /// Whether venue has coordinates for map display
  bool get hasCoordinates => latitude != null && longitude != null;

  factory EventVenue.fromJson(Map<String, dynamic> json) {
    return EventVenue(
      id: json['id'] as String,
      eventId: json['event_id'] as String,
      name: json['name'] as String,
      address: json['address'] as String?,
      city: json['city'] as String?,
      state: json['state'] as String?,
      country: json['country'] as String?,
      postalCode: json['postal_code'] as String?,
      capacity: json['capacity'] as int?,
      latitude: (json['latitude'] as num?)?.toDouble(),
      longitude: (json['longitude'] as num?)?.toDouble(),
      accessibilityFeatures: (json['accessibility_features'] as List<dynamic>?)
              ?.map((e) => e.toString())
              .toList() ??
          [],
      accessibilityNotes: json['accessibility_notes'] as String?,
      googlePlaceId: json['google_place_id'] as String?,
      createdAt: DateTime.parse(json['created_at'] as String),
      updatedAt: DateTime.parse(json['updated_at'] as String),
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'event_id': eventId,
        'name': name,
        'address': address,
        'city': city,
        'state': state,
        'country': country,
        'postal_code': postalCode,
        'capacity': capacity,
        'latitude': latitude,
        'longitude': longitude,
        'accessibility_features': accessibilityFeatures,
        'accessibility_notes': accessibilityNotes,
        'google_place_id': googlePlaceId,
        'created_at': createdAt.toIso8601String(),
        'updated_at': updatedAt.toIso8601String(),
      };

  EventVenue copyWith({
    String? id,
    String? eventId,
    String? name,
    String? address,
    String? city,
    String? state,
    String? country,
    String? postalCode,
    int? capacity,
    double? latitude,
    double? longitude,
    List<String>? accessibilityFeatures,
    String? accessibilityNotes,
    String? googlePlaceId,
    DateTime? createdAt,
    DateTime? updatedAt,
  }) =>
      EventVenue(
        id: id ?? this.id,
        eventId: eventId ?? this.eventId,
        name: name ?? this.name,
        address: address ?? this.address,
        city: city ?? this.city,
        state: state ?? this.state,
        country: country ?? this.country,
        postalCode: postalCode ?? this.postalCode,
        capacity: capacity ?? this.capacity,
        latitude: latitude ?? this.latitude,
        longitude: longitude ?? this.longitude,
        accessibilityFeatures: accessibilityFeatures ?? this.accessibilityFeatures,
        accessibilityNotes: accessibilityNotes ?? this.accessibilityNotes,
        googlePlaceId: googlePlaceId ?? this.googlePlaceId,
        createdAt: createdAt ?? this.createdAt,
        updatedAt: updatedAt ?? this.updatedAt,
      );
}
