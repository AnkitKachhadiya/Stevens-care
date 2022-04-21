const mongoCollections = require("../config/mongoCollection");
const uuid = require("uuid");
const ErrorCode = require("../helpers/error-code");
const moment = require("moment");

const cases = mongoCollections.cases;

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

        return caseData;
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
    addCase,
    getMyCases,
    getCaseById,
};
