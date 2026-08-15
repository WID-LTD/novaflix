class StreamSource {
  final bool success;
  final String? streamUrl;
  final String? directUrl;
  final Map<String, String>? headers;
  final List<Subtitle>? subtitles;
  final String? error;
  final String? releaseDate;

  StreamSource({
    required this.success,
    this.streamUrl,
    this.directUrl,
    this.headers,
    this.subtitles,
    this.error,
    this.releaseDate,
  });

  factory StreamSource.fromJson(Map<String, dynamic> json) => StreamSource(
    success: json['success'] as bool? ?? false,
    streamUrl: json['streamUrl'] as String? ?? json['stream_url'] as String?,
    directUrl: json['directUrl'] as String?,
    headers: (json['headers'] as Map<String, dynamic>?)?.map(
      (k, v) => MapEntry(k, '$v'),
    ),
    subtitles: (json['subtitles'] as List?)?.map((s) => Subtitle.fromJson(s as Map<String, dynamic>)).toList(),
    error: json['error'] as String?,
    releaseDate: json['releaseDate'] as String?,
  );
}

class Subtitle {
  final String label;
  final String file;

  Subtitle({required this.label, required this.file});

  factory Subtitle.fromJson(Map<String, dynamic> json) => Subtitle(
    label: json['label'] as String,
    file: json['file'] as String,
  );
}

class ManifestInfo {
  final bool success;
  final double? duration;
  final List<Variant>? variants;

  ManifestInfo({required this.success, this.duration, this.variants});

  factory ManifestInfo.fromJson(Map<String, dynamic> json) => ManifestInfo(
    success: json['success'] as bool? ?? false,
    duration: (json['duration'] as num?)?.toDouble(),
    variants: (json['variants'] as List?)?.map((v) => Variant.fromJson(v as Map<String, dynamic>)).toList(),
  );
}

class Variant {
  final String resolution;
  final int bandwidth;
  final String url;
  final String label;
  final int? sizeBytes;

  Variant({required this.resolution, required this.bandwidth, required this.url, required this.label, this.sizeBytes});

  factory Variant.fromJson(Map<String, dynamic> json) => Variant(
    resolution: json['resolution'] as String,
    bandwidth: json['bandwidth'] as int,
    url: json['url'] as String,
    label: json['label'] as String,
    sizeBytes: json['sizeBytes'] as int?,
  );
}
