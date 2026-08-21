import 'dart:convert';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/api_response.dart';
import '../services/api_service.dart';

class WalletBalance {
  final int balanceNgn;

  WalletBalance({required this.balanceNgn});

  factory WalletBalance.fromJson(Map<String, dynamic> json) {
    return WalletBalance(
      balanceNgn: json['balance_ngn'] ?? 0,
    );
  }
}

class WalletTransaction {
  final String id;
  final String type;
  final int amountNgn;
  final int balanceAfterNgn;
  final String? reference;
  final Map<String, dynamic>? metadata;
  final DateTime createdAt;

  WalletTransaction({
    required this.id,
    required this.type,
    required this.amountNgn,
    required this.balanceAfterNgn,
    this.reference,
    this.metadata,
    required this.createdAt,
  });

  factory WalletTransaction.fromJson(Map<String, dynamic> json) {
    return WalletTransaction(
      id: json['id'] ?? '',
      type: json['type'] ?? '',
      amountNgn: json['amount_ngn'] ?? 0,
      balanceAfterNgn: json['balance_after_ngn'] ?? 0,
      reference: json['reference'],
      metadata: json['metadata'],
      createdAt: DateTime.parse(json['created_at']),
    );
  }
}

class WalletEarningsSummary {
  final int total;
  final int ppmUpload;
  final int ppmScraped;
  final int ppmYoutube;
  final int ppmLive;
  final int ppmShorts;
  final int tip;
  final int gift;
  final int membership;
  final int merch;

  WalletEarningsSummary({
    required this.total,
    required this.ppmUpload,
    required this.ppmScraped,
    required this.ppmYoutube,
    required this.ppmLive,
    required this.ppmShorts,
    required this.tip,
    required this.gift,
    required this.membership,
    required this.merch,
  });

  factory WalletEarningsSummary.fromJson(Map<String, dynamic> json) {
    return WalletEarningsSummary(
      total: json['summary']?['total'] ?? 0,
      ppmUpload: json['items']?.where((i) => i['type'] == 'ppm_upload').fold(0, (sum, i) => sum + (i['amount_ngn'] as int)) ?? 0,
      ppmScraped: json['items']?.where((i) => i['type'] == 'ppm_scraped').fold(0, (sum, i) => sum + (i['amount_ngn'] as int)) ?? 0,
      ppmYoutube: json['items']?.where((i) => i['type'] == 'ppm_youtube').fold(0, (sum, i) => sum + (i['amount_ngn'] as int)) ?? 0,
      ppmLive: json['items']?.where((i) => i['type'] == 'ppm_live').fold(0, (sum, i) => sum + (i['amount_ngn'] as int)) ?? 0,
      ppmShorts: json['items']?.where((i) => i['type'] == 'ppm_shorts').fold(0, (sum, i) => sum + (i['amount_ngn'] as int)) ?? 0,
      tip: json['items']?.where((i) => i['type'] == 'tip').fold(0, (sum, i) => sum + (i['amount_ngn'] as int)) ?? 0,
      gift: json['items']?.where((i) => i['type'] == 'gift').fold(0, (sum, i) => sum + (i['amount_ngn'] as int)) ?? 0,
      membership: json['items']?.where((i) => i['type'] == 'membership').fold(0, (sum, i) => sum + (i['amount_ngn'] as int)) ?? 0,
      merch: json['items']?.where((i) => i['type'] == 'merch').fold(0, (sum, i) => sum + (i['amount_ngn'] as int)) ?? 0,
    );
  }
}

class PPMRate {
  final String contentType;
  final double baselineVPM;
  final double dynamicRate;
  final String tier;
  final Map<String, dynamic> tierParams;

  PPMRate({
    required this.contentType,
    required this.baselineVPM,
    required this.dynamicRate,
    required this.tier,
    required this.tierParams,
  });

  factory PPMRate.fromJson(Map<String, dynamic> json) {
    return PPMRate(
      contentType: json['contentType'] ?? 'movie',
      baselineVPM: (json['baselineVPM'] ?? 2.0).toDouble(),
      dynamicRate: (json['dynamicRate'] ?? 0.0).toDouble(),
      tier: json['tier'] ?? 'student',
      tierParams: json['tierParams'] ?? {},
    );
  }
}

