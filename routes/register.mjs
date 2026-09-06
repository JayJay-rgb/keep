import express from "express";
import registerController  from "../controllers/registerController.mjs";

const registerRouter = express.Router();
registerRouter.post("/register", registerController);
export default registerRouter;