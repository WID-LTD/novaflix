import { Router } from 'express'
import { getNews, getHomeNews, getIndustryWatch, getArticle, getArticleContent, fetchDeepDive } from '../controllers/newsController.js'

const router = Router()

router.get('/', getNews)
router.get('/home', getHomeNews)
router.get('/industry', getIndustryWatch)
router.get('/article', getArticle)
router.get('/article-content', getArticleContent)
router.get('/fetch-deep-dive', fetchDeepDive)

export default router
