import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../providers/wallet_provider.dart';
import '../services/wallet_service.dart';
import '../widgets/ui/index.dart';
import '../widgets/layout/index.dart';

class CreatorOnboardingScreen extends ConsumerStatefulWidget {
  const CreatorOnboardingScreen({super.key});

  @override
  ConsumerState<CreatorOnboardingScreen> createState() => _CreatorOnboardingScreenState();
}

class _CreatorOnboardingScreenState extends ConsumerState<CreatorOnboardingScreen> {
  int _step = 0; // 0: gateway select, 1: form, 2: verification, 3: complete
  String _selectedGateway = '';
  String _bankCode = '';
  String _accountNumber = '';
  String _accountName = '';
  List<Bank> _banks = [];
  bool _verifying = false;
  bool _verified = false;
  String _verifiedName = '';
  bool _saving = false;
  List<String> _completedGateways = [];

  @override
  void initState() {
    super.initState();
    _loadExisting();
  }

  Future<void> _loadExisting() async {
    try {
      final res = await ref.read(walletServiceProvider).getBeneficiaries();
      if (res['success'] == true) {
        final b = res['beneficiaries'];
        final completed = <String>[];
        if (b['paystack_recipient_code'] != null) completed.add('paystack');
        if (b['flutterwave_beneficiary_id'] != null) completed.add('flutterwave');
        setState(() => _completedGateways = completed);
        if (completed.length >= 2) setState(() => _step = 3);
      }
    } catch (e) {
      debugPrint('Load existing error: $e');
    }
  }

  Future<void> _loadBanks() async {
    try {
      final res = await ref.read(walletServiceProvider).getBanks(_selectedGateway);
      setState(() => _banks = res);
    } catch (e) {
      debugPrint('Load banks error: $e');
    }
  }

  void _handleGatewaySelect(String gateway) {
    setState(() {
      _selectedGateway = gateway;
      _step = 1;
      _bankCode = '';
      _accountNumber = '';
      _accountName = '';
      _verified = false;
      _verifiedName = '';
    });
    _loadBanks();
  }

