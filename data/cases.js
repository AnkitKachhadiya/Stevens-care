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
    question3,
    question4,
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
            question3,
            question4,
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
};
