const express = require("express");
const validator = require("../helpers/validator");
const xss = require("xss");
const ErrorCode = require("../helpers/error-code");
const data = require("../data");

const usersData = data.users;
const router = express.Router();

router.get("/", async (request, response) => {
    response.render("questions", { pageTitle: "Questions" });
});

module.exports = router;
