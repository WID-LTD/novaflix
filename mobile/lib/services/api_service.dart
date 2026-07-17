import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

final apiServiceProvider = Provider<ApiService>((ref) => ApiService());

class ApiService {
  static const String baseUrl = 'http://10.0.2.2:5001/api';
  static const _storage = FlutterSecureStorage();
  static const _tokenKey = 'novaflix-token';
  static const _creatorTokenKey = 'novaflix-creator-token';

  late final Dio _dio;

  ApiService() {
    _dio = Dio(BaseOptions(
      baseUrl: baseUrl,
      connectTimeout: const Duration(seconds: 10),
      receiveTimeout: const Duration(seconds: 10),
      headers: {'Content-Type': 'application/json'},
    ));

    _dio.interceptors.add(InterceptorsWrapper(
      onRequest: (options, handler) async {
        final token = await _storage.read(key: _tokenKey);
        if (token != null) {
          options.headers['Authorization'] = 'Bearer $token';
        }
        handler.next(options);
      },
      onError: (error, handler) {
        handler.next(error);
      },
    ));
  }

  Dio get dio => _dio;

  // --- Token Management ---
  Future<void> saveToken(String token) => _storage.write(key: _tokenKey, value: token);
  Future<void> deleteToken() => _storage.delete(key: _tokenKey);
  Future<String?> getToken() => _storage.read(key: _tokenKey);
  Future<void> saveCreatorToken(String token) => _storage.write(key: _creatorTokenKey, value: token);
  Future<void> deleteCreatorToken() => _storage.delete(key: _creatorTokenKey);
  Future<String?> getCreatorToken() => _storage.read(key: _creatorTokenKey);

  // --- Auth ---
  Future<Response> register(String email, String username, String password) =>
      _dio.post('/auth/register', data: {'email': email, 'username': username, 'password': password});

  Future<Response> login(String email, String password) =>
      _dio.post('/auth/login', data: {'email': email, 'password': password});

  Future<Response> verifyEmail(String email, String code) =>
      _dio.post('/auth/verify-email', data: {'email': email, 'code': code});

  Future<Response> resendVerification(String email) =>
      _dio.post('/auth/resend-verification', data: {'email': email});

  Future<Response> getMe() => _dio.get('/auth/me');

  Future<Response> updateProfile(Map<String, dynamic> data) =>
      _dio.put('/user/profile', data: data);

  Future<Response> getUserStats() => _dio.get('/user/stats');

  // --- Creator Auth ---
  Future<Response> creatorRegister(String email, String password, String? name) =>
      _dio.post('/auth/creator/register', data: {'email': email, 'password': password, 'name': name});

  Future<Response> creatorLogin(String email, String password) =>
      _dio.post('/auth/creator/login', data: {'email': email, 'password': password});

  // --- Movies / Content ---
  Future<Response> getTrending() => _dio.get('/trending');

  Future<Response> getNowPlaying() => _dio.get('/now-playing');

  Future<Response> searchMedia(String query, {String? type}) =>
      _dio.get('/search', queryParameters: {'query': query, if (type != null) 'type': type});

  Future<Response> getDetails(int id, String type) =>
      _dio.get('/details', queryParameters: {'id': id, 'type': type});

  Future<Response> getTVSeason(int id, int season) =>
      _dio.get('/tv-season', queryParameters: {'id': id, 'season': season});

  Future<Response> getStreamSource(int id, String type, {int? season, int? episode}) =>
      _dio.get('/source', queryParameters: {
        'id': id, 'type': type,
        if (season != null) 'season': season,
        if (episode != null) 'episode': episode,
      });

  Future<Response> getManifestInfo(String url, {int? id, String? type, int? season, int? episode}) =>
      _dio.get('/manifest-info', queryParameters: {
        'url': url,
        if (id != null) 'id': id,
        if (type != null) 'type': type,
        if (season != null) 'season': season,
        if (episode != null) 'episode': episode,
      });

  Future<Response> getGenres({String? type}) =>
      _dio.get('/genres', queryParameters: {if (type != null) 'type': type});

  Future<Response> getCategoryMovies(int genreId, {String? type, int? page}) =>
      _dio.get('/category', queryParameters: {'id': genreId, if (type != null) 'type': type, if (page != null) 'page': page});

