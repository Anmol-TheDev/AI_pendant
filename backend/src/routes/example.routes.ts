import { Router } from 'express';
import * as exampleController from '../controllers/example.controller';
import { validate } from '../middlewares/validate';
import {
  createExampleSchema,
  updateExampleSchema,
} from '../schemas/example.schema';

const router = Router();



/** Create a new example */
router.post(
  '/',
  validate(createExampleSchema),
  exampleController.createExample
);

/** Get all examples with pagination */
router.get('/', exampleController.getExamples);

/** Get example by ID */
router.get('/:id', exampleController.getExampleById);

/** Update example by ID */
router.put(
  '/:id',
  validate(updateExampleSchema),
  exampleController.updateExample
);

/** Delete example by ID */
router.delete('/:id', exampleController.deleteExample);

export default router;
