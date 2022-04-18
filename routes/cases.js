const express = require("express");
const validator = require("../helpers/validator");
const xss = require("xss");
const ErrorCode = require("../helpers/error-code");
const data = require("../data");

const casesData = data.cases;
const router = express.Router();

router.get("/addCase", async (request, response) => {
    response.render("questions", { pageTitle: "Questions" });
});

router.post("/addCase", async (request, response) => {
    try {
        const requestPostData = request.body;

        const bodyPartsIds = requestPostData.bodyPartsIds;
        const description = requestPostData.description;
        const painRange = requestPostData.painRange;
        const question1 = requestPostData.question1;
        const question3 = requestPostData.question3;
        const question4 = requestPostData.question4;
        const firstTimeProblem = requestPostData.firstTimeProblem;

        const caseId = await casesData.addCase(
            request.session.user._id,
            bodyPartsIds,
            description,
            painRange,
            question1,
            question3,
            question4,
            firstTimeProblem
        );

        response.json({ caseId });
    } catch (error) {
        response.status(error.code || ErrorCode.INTERNAL_SERVER_ERROR).json({
            isError: true,
            error: error.message || "Error: Internal server error.",
        });
    }
});
module.exports = router;
