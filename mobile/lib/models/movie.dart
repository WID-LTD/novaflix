class Movie {
  final int id;
  final String title;
  final String? posterPath;
  final String? backdropPath;
  final String? overview;
  final double? voteAverage;
  final String? releaseDate;
  final String? mediaType;
  final int? runtime;
  final List<String>? genres;

  Movie({
    required this.id,
    required this.title,
    this.posterPath,
    this.backdropPath,
    this.overview,
    this.voteAverage,
    this.releaseDate,
    this.mediaType,
    this.runtime,
    this.genres,
  });

  factory Movie.fromJson(Map<String, dynamic> json) {
    return Movie(
      id: json['id'] as int,
      title: json['title'] as String? ?? json['name'] as String? ?? '',
      posterPath: json['poster_path'] as String?,
      backdropPath: json['backdrop_path'] as String?,
      overview: json['overview'] as String?,
      voteAverage: (json['vote_average'] as num?)?.toDouble(),
      releaseDate: json['release_date'] as String? ?? json['first_air_date'] as String?,
      mediaType: json['media_type'] as String?,
      runtime: json['runtime'] as int?,
      genres: (json['genres'] as List?)?.map((g) => g is String ? g : g['name'] as String).toList(),
    );
  }

  String? get posterUrl =>
      posterPath != null ? 'https://image.tmdb.org/t/p/w500$posterPath' : null;

  String? get backdropUrl =>
      backdropPath != null ? 'https://image.tmdb.org/t/p/w1280$backdropPath' : null;
}
