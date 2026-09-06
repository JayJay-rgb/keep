import {createGroup} from "../controllers/groups/createGroup.mjs";
import {joinGroup,getMyGroups,getGroup} from "../controllers/groups/joinGroup.mjs";
import verifyJwt from "../middleware/verifyJwt.mjs";
import {leaveGroup} from "../controllers/groups/leaveGroup.mjs";
import {kickMember} from "../controllers/groups/kickMember.mjs";
import express from "express";

const groupRouter = express.Router();

groupRouter.post("/", verifyJwt, createGroup);
groupRouter.get("/mine", verifyJwt, getMyGroups);
groupRouter.post("/join/:inviteCode", verifyJwt, joinGroup);
groupRouter.post("/leave/:id", verifyJwt, leaveGroup);
groupRouter.delete("/:groupId/members/:targetUserId", verifyJwt, kickMember);
groupRouter.get("/:groupId", verifyJwt, getGroup);

export default groupRouter;