class PPMConfig {
  final double baseRate;

  PPMConfig({required this.baseRate});

  factory PPMConfig.fromJson(Map<String, dynamic> json) {
    return PPMConfig(baseRate: (json['base_rate'] ?? 10.0).toDouble());
  }
}

class WithdrawalPreview {
  final int amountNgn;
  final int gatewayFee;
  final int netToCreator;
  final int totalDeduction;
  final int balance;
  final bool canWithdraw;

  WithdrawalPreview({
    required this.amountNgn,
    required this.gatewayFee,
    required this.netToCreator,
    required this.totalDeduction,
    required this.balance,
    required this.canWithdraw,
  });

  factory WithdrawalPreview.fromJson(Map<String, dynamic> json) {
    final preview = json['preview'] ?? json;
    return WithdrawalPreview(
      amountNgn: preview['amountNgn'] ?? 0,
      gatewayFee: preview['gatewayFee'] ?? 0,
      netToCreator: preview['netToCreator'] ?? 0,
      totalDeduction: preview['totalDeduction'] ?? 0,
      balance: preview['balance'] ?? 0,
      canWithdraw: preview['canWithdraw'] ?? false,
    );
  }
}

class WithdrawalResult {
  final bool success;
  final int newBalance;
  final int amountNgn;
  final int gatewayFee;
  final int netToCreator;
  final String? transferRef;

  WithdrawalResult({
    required this.success,
    required this.newBalance,
    required this.amountNgn,
    required this.gatewayFee,
    required this.netToCreator,
    this.transferRef,
  });

  factory WithdrawalResult.fromJson(Map<String, dynamic> json) {
    return WithdrawalResult(
      success: json['success'] ?? false,
      newBalance: json['newBalance'] ?? 0,
      amountNgn: json['amountNgn'] ?? 0,
      gatewayFee: json['gatewayFee'] ?? 0,
      netToCreator: json['netToCreator'] ?? 0,
      transferRef: json['transferRef'],
    );
  }
}

class BeneficiaryResult {
  final bool success;
  final String? gateway;
  final String? recipientCode;
  final String? beneficiaryId;
  final String? verifiedName;

  BeneficiaryResult({
    required this.success,
    this.gateway,
    this.recipientCode,
    this.beneficiaryId,
    this.verifiedName,
  });

  factory BeneficiaryResult.fromJson(Map<String, dynamic> json) {
    return BeneficiaryResult(
      success: json['success'] ?? false,
      gateway: json['gateway'],
      recipientCode: json['recipientCode'],
      beneficiaryId: json['beneficiaryId'],
      verifiedName: json['verifiedName'],
    );
  }
}

class Bank {
  final String code;
  final String name;
  final String? slug;

  Bank({required this.code, required this.name, this.slug});

  factory Bank.fromJson(Map<String, dynamic> json) {
    return Bank(
      code: json['code'] ?? '',
      name: json['name'] ?? '',
      slug: json['slug'],
    );
  }
}

class VerificationResult {
  final bool success;
  final String? verifiedName;
  final bool match;
  final String? message;

  VerificationResult({
    required this.success,
    this.verifiedName,
    required this.match,
    this.message,
  });

  factory VerificationResult.fromJson(Map<String, dynamic> json) {
    return VerificationResult(
      success: json['success'] ?? false,
      verifiedName: json['verifiedName'],
      match: json['match'] ?? false,
      message: json['message'],
    );
  }
}

class WalletService {
  static const String baseUrl = 'https://api.nova-flix.com.ng/api';

  Future<WalletBalance> getBalance() async {
    final token = await ApiService.getToken();
    final res = await http.get(
      Uri.parse('$baseUrl/wallet/balance'),
      headers: {'Authorization': 'Bearer $token'},
    );
    return WalletBalance.fromJson(jsonDecode(res.body));
  }

