import { Router, type IRouter } from "express";
import healthRouter from "./health";
import downloadsRouter from "./downloads";
import adminRouter from "./admin";

const router: IRouter = Router();

router.use(healthRouter);
router.use(downloadsRouter);
router.use(adminRouter);

export default router;
