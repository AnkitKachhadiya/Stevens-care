const dbConnection = require("../config/mongoConnection");
const data = require("../data/");
const admin = data.admin;

async function init() {
    const adminData = await admin.create("admin@stevens.edu", "stevens@123");
}

init().catch((error) => {
    console.log(error);
});
