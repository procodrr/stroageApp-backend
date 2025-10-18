import express from "express";
import checkAuth, {
  checkIsAdminUser,
  checkNotRegularUser,
} from "../middlewares/authMiddleware.js";
import {
  deleteUser,
  getAllUsers,
  getCurrentUser,
  login,
  logout,
  logoutAll,
  logoutById,
  register,
} from "../controllers/userController.js";

const router = express.Router();

router.post("/user/register", register);

router.post("/user/login", login);

router.get("/user", checkAuth, getCurrentUser);

router.post("/user/logout", logout);
router.post("/user/logout-all", logoutAll);

router.get("/users", checkAuth, checkNotRegularUser, getAllUsers);

router.post(
  "/users/:userId/logout",
  checkAuth,
  checkNotRegularUser,
  logoutById
);

router.delete("/users/:userId", checkAuth, checkIsAdminUser, deleteUser);

export default router;