  // --- Interactions (Likes & Comments) ---
  Future<Response> toggleLike(int contentId, String contentType, {int? creatorId}) =>
      _dio.post('/interactions/like', data: {
        'contentId': contentId, 'contentType': contentType,
        if (creatorId != null) 'creatorId': creatorId,
      });

  Future<Response> checkLike(int contentId, String contentType) =>
      _dio.get('/interactions/like', queryParameters: {'contentId': contentId, 'contentType': contentType});

  Future<Response> getComments(int contentId, String contentType) =>
      _dio.get('/interactions/comments', queryParameters: {'contentId': contentId, 'contentType': contentType});

  Future<Response> postComment(int contentId, String contentType, String text, {int? creatorId}) =>
      _dio.post('/interactions/comment', data: {
        'contentId': contentId, 'contentType': contentType, 'text': text,
        if (creatorId != null) 'creatorId': creatorId,
      });

  Future<Response> deleteComment(int id) => _dio.delete('/interactions/comment/$id');

  // --- Recommendations ---
  Future<Response> getForYouRecommendations() => _dio.get('/recommendations/for-you');

  Future<Response> getTrendingRecommendations() => _dio.get('/recommendations/trending');

  Future<Response> getSimilarRecommendations(int id, {String? type}) =>
      _dio.get('/recommendations/similar/$id', queryParameters: {if (type != null) 'type': type});

  // --- Creator Endpoints ---
  Future<Response> getCreatorStats() => _dio.get('/creator/stats');

  Future<Response> getCreatorUploads() => _dio.get('/creator/uploads');

  Future<Response> uploadFilm(FormData data) => _dio.post('/creator/upload', data: data);

  Future<Response> getCreatorDashboard() => _dio.get('/creator/dashboard');

  Future<Response> getCreatorComments() => _dio.get('/creator/comments');

  Future<Response> getArtistGraph() => _dio.get('/payouts/graph');

  Future<Response> getPublicCreators() => _dio.get('/creator/public');

  // --- Payments (Paystack) ---
  Future<Response> initializePayment(String plan) =>
      _dio.post('/payment/initialize', data: {'plan': plan});

  Future<Response> verifyPayment(String reference, String plan) =>
      _dio.get('/payment/verify', queryParameters: {'reference': reference, 'plan': plan});

  Future<Response> getPaymentStatus() => _dio.get('/payment/status');

  Future<Response> createCheckout(String plan) =>
      _dio.post('/payment/create-checkout', data: {'plan': plan});

  Future<Response> confirmPayment(String plan) =>
      _dio.post('/payment/confirm', data: {'plan': plan});

  // --- Tips ---
  Future<Response> sendTip(int creatorId, double amount, {String? message}) =>
      _dio.post('/tips', data: {
        'creatorId': creatorId, 'amount': amount,
        if (message != null) 'message': message,
      });

  // --- Payouts ---
  Future<Response> createPayoutRecipient(Map<String, dynamic> data) =>
      _dio.post('/payouts/recipient', data: data);

  Future<Response> requestWithdraw(double amount) =>
      _dio.post('/payouts/withdraw', data: {'amount': amount});

  Future<Response> getPayoutHistory() => _dio.get('/payouts/history');

  // --- Admin ---
  Future<Response> adminGetUsers() => _dio.get('/admin/users');

  Future<Response> adminGetStats() => _dio.get('/admin/stats');

  Future<Response> adminGetUploads() => _dio.get('/admin/uploads');

  Future<Response> adminGetCreators() => _dio.get('/admin/creators');

  Future<Response> adminUpdateUserRole(int userId, String role) =>
      _dio.put('/admin/users/$userId/role', data: {'role': role});

  Future<Response> adminBanUser(int userId) =>
      _dio.post('/admin/users/$userId/ban');

  Future<Response> adminSendNewsletter(String subject, String content) =>
      _dio.post('/admin/newsletter/send', data: {'subject': subject, 'content': content});

  Future<Response> adminGetNewsletterSubscribers() =>
      _dio.get('/admin/newsletter/subscribers');

  // --- Watch History ---
  Future<Response> recordWatch(Map<String, dynamic> data) =>
      _dio.post('/user/watch-history', data: data);

  Future<Response> getWatchHistory() => _dio.get('/user/watch-history');

  // --- Newsletter ---
  Future<Response> subscribeNewsletter(String email) =>
      _dio.post('/newsletter/subscribe', data: {'email': email});
}
