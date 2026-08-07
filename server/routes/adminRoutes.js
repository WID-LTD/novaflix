import { Router } from 'express'
import { authMiddleware } from '../middleware/auth.js'
import { adminMiddleware, requirePermission } from '../middleware/admin.js'
import * as adminController from '../controllers/adminController.js'
import { adminSettle } from '../controllers/creatorEarningsController.js'
import { listAppeals, decideAppeal } from '../controllers/appealController.js'

const router = Router()

router.use(authMiddleware, adminMiddleware)

// RBAC
router.get('/permissions', adminController.listPermissions)
router.get('/me', adminController.getAdminMe)
router.get('/roles', adminController.listRoles)
router.post('/roles', requirePermission('users.roles'), adminController.createRole)
router.put('/roles/:id', requirePermission('users.roles'), adminController.updateRole)
router.delete('/roles/:id', requirePermission('users.roles'), adminController.removeRole)
router.put('/users/:id/admin-role', requirePermission('users.roles'), adminController.assignRole)

router.get('/users', requirePermission('users.view'), adminController.getUsers)
router.get('/users/:id', requirePermission('users.view'), adminController.getUser)
router.put('/users/:id/role', requirePermission('users.edit'), adminController.updateUserRole)
router.post('/users/:id/ban', requirePermission('users.ban'), adminController.banUser)
router.post('/users/:id/unban', requirePermission('users.ban'), adminController.unbanUser)
router.post('/users/:id/suspend', requirePermission('users.ban'), adminController.suspendUser)
router.post('/users/:id/unsuspend', requirePermission('users.ban'), adminController.unsuspendUser)
router.post('/users/:id/verify', requirePermission('users.ban'), adminController.verifyUser)
router.post('/users/:id/unverify', requirePermission('users.ban'), adminController.unverifyUser)
router.get('/stats', requirePermission('dashboard.view'), adminController.getStats)
router.get('/uploads', requirePermission('content.view'), adminController.getUploads)
router.get('/creators', requirePermission('creators.view'), adminController.getCreators)
router.post('/newsletter/send', requirePermission('marketing.announce'), adminController.sendNewsletter)
router.get('/newsletter/subscribers', requirePermission('marketing.announce'), adminController.getNewsletterSubscribers)
router.post('/announcements', requirePermission('marketing.announce'), adminController.sendAnnouncement)
router.post('/payouts/settle', requirePermission('finance.settle'), adminSettle)

// Admin platform v2
router.get('/overview', requirePermission('dashboard.view'), adminController.overview)
router.get('/analytics', requirePermission('analytics.view'), adminController.analytics)
router.get('/catalog', requirePermission('content.view'), adminController.listCatalog)
router.put('/catalog/:kind/:id', requirePermission('content.edit'), adminController.updateCatalogItem)
router.get('/transactions', requirePermission('finance.view'), adminController.transactions)
router.get('/subscriptions', requirePermission('finance.view'), adminController.subscriptions)
router.get('/promo', requirePermission('marketing.promo'), adminController.promoList)
router.post('/promo', requirePermission('marketing.promo'), adminController.promoCreate)
router.get('/banners', requirePermission('marketing.promo'), adminController.bannerList)
router.post('/banners', requirePermission('marketing.promo'), adminController.bannerCreate)
router.get('/feed-settings', requirePermission('feed.edit'), adminController.feedSettingsGet)
router.put('/feed-settings', requirePermission('feed.edit'), adminController.feedSettingsPut)
router.get('/moderation', requirePermission('moderation.view'), adminController.moderationReports)
router.post('/moderation/reports/:id', requirePermission('moderation.resolve'), adminController.moderationResolve)
router.get('/appeals', requirePermission('moderation.view'), listAppeals)
router.post('/appeals/:id', requirePermission('moderation.resolve'), decideAppeal)
router.get('/audit-log', requirePermission('logs.view'), adminController.auditLogList)
router.get('/community', requirePermission('community.view'), adminController.communityList)
router.get('/creator-studio', requirePermission('creators.view'), adminController.creatorStudio)

export default router
