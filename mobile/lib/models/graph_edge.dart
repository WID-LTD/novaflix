class GraphEdge {
  final int sourceId;
  final String sourceName;
  final int targetId;
  final String targetName;
  final int weight;

  GraphEdge({
    required this.sourceId,
    required this.sourceName,
    required this.targetId,
    required this.targetName,
    required this.weight,
  });

  factory GraphEdge.fromJson(Map<String, dynamic> json) => GraphEdge(
    sourceId: json['source_id'] as int,
    sourceName: json['source_name'] as String,
    targetId: json['target_id'] as int,
    targetName: json['target_name'] as String,
    weight: json['weight'] as int,
  );
}
