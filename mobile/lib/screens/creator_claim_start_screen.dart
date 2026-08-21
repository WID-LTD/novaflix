import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../providers/wallet_provider.dart';
import '../services/wallet_service.dart';
import '../services/api_service.dart';

class ClaimStartScreen extends ConsumerStatefulWidget {
  const ClaimStartScreen({super.key});

  @override
  ConsumerState<ClaimStartScreen> createState() => _ClaimStartScreenState();
}

class _ClaimStartScreenState extends ConsumerState<ClaimStartScreen> {
  final TextEditingController _searchController = TextEditingController();
  List<Map<String, dynamic>> _results = [];
  bool _searching = false;
  Map<String, dynamic>? _selectedPerson;

  Future<void> _handleSearch() async {
    final query = _searchController.text.trim();
    if (query.isEmpty) return;
    
    setState(() => _searching = true);
    try {
      final token = await ApiService.getToken();
      final res = await http.get(
        Uri.parse('https://api.nova-flix.com.ng/api/search/person?query=${Uri.encodeComponent(query)}'),
        headers: {'Authorization': 'Bearer $token'},
      );
      final data = jsonDecode(res.body);
      if (data['success']) {
        setState(() => _results = List<Map<String, dynamic>>.from(data['data']));
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Search failed: $e')),
      );
    } finally {
      setState(() => _searching = false);
    }
  }

  void _selectPerson(Map<String, dynamic> person) {
    setState(() => _selectedPerson = person);
  }

  Future<void> _startClaim() async {
    if (_selectedPerson == null) return;
    
    final token = await ApiService.getToken();
    try {
      final res = await http.post(
        Uri.parse('https://api.nova-flix.com.ng/api/creator/claim/start'),
        headers: {'Authorization': 'Bearer $token', 'Content-Type': 'application/json'},
        body: jsonEncode({
          'tmdbPersonId': _selectedPerson!['id'],
          'displayName': _selectedPerson!['name'],
        }),
      );
      final data = jsonDecode(res.body);
      if (data['success']) {
        Navigator.pushNamed(context, '/creator/claim/verify', arguments: {'claimId': data['claimId']});
      } else {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(data['error'] ?? 'Failed to start claim')));
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Failed to start claim: $e')));
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Claim Your Profile')),
      body: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            const SizedBox(height: 24),
            const Icon(Icons.verified_user, size: 64, color: Colors.blue),
            const SizedBox(height: 16),
            const Text(
              'Claim Your Creator Profile',
              style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 8),
            const Text(
              'Are you a filmmaker, actor, or creator? Search TMDB to find your profile and claim it to start earning from your content.',
              textAlign: TextAlign.center,
              style: TextStyle(color: Colors.grey, fontSize: 16),
            ),
            const SizedBox(height: 24),
            TextField(
              controller: _searchController,
              decoration: InputDecoration(
                hintText: 'Search your name (e.g. "Christopher Nolan")',
                prefixIcon: const Icon(Icons.search),
                border: const OutlineInputBorder(),
                suffixIcon: _searching
                    ? const SizedBox(width: 24, height: 24, child: CircularProgressIndicator(strokeWidth: 2))
                    : null,
              ),
              onSubmitted: (_) => _handleSearch(),
            ),
            const SizedBox(height: 12),
            ElevatedButton.icon(
              onPressed: _searching ? null : _handleSearch,
              icon: const Icon(Icons.search),
              label: const Text('Search'),
              style: ElevatedButton.styleFrom(minimumSize: const Size(double.infinity, 48)),
            ),
            const SizedBox(height: 24),
            if (_results.isNotEmpty) ...[
              const Text('Search Results', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
              const SizedBox(height: 12),
              Expanded(
                child: ListView.builder(
                  itemCount: _results.length,
                  itemBuilder: (context, index) {
                    final person = _results[index];
                    final selected = _selectedPerson?['id'] == person['id'];
                    return Card(
                      color: selected ? Theme.of(context).primaryColor.withOpacity(0.1) : null,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                        side: BorderSide(
                          color: selected ? Theme.of(context).primaryColor : Colors.transparent,
                          width: 2,
                        ),
                      ),
                      child: ListTile(
                        leading: person['profile_path'] != null
                            ? CircleAvatar(
                                backgroundImage: NetworkImage('https://image.tmdb.org/t/p/w185${person['profile_path']}'),
                              )
                            : const CircleAvatar(child: Icon(Icons.person)),
                        title: Text(person['name'] ?? ''),
                        subtitle: Text('${person['known_for_department']} • ${(person['known_for'] as List?)?.length ?? 0} works'),
                        trailing: selected ? const Icon(Icons.check_circle, color: Colors.green) : null,
                        onTap: () => _selectPerson(person),
                      ),
                    ),
                  ),
                ),
              ),
              const SizedBox(height: 16),
              if (_selectedPerson != null)
                FilledButton.icon(
                  onPressed: _startClaim,
                  icon: const Icon(Icons.verified_user),
                  label: const Text('Claim This Profile'),
                  style: FilledButton.styleFrom(minimumSize: const Size(double.infinity, 48)),
                ),
            ],
          ),
        ),
      ),
    );
  }
}