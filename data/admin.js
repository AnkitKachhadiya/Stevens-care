const mongoCollections = require("../config/mongoCollection");
const uuid = require("uuid");
const ErrorCode = require("../helpers/error-code");
const validator = require("../helpers/validator");
const xss = require("xss");
const bcryptjs = require("bcryptjs");
const moment = require("moment");

const admin = mongoCollections.admin;

const SALT_ROUNDS = 16;

async function create(_email, _password) {
    try {
        const email = validator.isEmailValid(xss(_email));
        const password = validator.isPasswordValid(xss(_password));

        const adminCollection = await admin();

        const adminData = await adminCollection.findOne({ email: email });

        if (adminData) {
            throwError(
                ErrorCode.BAD_REQUEST,
                "Error: Already registered with given email id."
            );
        }

        const passwordHash = await bcryptjs.hash(password, SALT_ROUNDS);

        const newAdminId = uuid.v4();

        const newAdmin = {
            _id: newAdminId,
            email: email,
            password: passwordHash,
        };

        const insertedInfo = await adminCollection.insertOne(newAdmin);

        if (!insertedInfo.insertedId) {
            throwError(
                ErrorCode.INTERNAL_SERVER_ERROR,
                "Error: Couldn't add admin."
            );
        }

        delete newAdmin.password;

        return newAdmin;
    } catch (error) {
        throwCatchError(error);
    }
}

async function checkAdmin(_email, _password) {
    try {
        const email = validator.isEmailValid(xss(_email));
        const password = validator.isPasswordValid(xss(_password));

        const adminCollection = await admin();

        const adminData = await adminCollection.findOne({ email: email });

        if (!adminData) {
            throwError(
                ErrorCode.BAD_REQUEST,
                "Error: Incorrect email or password."
            );
        }

        const isPasswordCorrect = await bcryptjs.compare(
            password,
            adminData.password
        );

        if (!isPasswordCorrect) {
            throwError(
                ErrorCode.BAD_REQUEST,
                "Error: Incorrect email or password."
            );
        }

        delete adminData.password;

        return adminData;
    } catch (error) {
        throwCatchError(error);
    }
}

const throwError = (code = 500, message = "Error: Internal Server Error") => {
    throw { code, message };
};

const throwCatchError = (error) => {
    if (error.code && error.message) {
        throwError(error.code, error.message);
    }

    throwError(
        ErrorCode.INTERNAL_SERVER_ERROR,
        "Error: Internal server error."
    );
};

module.exports = {
    checkAdmin,
    create,
};
