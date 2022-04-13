const express = require("express");
const validator = require("../helpers/validator");
const xss = require("xss");
const data = require("../data");

const usersData = data.users;
const router = express.Router();

//login form
router.get("/", async (request, response) => {
    if (request.session.user) {
        return response.redirect("/");
    }

    const signedUpFlashMessage = request.app.locals.isSignedUp
        ? request.app.locals.signedUpFlashMessage
        : false;

    request.app.locals.isSignedUp = undefined;
    request.app.locals.signedUpFlashMessage = undefined;

    response.render("users/login", {
        pageTitle: "Login",
        signedUpFlashMessage: signedUpFlashMessage,
    });
});

//signup form
router.get("/signup", async (request, response) => {
    if (request.session.user) {
        return response.redirect("/");
    }

    response.render("users/sign-up", { pageTitle: "Sign-up" });
});

//signup submit
router.post("/signup", async (request, response) => {
    if (request.session.user) {
        return response.redirect("/");
    }

    try {
        const requestPostData = request.body;

        validator.isSignUpTotalFieldsValid(Object.keys(requestPostData).length);

        const firstName = validator.isFirstNameValid(
            xss(requestPostData.firstName)
        );
        const lastName = validator.isLastNameValid(
            xss(requestPostData.lastName)
        );
        const email = validator.isEmailValid(xss(requestPostData.email));
        const dateOfBirth = validator.isBirthDateValid(
            xss(requestPostData.dateOfBirth)
        );
        const password = validator.isPasswordValid(
            xss(requestPostData.password)
        );

        const user = await usersData.create(
            firstName,
            lastName,
            email,
            dateOfBirth,
            password
        );

        if (!user) {
            throwError(
                ErrorCode.INTERNAL_SERVER_ERROR,
                "Internal Server Error"
            );
        }

        request.app.locals.isSignedUp = true;
        request.app.locals.signedUpFlashMessage =
            "Signed up successfully. Login to start using Stevens Care.";

        response.json({ isError: false });
    } catch (error) {
        response.status(error.code || ErrorCode.INTERNAL_SERVER_ERROR).json({
            isError: true,
            error: error.message || "Error: Internal server error.",
        });
    }
});

//login submit
router.post("/login", async (request, response) => {
    if (request.session.user) {
        return response.redirect("/");
    }

    try {
        const requestPostData = request.body;

        validator.isLoginTotalFieldsValid(Object.keys(requestPostData).length);

        const email = validator.isEmailValid(xss(requestPostData.email));
        const password = validator.isPasswordValid(
            xss(requestPostData.password)
        );

        const user = await usersData.checkUser(email, password);

        if (!user) {
            throwError(
                ErrorCode.INTERNAL_SERVER_ERROR,
                "Internal Server Error"
            );
        }

        request.session.user = user;

        request.app.locals.isUserAuthenticated = true;

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
    const user = request.session.user;

    if (user) {
        request.session.destroy();
        request.app.locals.isUserAuthenticated = false;
    }

    response.redirect("/users");
});

const throwError = (code = 500, message = "Error: Internal Server Error") => {
    throw { code, message };
};

module.exports = router;
