const mongoCollections = require("../config/mongoCollection");
const uuid = require("uuid");
const ErrorCode = require("../helpers/error-code");
const moment = require("moment");

const cases = mongoCollections.cases;
const users = mongoCollections.users;

async function addCase(
    userId,
    bodyPartsIds,
    description,
    painRange,
    question1,
    question2,
    question3,
    firstTimeProblem
) {
    try {
        const newCaseId = uuid.v4();

        const newCase = {
            userId,
            bodyPartsIds,
            description,
            painRange,
            question1,
            question2,
            question3,
            firstTimeProblem,
            _id: newCaseId,
            dateOfCreation: moment().format("MM/DD/YYYY"),
            isCaseOpen: true,
            caseComment: "",
            caseClosingDate: "",
        };

        const casesCollection = await cases();

        const insertedInfo = await casesCollection.insertOne(newCase);

        if (!insertedInfo.insertedId) {
            throwError(
                ErrorCode.INTERNAL_SERVER_ERROR,
                "Error: Couldn't add new case."
            );
        }

        return newCaseId;
    } catch (error) {
        throwCatchError(error);
    }
}

async function getMyCases(userId) {
    try {
        const casesCollection = await cases();

        const myCases = await casesCollection
            .find(
                { userId: userId },
                {
                    projection: {
                        _id: 1,
                        description: 1,
                        dateOfCreation: 1,
                        isCaseOpen: 1,
                    },
                }
            )
            .sort({ isCaseOpen: -1, dateOfCreation: 1 })
            .toArray();

        return myCases;
    } catch (error) {
        throwCatchError(error);
    }
}

async function getCaseById(caseId) {
    try {
        const casesCollection = await cases();

        const caseData = await casesCollection.findOne({ _id: caseId });

        const usersCollection = await users();

        const userData = await usersCollection.findOne(
            { _id: caseData.userId },
            {
                projection: {
                    firstName: 1,
                    lastName: 1,
                    email: 1,
                    dateOfBirth: 1,
                    gender: 1,
                },
            }
        );

        caseData.user = userData;

        return caseData;
    } catch (error) {
        throwCatchError(error);
    }
}

async function getAllCases() {
    try {
        const casesCollection = await cases();

        const allCases = await casesCollection
            .aggregate([
                {
                    $lookup: {
                        from: "users",
                        localField: "userId",
                        foreignField: "_id",
                        as: "user",
                    },
                },
                {
                    $project: {
                        _id: 1,
                        description: 1,
                        dateOfCreation: 1,
                        isCaseOpen: 1,
                        firstName: { $arrayElemAt: ["$user.firstName", 0] },
                        lastName: { $arrayElemAt: ["$user.lastName", 0] },
                    },
                },
                {
                    $sort: {
                        isCaseOpen: -1,
                        dateOfCreation: 1,
                    },
                },
            ])
            .toArray();

        return allCases;
    } catch (error) {
        throwCatchError(error);
    }
}

async function closeCase(caseComment, caseId) {
    try {
        const casesCollection = await cases();

        const toBeUpdated = {
            isCaseOpen: false,
            caseComment: caseComment,
            caseClosingDate: moment().format("MM/DD/YYYY"),
        };

        const updatedInfo = await casesCollection.updateOne(
            { _id: caseId },
            { $set: toBeUpdated }
        );

        if (updatedInfo.modifiedCount !== 1) {
            throwError(
                ErrorCode.INTERNAL_SERVER_ERROR,
                "Error: Could not update case."
            );
        }

        return { caseUpdated: true };
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
    addCase,
    getMyCases,
    getCaseById,
    getAllCases,
    closeCase,
};