  Future<void> _handleVerify() async {
    if (_bankCode.isEmpty || _accountNumber.isEmpty || _accountName.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please fill all fields')),
      );
      return;
    }
    setState(() => _verifying = true);
    try {
      final res = await ref.read(walletServiceProvider).verifyBankAccount(
        gateway: _selectedGateway,
        bankCode: _bankCode,
        accountNumber: _accountNumber,
        accountName: _accountName,
      );
      if (res.success) {
        setState(() {
          _verified = true;
          _verifiedName = res.verifiedName;
          _step = 2;
        });
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(res.message ?? 'Account verified')),
        );
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(res.error ?? 'Verification failed')),
        );
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Verification failed: $e')),
      );
    } finally {
      setState(() => _verifying = false);
    }
  }

  Future<void> _handleSave() async {
    if (!_verified) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please verify account first')),
      );
      return;
    }
    setState(() => _saving = true);
    try {
      final res = await ref.read(walletServiceProvider).createBeneficiary(
        gateway: _selectedGateway,
        bankCode: _bankCode,
        accountNumber: _accountNumber,
        accountName: _accountName,
      );
      if (res.success) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('${_selectedGateway} beneficiary created')),
        );
        setState(() {
          _completedGateways.add(_selectedGateway);
          if (_completedGateways.length >= 2) {
            _step = 3;
          } else {
            _step = 0;
            _selectedGateway = '';
            _bankCode = '';
            _accountNumber = '';
            _accountName = '';
            _verified = false;
            _verifiedName = '';
          }
        });
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(res.error ?? 'Failed to create beneficiary')),
        );
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Failed to create beneficiary: $e')),
      );
    } finally {
      setState(() => _saving = false);
    }
  }

  void _handleBack() {
    if (_step == 1) setState(() => _step = 0);
    else if (_step == 2) setState(() => _step = 1);
    else if (_step == 3) Navigator.of(context).pushReplacementNamed('/creator/wallet');
  }

  @override
  Widget build(BuildContext context) {
    final gateways = [
      {'id': 'paystack', 'name': 'Paystack', 'icon': Icons.account_balance, 'color': Colors.blue, 'desc': 'Nigeria bank transfers, USSD, cards'},
      {'id': 'flutterwave', 'name': 'Flutterwave', 'icon': Icons.sync, 'color': Colors.purple, 'desc': 'Africa mobile money, bank transfers, cards'},
    ];

    return Scaffold(
      appBar: AppBar(title: const Text('Setup Payout Methods')),
      body: Padding(
        padding: const EdgeInsets.all(16),
        child: AnimatedSwitcher(
          duration: const Duration(milliseconds: 300),
          child: _buildStep(),
        ),
      ),
    );
  }

  Widget _buildStep() {
    switch (_step) {
      case 0:
        return _buildGatewaySelect();
      case 1:
        return _buildBankForm();
      case 2:
        return _buildVerification();
      case 3:
        return _buildComplete();
      default:
        return const SizedBox();
    }
  }

  Widget _buildGatewaySelect() {
    return Column(
      children: [
        const SizedBox(height: 24),
        const Icon(Icons.account_balance_wallet, size: 64, color: Colors.blueGrey),
        const SizedBox(height: 16),
        const Text(
          'Setup Payout Methods',
          style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
        ),
        const SizedBox(height: 8),
        const Text(
          'Add both payout gateways to withdraw your earnings instantly',
          textAlign: TextAlign.center,
          style: TextStyle(color: Colors.grey, fontSize: 16),
        ),
        const SizedBox(height: 32),
        ...[
          {'id': 'paystack', 'name': 'Paystack', 'icon': Icons.account_balance, 'color': Colors.blue, 'desc': 'Nigeria bank transfers, USSD, cards'},
          {'id': 'flutterwave', 'name': 'Flutterwave', 'icon': Icons.sync, 'color': Colors.purple, 'desc': 'Africa mobile money, bank transfers, cards'},
        ].map((g) {
          final completed = _completedGateways.contains(g['id']);
          return Card(
            margin: const EdgeInsets.only(bottom: 16),
            color: completed ? Colors.green[50] : null,
            child: ListTile(
              leading: Icon((g['icon'] as IconData), color: g['color'] as Color, size: 36),
              title: Text(g['name'] as String, style: const TextStyle(fontWeight: FontWeight.bold)),
              subtitle: Text(g['desc'] as String),
              trailing: completed
                  ? const Icon(Icons.check_circle, color: Colors.green)
                  : const Icon(Icons.arrow_forward_ios),
              onTap: completed ? null : () => setState(() => _handleGatewaySelect(g['id'] as String)),
            ),
          ),
        ).toList(),
      ],
    );
  }

  Widget _buildBankForm() {
    final gateway = {'id': _selectedGateway, 'name': _selectedGateway == 'paystack' ? 'Paystack' : 'Flutterwave', 'icon': _selectedGateway == 'paystack' ? Icons.account_balance : Icons.sync, 'color': _selectedGateway == 'paystack' ? Colors.blue : Colors.purple};
    return Column(
      children: [
        IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => setState(() => _step = 0),
        ),
        const SizedBox(height: 8),
        CircleAvatar(
          radius: 36,
          backgroundColor: (gateway['color'] as Color).withOpacity(0.1),
          child: Icon(gateway['icon'] as IconData, size: 36, color: gateway['color'] as Color),
        ),
        const SizedBox(height: 16),
        Text('Add ${gateway['name']} Beneficiary', style: Theme.of(context).textTheme.headlineSmall),
        const SizedBox(height: 8),
        Text('Enter your bank details for instant payouts', style: TextStyle(color: Colors.grey[600])),
        const SizedBox(height: 24),
        Form(
          child: Column(
            children: [
              DropdownButtonFormField<String>(
                value: _bankCode.isEmpty ? null : _bankCode,
                decoration: const InputDecoration(labelText: 'Bank', prefixIcon: Icon(Icons.account_balance)),
                items: _banks.map((b) => DropdownMenuItem(value: b.code, child: Text('${b.name} (${b.code})'))).toList(),
                onChanged: (v) => setState(() => _bankCode = v!),
                validator: (v) => v == null ? 'Select a bank' : null,
              ),
              const SizedBox(height: 16),
              TextFormField(
                controller: TextEditingController(text: _accountNumber)
                  ..addListener(() => _accountNumber = _accountNumber),
                decoration: const InputDecoration(labelText: 'Account Number', hintText: '10-digit account number'),
                keyboardType: TextInputType.number,
                maxLength: 10,
                onChanged: (v) => setState(() => _accountNumber = v),
                validator: (v) => v?.length != 10 ? 'Enter 10-digit account number' : null,
              ),
              const SizedBox(height: 16),
              TextFormField(
                controller: TextEditingController(text: _accountName)
                  ..addListener(() => _accountName = _accountName),
                decoration: const InputDecoration(labelText: 'Account Name (as on bank records)'),
                validator: (v) => v?.isEmpty ?? true ? 'Required' : null,
              ),
              const SizedBox(height: 24),
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton(
                      onPressed: () => setState(() => _step = 0),
                      child: const Text('Back'),
                    ),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: FilledButton(
                      onPressed: () => _handleVerify(),
                      child: const Text('Verify Account'),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildVerification() {
    return Column(
      children: [
        const SizedBox(height: 24),
        CircleAvatar(
          radius: 48,
          backgroundColor: _verified ? Colors.green.withOpacity(0.1) : Colors.red.withOpacity(0.1),
          child: Icon(_verified ? Icons.check_circle : Icons.cancel, size: 48, color: _verified ? Colors.green : Colors.red),
        ),
        const SizedBox(height: 16),
        Text(_verified ? 'Account Verified!' : 'Verification Failed', style: Theme.of(context).textTheme.headlineSmall),
        const SizedBox(height: 8),
        Text(
          _verified
              ? 'Bank records show: <b>$_verifiedName</b>. Name matches!'
              : 'Account name does not match bank records. Please check and try again.',
        ),
        if (_verified) ...[
          const SizedBox(height: 24),
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                children: [
                  const Text('Verified Details', style: TextStyle(fontWeight: FontWeight.bold)),
                  const SizedBox(height: 12),
                  _buildInfoRow('Bank Name', _verifiedName),
                  _buildInfoRow('Account Number', _accountNumber),
                  _buildInfoRow('Bank Code', _bankCode),
                ],
              ),
            ),
          ),
          const SizedBox(height: 24),
          FilledButton(
            onPressed: _saving ? null : () async {
              setState(() => _handleSave());
            },
            child: const Text('Save Beneficiary & Continue'),
          ),
          if (!_verified) ...[
            const SizedBox(height: 16),
            TextButton(
              onPressed: () => setState(() => _step = 1),
              child: const Text('Try Again'),
            ),
          ],
        ],
      );
  }

  Widget _buildComplete() {
    return Column(
      children: [
        const SizedBox(height: 32),
        const Icon(Icons.celebration, size: 80, color: Colors.green),
        const SizedBox(height: 16),
        const Text('All Set!', style: TextStyle(fontSize: 28, fontWeight: FontWeight.bold)),
        const SizedBox(height: 8),
        const Text(
          'Both payout gateways are configured. You can now withdraw your earnings instantly.',
          textAlign: TextAlign.center,
          style: TextStyle(fontSize: 16, color: Colors.grey),
        ),
        const SizedBox(height: 32),
        Card(
          child: Column(
            children: [
              ListTile(
                leading: const Icon(Icons.account_balance, color: Colors.blue),
                title: const Text('Paystack'),
                trailing: const Icon(Icons.check_circle, color: Colors.green),
                subtitle: const Text('Ready for withdrawals'),
              ),
              ListTile(
                leading: const Icon(Icons.sync, color: Colors.purple),
                title: const Text('Flutterwave'),
                trailing: const Icon(Icons.check_circle, color: Colors.green),
                subtitle: const Text('Ready for withdrawals'),
              ),
            ],
          ),
          const SizedBox(height: 24),
          FilledButton.icon(
            icon: const Icon(Icons.account_balance_wallet),
            label: const Text('Go to Wallet'),
            onPressed: () => Navigator.of(context).pushReplacementNamed('/creator/wallet'),
          ),
        ],
      );
  }

  Widget _buildInfoRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: TextStyle(color: Colors.grey[600])),
          Text(value, style: const TextStyle(fontWeight: FontWeight.w500)),
        ],
      ),
    );
  }
}