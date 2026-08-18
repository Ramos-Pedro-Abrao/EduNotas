const express = require("express");
const router = express.Router();

const { criarAdmin, login } = require("../controllers/authController");

router.post("/admin", criarAdmin);
router.post("/login", login);

module.exports = router;