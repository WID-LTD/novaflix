import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../theme/app_colors.dart';
import '../theme/app_typography.dart';
import '../services/api_service.dart';
import '../widgets/ui/index.dart';

final _myEventsProvider = FutureProvider<List<Map<String, dynamic>>>((ref) async {
  final api = ref.read(apiServiceProvider);
  final res = await api.getMyEvents();
  final data = res.data['events'] as List? ?? [];
  return data.cast<Map<String, dynamic>>();
});

class CreatorEventsManagerScreen extends ConsumerStatefulWidget {
  const CreatorEventsManagerScreen({super.key});
  @override
  ConsumerState<CreatorEventsManagerScreen> createState() => _CreatorEventsManagerScreenState();
}

class _CreatorEventsManagerScreenState extends ConsumerState<CreatorEventsManagerScreen> {
  final _titleCtl = TextEditingController();
  final _descCtl = TextEditingController();
  final _posterCtl = TextEditingController();
  final _streamCtl = TextEditingController();
  final _priceCtl = TextEditingController();
  final _ticketsCtl = TextEditingController();
  final _dateCtl = TextEditingController();
  bool _showForm = false;
  int? _editId;

  Future<void> _save() async {
    final api = ref.read(apiServiceProvider);
    final data = {
      'title': _titleCtl.text, 'description': _descCtl.text,
      'poster_url': _posterCtl.text, 'stream_url': _streamCtl.text,
      'ticket_price': double.tryParse(_priceCtl.text) ?? 0,
      'total_tickets': int.tryParse(_ticketsCtl.text) ?? 100,
      'event_date': _dateCtl.text,
    };
    if (_editId != null) {
      await api.updateEvent(_editId!, data);
    } else {
      await api.createEvent(data);
    }
    _resetForm();
    ref.invalidate(_myEventsProvider);
  }

  void _resetForm() {
    _titleCtl.clear(); _descCtl.clear(); _posterCtl.clear();
    _streamCtl.clear(); _priceCtl.clear(); _ticketsCtl.clear(); _dateCtl.clear();
    _editId = null; _showForm = false;
  }

  @override
  void dispose() {
    _titleCtl.dispose(); _descCtl.dispose(); _posterCtl.dispose();
    _streamCtl.dispose(); _priceCtl.dispose(); _ticketsCtl.dispose(); _dateCtl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final events = ref.watch(_myEventsProvider);
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(title: const Text('Events'), actions: [
        IconButton(icon: Icon(_showForm ? Icons.close : Icons.add), onPressed: () => setState(() => _showForm = !_showForm)),
      ]),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            if (_showForm) ...[
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(color: AppColors.surfaceContainerHigh, borderRadius: BorderRadius.circular(12)),
                child: Column(children: [
                  AppInput(controller: _titleCtl, label: 'Event Title'),
                  const SizedBox(height: 8),
                  AppInput(controller: _dateCtl, label: 'Date (YYYY-MM-DD HH:mm)'),
                  const SizedBox(height: 8),
                  Row(children: [
                    Expanded(child: AppInput(controller: _priceCtl, label: 'Ticket Price', keyboardType: TextInputType.number)),
                    const SizedBox(width: 8),
                    Expanded(child: AppInput(controller: _ticketsCtl, label: 'Total Tickets', keyboardType: TextInputType.number)),
                  ]),
                  const SizedBox(height: 8),
                  AppInput(controller: _posterCtl, label: 'Poster URL'),
                  const SizedBox(height: 8),
                  AppInput(controller: _streamCtl, label: 'Stream URL'),
                  const SizedBox(height: 8),
                  AppInput(controller: _descCtl, label: 'Description'),
                  const SizedBox(height: 16),
                  AppButton(label: _editId != null ? 'Update Event' : 'Create Event', onPressed: _save),
                ]),
              ),
              const SizedBox(height: 16),
            ],
            events.when(
              data: (items) => Column(
                children: items.map((e) {
                  final status = e['status']?.toString() ?? 'scheduled';
                  final isLive = status == 'live';
                  final isEnded = status == 'ended';
                  return Container(
                    margin: const EdgeInsets.only(bottom: 12),
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: AppColors.surfaceContainerHigh,
                      borderRadius: BorderRadius.circular(12),
                      border: isLive ? Border.all(color: Colors.red) : null,
                    ),
                    child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                      Row(children: [
                        Expanded(child: Text(e['title']?.toString() ?? '', style: AppTypography.bodyMd.copyWith(fontWeight: FontWeight.w600))),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                          decoration: BoxDecoration(
                            color: isLive ? Colors.red.withValues(alpha: 0.2) : isEnded ? Colors.grey.withValues(alpha: 0.2) : AppColors.primary.withValues(alpha: 0.2),
                            borderRadius: BorderRadius.circular(4),
                          ),
                          child: Text(status.toUpperCase(), style: TextStyle(fontSize: 11, color: isLive ? Colors.red : isEnded ? Colors.grey : AppColors.primary)),
                        ),
                      ]),
                      if (e['event_date'] != null) Text(e['event_date'].toString(), style: TextStyle(color: AppColors.onSurfaceVariant, fontSize: 12)),
                      if (e['ticket_price'] != null) Text('\$${(e['ticket_price'] as num).toStringAsFixed(2)}', style: const TextStyle(color: AppColors.primary, fontSize: 13)),
                      if (e['available_tickets'] != null) Text('${e['available_tickets']} tickets left', style: TextStyle(color: AppColors.onSurfaceVariant, fontSize: 12)),
                    ]),
                  );
                }).toList(),
              ),
              loading: () => const LoadingSpinner(logo: true),
              error: (e, _) => Center(child: Text('Error: $e')),
            ),
          ],
        ),
      ),
    );
  }
}
