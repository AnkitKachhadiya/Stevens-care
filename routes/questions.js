const express = require("express");
const validator = require("../helpers/validator");
const xss = require("xss");
const ErrorCode = require("../helpers/error-code");
const data = require("../data");

const usersData = data.users;
const router = express.Router();

router.get("/page1", async (request, response) => {
    response.render("questions/body", { pageTitle: "Questions" });
});

module.exports = router;
