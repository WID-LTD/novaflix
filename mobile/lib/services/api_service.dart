import 'dart:io';
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
      connectTimeout: const Duration(seconds: 15),
      receiveTimeout: const Duration(seconds: 15),
      headers: {'Content-Type': 'application/json'},
    ));

    _dio.interceptors.add(InterceptorsWrapper(
      onRequest: (options, handler) async {
        final token = await _storage.read(key: _tokenKey);
        if (token != null) {
          options.headers['Authorization'] = 'Bearer $token';
        } else {
          final cToken = await _storage.read(key: _creatorTokenKey);
          if (cToken != null) {
            options.headers['Authorization'] = 'Bearer $cToken';
          }
        }
        handler.next(options);
      },
      onError: (error, handler) {
        if (error.response?.statusCode == 401) {
          _storage.delete(key: _tokenKey);
          _storage.delete(key: _creatorTokenKey);
        }
        handler.next(error);
      },
    ));
  }

  Dio get dio => _dio;

  Future<String?> getToken() => _storage.read(key: _tokenKey);
  Future<void> saveToken(String token) => _storage.write(key: _tokenKey, value: token);
  Future<void> deleteToken() => _storage.delete(key: _tokenKey);
  Future<String?> getCreatorToken() => _storage.read(key: _creatorTokenKey);
  Future<void> saveCreatorToken(String token) => _storage.write(key: _creatorTokenKey, value: token);
  Future<void> deleteCreatorToken() => _storage.delete(key: _creatorTokenKey);

  Future<Response> get(String path, {Map<String, dynamic>? params}) =>
      _dio.get(path, queryParameters: params);
  Future<Response> post(String path, {Map<String, dynamic>? data}) =>
      _dio.post(path, data: data);
  Future<Response> put(String path, {Map<String, dynamic>? data}) =>
      _dio.put(path, data: data);
  Future<Response> delete(String path) => _dio.delete(path);
  Future<Response> patch(String path, {Map<String, dynamic>? data}) =>
      _dio.patch(path, data: data);
  Future<Response> uploadFile(String path, FormData data) => _dio.post(path, data: data);

  Future<Response> register(String email, String password, String? name) =>
      post('/auth/register', data: {'email': email, 'password': password, if (name != null) 'name': name});

  Future<Response> login(String email, String password) =>
      post('/auth/login', data: {'email': email, 'password': password});

  Future<Response> verifyEmail(int userId, String code) =>
      post('/auth/verify-email', data: {'userId': userId, 'code': code});

  Future<Response> resendVerification(int userId) =>
      post('/auth/resend-verification', data: {'userId': userId});

  Future<Response> getMe() => get('/auth/me');
  Future<Response> updateProfile(Map<String, dynamic> data) => put('/user/profile', data: data);
  Future<Response> getUserStats() => get('/user/stats');
  Future<Response> uploadAvatar(FormData data) => uploadFile('/user/avatar', data);
  Future<Response> changePassword(String current, String newPw) =>
      post('/user/change-password', data: {'currentPassword': current, 'newPassword': newPw});
  Future<Response> deleteAccount() => delete('/user/account');
  Future<Response> recordWatch(Map<String, dynamic> data) => post('/user/watch-history', data: data);
  Future<Response> getWatchHistory() => get('/user/watch-history');

  Future<Response> creatorRegister(String email, String password, String? name) =>
      post('/creator/auth/register', data: {'email': email, 'password': password, 'name': name});
  Future<Response> creatorLogin(String email, String password) =>
      post('/creator/auth/login', data: {'email': email, 'password': password});

  Future<Response> getTrending() => get('/trending');
  Future<Response> getNowPlaying() => get('/now-playing');
  Future<Response> searchMedia(String query, {String? type}) =>
      get('/search', params: {'query': query, if (type != null) 'type': type});
  Future<Response> searchAll(String query) =>
      get('/search/all', params: {'q': query});
  Future<Response> getDetails(int id, String type) =>
      get('/details', params: {'id': id, 'type': type});
  Future<Response> getTVSeason(int id, int season) =>
      get('/tv-season', params: {'id': id, 'season': season});
  Future<Response> getStreamSource(int id, String type, {int? season, int? episode}) =>
      get('/source', params: {'id': id, 'type': type, if (season != null) 'season': season, if (episode != null) 'episode': episode});
  Future<Response> getManifestInfo(String url, {int? id, String? type, int? season, int? episode, String? plan}) =>
      get('/manifest-info', params: {'url': url, if (id != null) 'id': id, if (type != null) 'type': type, if (season != null) 'season': season, if (episode != null) 'episode': episode, if (plan != null) 'plan': plan});
  Future<Response> getGenres({String? type}) => get('/genres', params: {if (type != null) 'type': type});
  Future<Response> getCategoryMovies(int genreId, {String? type, int? page}) =>
      get('/category', params: {'id': genreId, if (type != null) 'type': type, if (page != null) 'page': page});
  Future<Response> getDiscover({int? genreId, String? type, String? sortBy, int? page, int? minVotes}) =>
      get('/discover', params: {if (genreId != null) 'genre_id': genreId, if (type != null) 'type': type, if (sortBy != null) 'sort_by': sortBy, if (page != null) 'page': page, if (minVotes != null) 'min_votes': minVotes});
  Future<Response> getHooksFeed({int? page}) => get('/hooks', params: {if (page != null) 'page': page});

  Future<Response> toggleLike(int contentId, String contentType, {int? creatorId}) =>
      post('/interactions/like', data: {'contentId': contentId, 'contentType': contentType, if (creatorId != null) 'creatorId': creatorId});
  Future<Response> checkLike(int contentId, String contentType) =>
      get('/interactions/like', params: {'contentId': contentId, 'contentType': contentType});
  Future<Response> getComments(int contentId, String contentType) =>
      get('/interactions/comments', params: {'contentId': contentId, 'contentType': contentType});
  Future<Response> postComment(int contentId, String contentType, String text, {int? creatorId}) =>
      post('/interactions/comment', data: {'contentId': contentId, 'contentType': contentType, 'text': text, if (creatorId != null) 'creatorId': creatorId});
  Future<Response> deleteComment(int id) => delete('/interactions/comment/$id');
  Future<Response> toggleFollow(int followingId) =>
      post('/interactions/follow', data: {'followingId': followingId});
  Future<Response> checkFollow(int followingId) =>
      get('/interactions/follow', params: {'followingId': followingId});

  Future<Response> getForYouRecommendations() => get('/recommendations/for-you');
  Future<Response> getTrendingRecommendations() => get('/recommendations/trending');
  Future<Response> getSimilarRecommendations(int id, {String? type}) =>
      get('/recommendations/similar/$id', params: {if (type != null) 'type': type});

  Future<Response> getNextAd({int? contentId}) =>
      get('/ads/next', params: {if (contentId != null) 'contentId': contentId});
  Future<Response> recordAdImpression(String placementId, {bool? completed, int? watchedSeconds}) =>
      post('/ads/impression', data: {'placementId': placementId, if (completed != null) 'completed': completed, if (watchedSeconds != null) 'watchedSeconds': watchedSeconds});
  Future<Response> grantBingePass({int? contentId, int? minutes}) =>
      post('/ads/binge-pass', data: {if (contentId != null) 'contentId': contentId, if (minutes != null) 'minutes': minutes});
  Future<Response> getSkipLimit() => get('/ads/skip-limit');
  Future<Response> incrementSkip() => post('/ads/skip');

  Future<Response> getCreatorStats() => get('/creator/stats');
  Future<Response> getCreatorUploads() => get('/creator/uploads');
  Future<Response> uploadFilm(FormData data) => uploadFile('/creator/upload', data);
  Future<Response> getCreatorDashboard() => get('/creator/dashboard');
  Future<Response> getCreatorComments() => get('/creator/comments');
  Future<Response> getArtistGraph() => get('/payouts/graph');
  Future<Response> getPublicCreators() => get('/creator/public');

  Future<Response> initializePayment(String plan) =>
      post('/payment/initialize', data: {'plan': plan});
  Future<Response> verifyPayment(String reference, String plan) =>
      get('/payment/verify', params: {'reference': reference, 'plan': plan});
  Future<Response> getPaymentStatus() => get('/payment/status');
  Future<Response> getGatewayInfo() => get('/payment/gateway-info');

  Future<Response> sendTip(int creatorId, double amount, {String? message}) =>
      post('/tips', data: {'creatorId': creatorId, 'amount': amount, if (message != null) 'message': message});
  Future<Response> createPayoutRecipient(Map<String, dynamic> data) =>
      post('/payouts/recipient', data: data);
  Future<Response> requestWithdraw(double amount) =>
      post('/payouts/withdraw', data: {'amount': amount});
  Future<Response> getPayoutHistory() => get('/payouts/history');
  Future<Response> getBalance() => get('/payouts/balance');

  Future<Response> createTier(Map<String, dynamic> data) => post('/memberships/tiers', data: data);
  Future<Response> updateTier(int id, Map<String, dynamic> data) =>
      put('/memberships/tiers/$id', data: data);
  Future<Response> getCreatorTiers(int creatorId) =>
      get('/memberships/tiers/$creatorId');
  Future<Response> getMyTiers() => get('/memberships/my-tiers');
  Future<Response> subscribeToTier(int tierId) =>
      post('/memberships/subscribe', data: {'tierId': tierId});
  Future<Response> verifyMembershipPayment(String reference) =>
      get('/memberships/verify', params: {'reference': reference});
  Future<Response> getMyMemberships() => get('/memberships/my-memberships');
  Future<Response> cancelMembership(int id) =>
      post('/memberships/$id/cancel');
  Future<Response> getMySubscribers() => get('/memberships/my-subscribers');

  Future<Response> createEvent(Map<String, dynamic> data) => post('/events', data: data);
  Future<Response> updateEvent(int id, Map<String, dynamic> data) =>
      put('/events/$id', data: data);
  Future<Response> getEvents({bool? includePast}) =>
      get('/events', params: {if (includePast != null) 'includePast': includePast});
  Future<Response> getEvent(int id) => get('/events/$id');
  Future<Response> getMyEvents() => get('/events/mine');
  Future<Response> purchaseTicket(int eventId) =>
      post('/events/purchase', data: {'eventId': eventId});
  Future<Response> verifyTicketPayment(String reference) =>
      get('/events/purchase/verify', params: {'reference': reference});
  Future<Response> getMyTickets() => get('/events/my-tickets');

  Future<Response> getProducts({String? category}) =>
      get('/store', params: {if (category != null) 'category': category});
  Future<Response> getProduct(int id) => get('/store/$id');
  Future<Response> createProduct(FormData data) =>
      uploadFile('/store', data);
  Future<Response> updateProduct(int id, FormData data) =>
      uploadFile('/store/$id', data);
  Future<Response> getMyProducts() => get('/store/mine');
  Future<Response> checkoutStore(List<Map<String, dynamic>> items) =>
      post('/store/checkout', data: {'items': items});
  Future<Response> verifyStoreOrder(String reference) =>
      get('/store/checkout/verify', params: {'reference': reference});
  Future<Response> getMyOrders() => get('/store/orders/mine');

  Future<Response> getCourses({String? category}) =>
      get('/courses', params: {if (category != null) 'category': category});
  Future<Response> getCourse(int id) => get('/courses/$id');
  Future<Response> createCourse(FormData data) =>
      uploadFile('/courses', data);
  Future<Response> updateCourse(int id, FormData data) =>
      uploadFile('/courses/$id', data);
  Future<Response> getMyCourses() => get('/courses/mine');
  Future<Response> enrollCourse(int courseId) =>
      post('/courses/enroll', data: {'courseId': courseId});
  Future<Response> verifyCoursePayment(String reference) =>
      get('/courses/enroll/verify', params: {'reference': reference});
  Future<Response> getMyEnrollments() => get('/courses/enrollments/mine');
  Future<Response> updateCourseProgress(int courseId, double progress) =>
      post('/courses/progress', data: {'courseId': courseId, 'progress': progress});

  Future<Response> getCommunities({String? search}) =>
      get('/community', params: {if (search != null) 'search': search});
  Future<Response> getCommunity(int id) => get('/community/$id');
  Future<Response> getMyCommunities() => get('/community/mine');
  Future<Response> createCommunity(Map<String, dynamic> data) =>
      post('/community', data: data);
  Future<Response> joinCommunity(int id) => post('/community/$id/join');
  Future<Response> leaveCommunity(int id) => post('/community/$id/leave');
  Future<Response> addCommunityPost(int communityId, String content) =>
      post('/community/$communityId/posts', data: {'content': content});
  Future<Response> deleteCommunityPost(int communityId, int postId) =>
      delete('/community/$communityId/posts/$postId');

  Future<Response> createArchive(Map<String, dynamic> data) => post('/archive', data: data);
  Future<Response> updateArchive(int id, Map<String, dynamic> data) =>
      put('/archive/$id', data: data);
  Future<Response> getArchiveItems() => get('/archive');
  Future<Response> getArchiveItem(int id) => get('/archive/$id');

  Future<Response> getAchievements() => get('/achievements');
  Future<Response> getMyAchievements() => get('/achievements/mine');
  Future<Response> checkAchievements() => post('/achievements/check');

  Future<Response> generateReferral() => post('/affiliate/generate');
  Future<Response> getAffiliateStats() => get('/affiliate/stats');
  Future<Response> redeemReferral(String code) =>
      post('/affiliate/redeem', data: {'code': code});

  Future<Response> getDownloadedFiles() => get('/downloads/list');
  Future<Response> deleteDownloadedFile(String filename) =>
      delete('/downloads/$filename');

  Future<Response> subscribeNewsletter(String email) =>
      post('/newsletter/subscribe', data: {'email': email});

  Future<Response> getCampaigns() => get('/campaigns');
  Future<Response> createCampaign(Map<String, dynamic> data) =>
      post('/campaigns', data: data);
  Future<Response> updateCampaign(int id, Map<String, dynamic> data) =>
      patch('/campaigns/$id', data: data);

  Future<Response> startSession({String? deviceId}) =>
      post('/sessions/start', data: {if (deviceId != null) 'device_id': deviceId});
  Future<Response> sessionHeartbeat({String? deviceId}) =>
      post('/sessions/heartbeat', data: {if (deviceId != null) 'device_id': deviceId});
  Future<Response> endSession({String? deviceId}) =>
      post('/sessions/end', data: {if (deviceId != null) 'device_id': deviceId});

  Future<Response> adminGetUsers() => get('/admin/users');
  Future<Response> adminGetStats() => get('/admin/stats');
  Future<Response> adminGetUploads() => get('/admin/uploads');
  Future<Response> adminGetCreators() => get('/admin/creators');
  Future<Response> adminUpdateUserRole(int userId, String role) =>
      put('/admin/users/$userId/role', data: {'role': role});
  Future<Response> adminBanUser(int userId) =>
      post('/admin/users/$userId/ban');
  Future<Response> adminSendNewsletter(String subject, String content) =>
      post('/admin/newsletter/send', data: {'subject': subject, 'content': content});
  Future<Response> adminGetNewsletterSubscribers() =>
      get('/admin/newsletter/subscribers');
}
