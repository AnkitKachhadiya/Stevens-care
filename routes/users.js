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

        const gender = xss(requestPostData.gender);

        const user = await usersData.create(
            firstName,
            lastName,
            email,
            dateOfBirth,
            password,
            gender
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

//update profile page view
router.get("/update-profile", async (request, response) => {
    if (!request.session.user) {
        return response.redirect("/");
    }

    try {
        const user = await usersData.get(request.session.user._id);

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

//submit update profile page
router.put("/profile", async (request, response) => {
    if (!request.session.user) {
        return response.redirect("/");
    }

    try {
        const requestPostData = request.body;

        validator.isSubmitProfileFieldsValid(
            Object.keys(requestPostData).length
        );

        const firstName = validator.isFirstNameValid(
            xss(requestPostData.firstName)
        );
        const lastName = validator.isLastNameValid(
            xss(requestPostData.lastName)
        );
        const dateOfBirth = validator.isBirthDateValid(
            xss(requestPostData.dateOfBirth)
        );
        const gender = xss(requestPostData.gender);

        const userDetails = request.session.user;

        if (
            firstName === userDetails.firstName &&
            lastName === userDetails.lastName &&
            dateOfBirth === userDetails.dateOfBirth &&
            gender === userDetails.gender
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
            dateOfBirth,
            gender
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

//change password form view
router.get("/changePassword", async (request, response) => {
    if (!request.session.user) {
        return response.redirect("/");
    }

    const passwordUpdatedFlashMessage = request.app.locals.isPasswordUpdated
        ? request.app.locals.passwordUpdatedFlashMessage
        : false;

    request.app.locals.isPasswordUpdated = undefined;
    request.app.locals.passwordUpdatedFlashMessage = undefined;

    response.render("users/change-password", {
        pageTitle: "Change Password",
        passwordUpdatedFlashMessage: passwordUpdatedFlashMessage,
    });
});

//change password submit
router.put("/password", async (request, response) => {
    if (!request.session.user) {
        return response.redirect("/");
    }

    try {
        const requestPostData = request.body;

        validator.isSubmitPasswordFieldValid(
            Object.keys(requestPostData).length
        );

        const currentPassword = validator.isPasswordValid(
            xss(requestPostData.currentPassword)
        );
        const newPassword = validator.isPasswordValid(
            xss(requestPostData.newPassword)
        );
        const confirmPassword = validator.isPasswordValid(
            xss(requestPostData.confirmPassword)
        );

        if (newPassword !== confirmPassword) {
            throwError(
                ErrorCode.BAD_REQUEST,
                "Error: Confirm password does not match new password."
            );
        }

        const password = await usersData.updatePassword(
            request.session.user._id,
            currentPassword,
            newPassword,
            confirmPassword
        );

        if (!password.passwordUpdated) {
            throwError(
                ErrorCode.INTERNAL_SERVER_ERROR,
                "Internal Server Error"
            );
        }

        request.app.locals.isPasswordUpdated = true;
        request.app.locals.passwordUpdatedFlashMessage =
            "Your password has been changed successfully.";

        response.json({ isError: false });
    } catch (error) {
        response.status(error.code || ErrorCode.INTERNAL_SERVER_ERROR).json({
            isError: true,
            error: error.message || "Error: Internal server error.",
        });
    }
});

//user options view
router.get("/options", async (request, response) => {
    if (!request.session.user) {
        return response.redirect("/");
    }

    response.render("users/options", { pageTitle: "Options" });
});

const throwError = (code = 500, message = "Error: Internal Server Error") => {
    throw { code, message };
};

module.exports = router;
