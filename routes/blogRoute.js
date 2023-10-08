import express from 'express';
import { blogFilter, blogStatsFetch } from '../controllers/blogController.js';

const router = express.Router();

router.route('/blog-stats').get( blogStatsFetch);

router.route('/blog-search').get(blogFilter);

export default router;