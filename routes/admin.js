const express = require("express");
const ErrorCode = require("../helpers/error-code");
const validator = require("../helpers/validator");
const xss = require("xss");
const data = require("../data");

const adminData = data.admin;
const casesData = data.cases;
const router = express.Router();

router.get("/", async (request, response) => {
    if (request.session.user || request.session.admin) {
        return response.redirect("/");
    }

    response.render("admin/login", { layout: false, pageTitle: "Login" });
});

//login submit
router.post("/login", async (request, response) => {
    if (request.session.user || request.session.admin) {
        return response.redirect("/");
    }

    try {
        const requestPostData = request.body;

        const email = validator.isEmailValid(xss(requestPostData.email));
        const password = validator.isPasswordValid(
            xss(requestPostData.password)
        );

        const admin = await adminData.checkAdmin(email, password);

        if (!admin) {
            throwError(
                ErrorCode.INTERNAL_SERVER_ERROR,
                "Internal Server Error"
            );
        }

        request.session.admin = admin;

        request.app.locals.isAdminAuthenticated = true;

        response.json({ isError: false });
    } catch (error) {
        response.status(error.code || ErrorCode.INTERNAL_SERVER_ERROR).json({
            isError: true,
            error: error.message || "Error: Internal server error.",
        });
    }
});

//logout
router.get("/logout", async (request, response) => {
    const admin = request.session.admin;

    if (admin) {
        request.session.destroy();
        request.app.locals.isAdminAuthenticated = false;
    }

    response.redirect("/admin");
});

router.get("/cases", async (request, response) => {
    if (!request.session.admin) {
        return response.redirect("/");
    }

    try {
        const allCases = await casesData.getAllCases();

        response.render("cases/all-cases", {
            layout: false,
            pageTitle: "All Cases",
            allCases: allCases,
        });
    } catch (error) {
        response
            .status(error.code || ErrorCode.INTERNAL_SERVER_ERROR)
            .render("cases/all-cases", {
                pageTitle: "All Cases",
                error: error.message || "Internal Server Error",
            });
    }
});

router.get("/case/:id", async (request, response) => {
    if (!request.session.admin) {
        return response.redirect("/");
    }

    try {
        const caseData = await casesData.getCaseById(request.params.id);

        caseData.bodyParts =
            caseData.bodyPartsIds.length > 0
                ? caseData.bodyPartsIds.map((currentBodyPart) =>
                      currentBodyPart.split("-").join(" ")
                  )
                : [];

        response.render("cases/admin-case", {
            layout: false,
            pageTitle: "Case",
            caseData: caseData,
        });
    } catch (error) {
        response
            .status(error.code || ErrorCode.INTERNAL_SERVER_ERROR)
            .render("cases/admin-case", {
                pageTitle: "Case",
                error: error.message || "Internal Server Error",
            });
    }
});

router.post("/closeCase/:id", async (request, response) => {
    if (!request.session.admin) {
        return response.redirect("/");
    }

    try {
        console.log(request.body, request.params);
        const requestPostData = request.body;

        const caseComment = requestPostData.caseComment.trim();
        const caseId = request.params.id.trim();

        await casesData.closeCase(caseComment, caseId);

        response.redirect(`/admin/case/${request.params.id}`);
    } catch (error) {
        response.redirect(`/admin/case/${request.params.id}`);
    }
});

module.exports = router;
