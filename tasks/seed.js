const dbConnection = require("../config/mongoConnection");
const data = require("../data/");
const admin = data.admin;

async function init() {
    const db = await dbConnection.connectDb();
    db.dropDatabase();

    const adminData = await admin.create("admin@stevens.edu", "stevens@123");

    await dbConnection.disconnectDb();
}

init().catch((error) => {
    console.log(error);
});
