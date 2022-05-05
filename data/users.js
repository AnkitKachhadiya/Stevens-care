const mongoCollections = require("../config/mongoCollection");
const uuid = require("uuid");
const validator = require("../helpers/validator");
const xss = require("xss");
const bcryptjs = require("bcryptjs");
const ErrorCode = require("../helpers/error-code");

const users = mongoCollections.users;

const SALT_ROUNDS = 16;

async function create(
    _firstName,
    _lastName,
    _email,
    _dateOfBirth,
    _password,
    _gender
) {
    try {
        validator.isSignUpTotalFieldsValid(arguments.length);

        const firstName = validator.isFirstNameValid(xss(_firstName));
        const lastName = validator.isLastNameValid(xss(_lastName));
        const email = validator.isEmailValid(xss(_email));
        const dateOfBirth = validator.isBirthDateValid(xss(_dateOfBirth));
        const password = validator.isPasswordValid(xss(_password));
        const gender = xss(_gender);

        const usersCollection = await users();

        const user = await usersCollection.findOne({ email: email });

        if (user) {
            throwError(
                ErrorCode.BAD_REQUEST,
                "Error: Already registered with given email id."
            );
        }

        const passwordHash = await bcryptjs.hash(password, SALT_ROUNDS);

        const newUserId = uuid.v4();

        const newUser = {
            _id: newUserId,
            firstName: firstName,
            lastName: lastName,
            email: email,
            dateOfBirth: dateOfBirth,
            password: passwordHash,
            gender: gender,
        };

        const insertedInfo = await usersCollection.insertOne(newUser);

        if (!insertedInfo.insertedId) {
            throwError(
                ErrorCode.INTERNAL_SERVER_ERROR,
                "Error: Couldn't add user."
            );
        }

        return await get(newUserId);
    } catch (error) {
        throwCatchError(error);
    }
}

async function get(_userId) {
    try {
        validator.isGetUserTotalFieldsValid(arguments.length);

        const userId = validator.isUserIdValid(xss(_userId));

        const usersCollection = await users();

        const user = await usersCollection.findOne(
            { _id: userId },
            {
                projection: {
                    _id: 1,
                    firstName: 1,
                    lastName: 1,
                    email: 1,
                    dateOfBirth: 1,
                    gender: 1,
                },
            }
        );

        if (!user) {
            throwError(ErrorCode.NOT_FOUND, "Error: User not found.");
        }

        return user;
    } catch (error) {
        throwCatchError(error);
    }
}

async function checkUser(_email, _password) {
    try {
        validator.isCheckUserTotalFieldsValid(arguments.length);

        const email = validator.isEmailValid(xss(_email));
        const password = validator.isPasswordValid(xss(_password));

        const usersCollection = await users();

        const user = await usersCollection.findOne(
            { email: email },
            {
                projection: {
                    _id: 1,
                    firstName: 1,
                    lastName: 1,
                    email: 1,
                    dateOfBirth: 1,
                    password: 1,
                },
            }
        );

        if (!user) {
            throwError(
                ErrorCode.BAD_REQUEST,
                "Error: Incorrect email or password."
            );
        }

        const isPasswordCorrect = await bcryptjs.compare(
            password,
            user.password
        );

        if (!isPasswordCorrect) {
            throwError(
                ErrorCode.BAD_REQUEST,
                "Error: Incorrect email or password."
            );
        }

        delete user.password;

        return user;
    } catch (error) {
        throwCatchError(error);
    }
}

async function updateProfile(
    _userId,
    _firstName,
    _lastName,
    _dateOfBirth,
    _gender
) {
    try {
        validator.isUpdateProfileFieldsValid(arguments.length);

        const userId = validator.isUserIdValid(xss(_userId));
        const firstName = validator.isFirstNameValid(xss(_firstName));
        const lastName = validator.isLastNameValid(xss(_lastName));
        const dateOfBirth = validator.isBirthDateValid(xss(_dateOfBirth));
        const gender = xss(_gender);

        const usersCollection = await users();

        const user = await usersCollection.findOne(
            { _id: userId },
            {
                projection: {
                    _id: 1,
                },
            }
        );

        if (!user) {
            throwError(ErrorCode.NOT_FOUND, "Error: User not found.");
        }

        const toBeUpdated = {
            firstName: firstName,
            lastName: lastName,
            dateOfBirth: dateOfBirth,
            gender: gender,
        };

        const updatedInfo = await usersCollection.updateOne(
            { _id: userId },
            { $set: toBeUpdated }
        );

        if (updatedInfo.modifiedCount !== 1) {
            throwError(
                ErrorCode.INTERNAL_SERVER_ERROR,
                "Error: Could not update profile."
            );
        }

        return { profileUpdated: true };
    } catch (error) {
        throwCatchError(error);
    }
}

async function updatePassword(
    _userId,
    _currentPassword,
    _newPassword,
    _confirmPassword
) {
    try {
        validator.isUpdatePasswordTotalFieldsValid(arguments.length);

        const userId = validator.isUserIdValid(xss(_userId));
        const currentPassword = validator.isPasswordValid(
            xss(_currentPassword)
        );
        const newPassword = validator.isPasswordValid(xss(_newPassword));
        const confirmPassword = validator.isPasswordValid(
            xss(_confirmPassword)
        );

        if (newPassword !== confirmPassword) {
            throwError(
                ErrorCode.BAD_REQUEST,
                "Error: Confirm password does not match new password."
            );
        }

        const usersCollection = await users();

        const user = await usersCollection.findOne(
            { _id: userId },
            {
                projection: {
                    _id: 1,
                    password: 1,
                },
            }
        );

        if (!user) {
            throwError(ErrorCode.NOT_FOUND, "Error: User not found.");
        }

        const isPasswordCorrect = await bcryptjs.compare(
            currentPassword,
            user.password
        );

        if (!isPasswordCorrect) {
            throwError(
                ErrorCode.BAD_REQUEST,
                "Error: Incorrect current password."
            );
        }

        const newPasswordHash = await bcryptjs.hash(newPassword, SALT_ROUNDS);

        const toBeUpdated = {
            password: newPasswordHash,
        };

        const updatedInfo = await usersCollection.updateOne(
            { _id: userId },
            { $set: toBeUpdated }
        );

        if (updatedInfo.modifiedCount !== 1) {
            throwError(
                ErrorCode.INTERNAL_SERVER_ERROR,
                "Error: Could not update password."
            );
        }

        return { passwordUpdated: true };
    } catch (error) {
        throwCatchError(error);
    }
}

const throwError = (code = 500, message = "Error: Internal Server Error") => {
    throw { code, message };
};

const throwCatchError = (error) => {
    console.log(error);
    if (error.code && error.message) {
        throwError(error.code, error.message);
    }

    throwError(
        ErrorCode.INTERNAL_SERVER_ERROR,
        "Error: Internal server error."
    );
};

module.exports = {
    create,
    get,
    checkUser,
    updateProfile,
    updatePassword,
};
