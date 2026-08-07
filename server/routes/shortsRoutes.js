import { Router } from 'express'
import { authMiddleware } from '../middleware/auth.js'
import multer from 'multer'
import { createShort, getShorts, getShort, recordShortView, likeShort, bookmarkShort, shareShort, listShortComments, createShortComment, removeShort } from '../controllers/shortsController.js'

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 1024 * 1024 * 512 } })

const router = Router()

router.get('/', getShorts)
router.get('/:id', authMiddleware, getShort)
router.post('/', authMiddleware, upload.fields([{ name: 'video', maxCount: 1 }, { name: 'thumbnail', maxCount: 1 }]), createShort)
router.post('/:id/view', recordShortView)
router.post('/:id/like', authMiddleware, likeShort)
router.post('/:id/bookmark', authMiddleware, bookmarkShort)
router.post('/:id/share', authMiddleware, shareShort)
router.get('/:id/comments', listShortComments)
router.post('/:id/comment', authMiddleware, createShortComment)
router.delete('/:id', authMiddleware, removeShort)

export default router