  Future<List<WalletTransaction>> getTransactions({
    String? type,
    String? from,
    String? to,
    int limit = 50,
    int offset = 0,
  }) async {
    final token = await ApiService.getToken();
    final params = <String, String>{};
    if (type != null) params['type'] = type;
    if (from != null) params['from'] = from;
    if (to != null) params['to'] = to;
    params['limit'] = limit.toString();
    params['offset'] = offset.toString();

    final uri = Uri.parse('$baseUrl/wallet/transactions').replace(queryParameters: params);
    final res = await http.get(uri, headers: {'Authorization': 'Bearer $token'});
    final data = jsonDecode(res.body);
    if (data['success']) {
      return (data['transactions'] as List).map((e) => WalletTransaction.fromJson(e)).toList();
    }
    return [];
  }

  Future<WalletEarningsSummary> getEarningsSummary() async {
    final token = await ApiService.getToken();
    final res = await http.get(
      Uri.parse('$baseUrl/wallet/earnings'),
      headers: {'Authorization': 'Bearer $token'},
    );
    return WalletEarningsSummary.fromJson(jsonDecode(res.body));
  }

  Future<PPMConfig> getPPMConfig() async {
    final token = await ApiService.getToken();
    final res = await http.get(
      Uri.parse('$baseUrl/wallet/ppm/config'),
      headers: {'Authorization': 'Bearer $token'},
    );
    return PPMConfig.fromJson(jsonDecode(res.body));
  }

  Future<void> updatePPMConfig(double baseRate) async {
    final token = await ApiService.getToken();
    await http.put(
      Uri.parse('$baseUrl/wallet/ppm/config'),
      headers: {'Authorization': 'Bearer $token', 'Content-Type': 'application/json'},
      body: jsonEncode({'baseRate': baseRate}),
    );
  }

  Future<PPMRate> getPPMRate(String contentType) async {
    final token = await ApiService.getToken();
    final res = await http.get(
      Uri.parse('$baseUrl/wallet/ppm/rate?contentType=$contentType'),
      headers: {'Authorization': 'Bearer $token'},
    );
    return PPMRate.fromJson(jsonDecode(res.body));
  }

  Future<WithdrawalPreview> previewWithdrawal(double amountNgn, String gateway) async {
    final token = await ApiService.getToken();
    final res = await http.get(
      Uri.parse('$baseUrl/wallet/withdraw/preview?amountNgn=$amountNgn&gateway=$gateway'),
      headers: {'Authorization': 'Bearer $token'},
    );
    return WithdrawalPreview.fromJson(jsonDecode(res.body));
  }

  Future<WithdrawalResult> withdraw(double amountNgn, String gateway) async {
    final token = await ApiService.getToken();
    final res = await http.post(
      Uri.parse('$baseUrl/wallet/withdraw'),
      headers: {'Authorization': 'Bearer $token', 'Content-Type': 'application/json'},
      body: jsonEncode({'amountNgn': amountNgn, 'gateway': gateway}),
    );
    return WithdrawalResult.fromJson(jsonDecode(res.body));
  }

  Future<BeneficiaryResult> createBeneficiary({
    required String gateway,
    required String bankCode,
    required String accountNumber,
    required String accountName,
  }) async {
    final token = await ApiService.getToken();
    final res = await http.post(
      Uri.parse('$baseUrl/beneficiary'),
      headers: {'Authorization': 'Bearer $token', 'Content-Type': 'application/json'},
      body: jsonEncode({
        'gateway': gateway,
        'bankCode': bankCode,
        'accountNumber': accountNumber,
        'accountName': accountName,
      }),
    );
    return BeneficiaryResult.fromJson(jsonDecode(res.body));
  }

  Future<Map<String, dynamic>> getBeneficiaries() async {
    final token = await ApiService.getToken();
    final res = await http.get(
      Uri.parse('$baseUrl/beneficiary'),
      headers: {'Authorization': 'Bearer $token'},
    );
    return jsonDecode(res.body);
  }

  Future<List<Bank>> getBanks(String gateway) async {
    final res = await http.get(Uri.parse('$baseUrl/banks?gateway=$gateway'));
    final data = jsonDecode(res.body);
    return (data['banks'] as List).map((e) => Bank.fromJson(e)).toList();
  }

