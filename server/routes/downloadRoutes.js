import { Router } from 'express'
import { authMiddleware } from '../middleware/auth.js'
import * as downloadController from '../controllers/downloadController.js'
import * as deviceController from '../controllers/downloadDeviceController.js'

const router = Router()

// Download-device registry (plan caps: 0/1/1/2/6)
router.get('/devices', authMiddleware, deviceController.list)
router.post('/devices/register', authMiddleware, deviceController.register)
router.delete('/devices/:deviceId', authMiddleware, deviceController.remove)

router.get('/list', authMiddleware, downloadController.list)
router.delete('/:filename', authMiddleware, downloadController.remove)

export default router
