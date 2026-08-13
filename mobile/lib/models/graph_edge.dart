class GraphEdge {
  final String sourceId;
  final String sourceName;
  final String targetId;
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
    sourceId: json['source_id']?.toString() ?? '',
    sourceName: json['source_name'] as String,
    targetId: json['target_id']?.toString() ?? '',
    targetName: json['target_name'] as String,
    weight: json['weight'] as int,
  );
}