  Future<VerificationResult> verifyBankAccount({
    required String gateway,
    required String bankCode,
    required String accountNumber,
    required String accountName,
  }) async {
    final token = await ApiService.getToken();
    final res = await http.post(
      Uri.parse('$baseUrl/banks/verify'),
      headers: {'Authorization': 'Bearer $token', 'Content-Type': 'application/json'},
      body: jsonEncode({
        'gateway': gateway,
        'bankCode': bankCode,
        'accountNumber': accountNumber,
        'accountName': accountName,
      }),
    );
    return VerificationResult.fromJson(jsonDecode(res.body));
  }
}

final walletServiceProvider = Provider<WalletService>((ref) => WalletService());

class WalletState {
  final int balanceNgn;
  final WalletEarningsSummary? earnings;
  final List<WalletTransaction> transactions;
  final PPMConfig? ppmConfig;
  final PPMRate? currentPPMRate;
  final bool isLoading;
  final bool isWithdrawing;
  final String? error;

  const WalletState({
    this.balanceNgn = 0,
    this.earnings,
    this.transactions = const [],
    this.ppmConfig,
    this.currentPPMRate,
    this.isLoading = false,
    this.isWithdrawing = false,
    this.error,
  });

  WalletState copyWith({
    int? balanceNgn,
    WalletEarningsSummary? earnings,
    List<WalletTransaction>? transactions,
    PPMConfig? ppmConfig,
    PPMRate? currentPPMRate,
    bool? isLoading,
    bool? isWithdrawing,
    String? error,
  }) {
    return WalletState(
      balanceNgn: balanceNgn ?? this.balanceNgn,
      earnings: earnings ?? this.earnings,
      transactions: transactions ?? this.transactions,
      ppmConfig: ppmConfig ?? this.ppmConfig,
      currentPPMRate: currentPPMRate ?? this.currentPPMRate,
      isLoading: isLoading ?? this.isLoading,
      isWithdrawing: isWithdrawing ?? this.isWithdrawing,
      error: error ?? this.error,
    );
  }
}

class WalletNotifier extends StateNotifier<WalletState> {
  final WalletService _service;

  WalletNotifier(this._service) : super(const WalletState()) {
    loadAll();
  }

  Future<void> loadAll() async {
    state = state.copyWith(isLoading: true);
    try {
      final results = await Future.wait([
        _service.getBalance(),
        _service.getWalletTransactions(),
        _service.getEarningsSummary(),
        _service.getPPMConfig(),
      ]);
      final balance = (await _service.getBalance()).balanceNgn;
      state = state.copyWith(
        balanceNgn: results[0].balanceNgn,
        transactions: results[1],
        earnings: results[2],
        ppmConfig: results[3],
        isLoading: false,
      );
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e.toString());
    }
  }

  Future<void> refresh() async {
    loadAll();
  }

  Future<void> loadPPMRate(String contentType) async {
    try {
      final rate = await _service.getPPMRate(contentType);
      state = state.copyWith(currentPPMRate: rate);
    } catch (e) {
      // ignore
    }
  }

  Future<void> updatePPMConfig(double baseRate) async {
    state = state.copyWith(isLoading: true);
    try {
      await _service.updatePPMConfig(baseRate);
      await loadPPMRate('movie');
      state = state.copyWith(isLoading: false);
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e.toString());
    }
  }

  Future<void> withdraw(double amount, String gateway) async {
    state = state.copyWith(isWithdrawing: true, error: null);
    try {
      final result = await _service.withdraw(amount, gateway);
      if (result.success) {
        state = state.copyWith(
          balanceNgn: result.newBalance,
          isWithdrawing: false,
        );
      } else {
        state = state.copyWith(isWithdrawing: false, error: result.error);
      }
    } catch (e) {
      state = state.copyWith(isWithdrawing: false, error: e.toString());
    }
  }
}

final walletProvider = StateNotifierProvider<WalletNotifier, WalletState>((ref) {
  return WalletNotifier(ref.read(walletServiceProvider));
});