import { Router } from 'express';
import { getTasks, createTask, updateTask, deleteTask } from '../controllers/taskController.js';
import { protect } from '../middleware/authMiddleware.js';
import {
  validateCreateTask,
  validateUpdateTask,
  validateObjectId,
  validateStatusQuery,
} from '../middleware/validate.js';

const router = Router();

// Every task route requires a logged-in user
router.use(protect);

router.route('/').get(validateStatusQuery, getTasks).post(validateCreateTask, createTask);

router
  .route('/:id')
  .put(validateObjectId, validateUpdateTask, updateTask)
  .delete(validateObjectId, deleteTask);

export default router;
