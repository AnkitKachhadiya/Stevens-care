const express = require("express");
const validator = require("../helpers/validator");
const xss = require("xss");
const ErrorCode = require("../helpers/error-code");
const moment = require("moment");
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

//profile page
router.get("/profile", async (request, response) => {
    if (!request.session.user) {
        return response.redirect("/");
    }

    try {
        user = await usersData.get(request.session.user._id);

        response.render("users/profile", {
            pageTitle: "Profile",
            user: user,
        });
    } catch (error) {
        response
            .status(error.code || ErrorCode.INTERNAL_SERVER_ERROR)
            .render("users/profile", {
                pageTitle: "profile",
                error: error.message || "Internal Server Error",
            });
    }
});

//update profile page
router.get("/update-profile", async (request, response) => {
    if (!request.session.user) {
        return response.redirect("/");
    }

    try {
        user = await usersData.get(request.session.user._id);

        user.dateOfBirth = moment(Date.parse(user.dateOfBirth)).format(
            "YYYY-MM-DD"
        );

        response.render("users/update-profile", {
            pageTitle: "Update Profile",
            user: user,
        });
    } catch (error) {
        response
            .status(error.code || ErrorCode.INTERNAL_SERVER_ERROR)
            .render("users/update-profile", {
                pageTitle: "Update profile",
                error: error.message || "Internal Server Error",
            });
    }
});

router.put("/profile", async (request, response) => {
    if (!request.session.user) {
        return response.redirect("/");
    }

    try {
        const requestPostData = request.body;

        validator.isPutProfileFieldsValid(Object.keys(requestPostData).length);

        const firstName = validator.isFirstNameValid(
            xss(requestPostData.firstName)
        );
        const lastName = validator.isLastNameValid(
            xss(requestPostData.lastName)
        );
        const dateOfBirth = validator.isBirthDateValid(
            xss(requestPostData.dateOfBirth)
        );

        const userDetails = request.session.user;
        if (
            firstName === userDetails.firstName &&
            lastName === userDetails.lastName &&
            dateOfBirth === userDetails.dateOfBirth
        ) {
            throwError(
                ErrorCode.BAD_REQUEST,
                "No fields have been changed from their original values, so no update has occurred!"
            );
        }

        const user = await usersData.updateProfile(
            request.session.user._id,
            firstName,
            lastName,
            dateOfBirth
        );

        if (!user.profileUpdated) {
            throwError(
                ErrorCode.INTERNAL_SERVER_ERROR,
                "Internal Server Error"
            );
        }

        response.json({ isError: false });
    } catch (error) {
        response.status(error.code || ErrorCode.INTERNAL_SERVER_ERROR).json({
            isError: true,
            error: error.message || "Internal server error",
        });
    }
});

const throwError = (code = 500, message = "Error: Internal Server Error") => {
    throw { code, message };
};

module.exports = router;
