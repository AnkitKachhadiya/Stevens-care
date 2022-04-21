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
        const question2 = requestPostData.question2;
        const question3 = requestPostData.question3;
        const firstTimeProblem = requestPostData.firstTimeProblem;

        const caseId = await casesData.addCase(
            request.session.user._id,
            bodyPartsIds,
            description,
            painRange,
            question1,
            question2,
            question3,
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

router.get("/myCases", async (request, response) => {
    try {
        const myCases = await casesData.getMyCases(
            "6ab4ee5a-8a97-4a78-850f-fff89b546055"
        );

        response.render("cases/my-cases", {
            pageTitle: "My Cases",
            myCases: myCases,
        });
    } catch (error) {
        response
            .status(error.code || ErrorCode.INTERNAL_SERVER_ERROR)
            .render("cases/my-cases", {
                pageTitle: "My Cases",
                error: error.message || "Internal Server Error",
            });
    }
});

router.get("/:id", async (request, response) => {
    try {
        const caseData = await casesData.getCaseById(request.params.id);

        caseData.bodyParts =
            caseData.bodyPartsIds.length > 0
                ? caseData.bodyPartsIds.map((currentBodyPart) =>
                      currentBodyPart.split("-").join(" ")
                  )
                : [];

        console.log(caseData);

        response.render("cases/case", {
            pageTitle: "Case",
            caseData: caseData,
        });
    } catch (error) {
        response
            .status(error.code || ErrorCode.INTERNAL_SERVER_ERROR)
            .render("cases/case", {
                pageTitle: "Case",
                error: error.message || "Internal Server Error",
            });
    }
});

module.exports = router;
