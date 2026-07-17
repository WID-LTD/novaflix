class MediaItem {
  final int id;
  final String title;
  final String? posterPath;
  final String? backdropPath;
  final String? overview;
  final double? voteAverage;
  final String? releaseDate;
  final String? mediaType;
  final int? runtime;
  final List<Genre>? genres;

  MediaItem({
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

  factory MediaItem.fromJson(Map<String, dynamic> json) {
    return MediaItem(
      id: json['id'] as int,
      title: json['title'] as String? ?? json['name'] as String? ?? '',
      posterPath: json['poster_path'] as String?,
      backdropPath: json['backdrop_path'] as String?,
      overview: json['overview'] as String?,
      voteAverage: (json['vote_average'] as num?)?.toDouble(),
      releaseDate: json['release_date'] as String? ?? json['first_air_date'] as String?,
      mediaType: json['media_type'] as String?,
      runtime: json['runtime'] as int?,
      genres: (json['genres'] as List?)?.map((g) => Genre.fromJson(g as Map<String, dynamic>)).toList(),
    );
  }

  String? get posterUrl => posterPath != null ? 'https://image.tmdb.org/t/p/w500$posterPath' : null;
  String? get backdropUrl => backdropPath != null ? 'https://image.tmdb.org/t/p/w1280$backdropPath' : null;
}

class Genre {
  final int id;
  final String name;

  Genre({required this.id, required this.name});

  factory Genre.fromJson(Map<String, dynamic> json) => Genre(
    id: json['id'] as int,
    name: json['name'] as String,
  );
}

class Season {
  final int id;
  final int seasonNumber;
  final String? name;
  final String? posterPath;
  final int? episodeCount;

  Season({required this.id, required this.seasonNumber, this.name, this.posterPath, this.episodeCount});

  factory Season.fromJson(Map<String, dynamic> json) => Season(
    id: json['id'] as int,
    seasonNumber: json['season_number'] as int,
    name: json['name'] as String?,
    posterPath: json['poster_path'] as String?,
    episodeCount: json['episode_count'] as int?,
  );
}

class Episode {
  final int id;
  final int episodeNumber;
  final String? name;
  final String? overview;
  final String? stillPath;
  final int? runtime;

  Episode({required this.id, required this.episodeNumber, this.name, this.overview, this.stillPath, this.runtime});

  factory Episode.fromJson(Map<String, dynamic> json) => Episode(
    id: json['id'] as int,
    episodeNumber: json['episode_number'] as int,
    name: json['name'] as String?,
    overview: json['overview'] as String?,
    stillPath: json['still_path'] as String?,
    runtime: json['runtime'] as int?,
  );
}
