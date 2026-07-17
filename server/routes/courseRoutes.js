import { Router } from 'express'
import { authMiddleware } from '../middleware/auth.js'
import { creatorOrAdminMiddleware } from '../middleware/admin.js'
import {
  createCourseHandler, updateCourseHandler, listCourses, getCourse, myCourses,
  enroll, verifyEnrollment, myEnrollments, updateProgress,
} from '../controllers/courseController.js'

const router = Router()

router.post('/', authMiddleware, creatorOrAdminMiddleware, createCourseHandler)
router.patch('/:id', authMiddleware, creatorOrAdminMiddleware, updateCourseHandler)
router.get('/', listCourses)
router.get('/mine', authMiddleware, creatorOrAdminMiddleware, myCourses)
router.get('/:id', getCourse)

router.post('/enroll', authMiddleware, enroll)
router.get('/enroll/verify', authMiddleware, verifyEnrollment)
router.post('/progress', authMiddleware, updateProgress)
router.get('/enrollments/mine', authMiddleware, myEnrollments)

export default router
