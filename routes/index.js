const usersRoutes = require("./users");
const questionsRoutes = require("./questions");
const path = require("path");

const constructorMethod = (app) => {
    app.use("/users", usersRoutes);
    app.use("/questions", questionsRoutes);
    app.get("/", (request, response) => {
        return response.render("home", { pageTitle: "Home" });
    });

    //for accessing unknown routes
    app.use("*", (request, response) => {
        response
            .status(404)
            .sendFile(path.resolve("static/page-not-found.html"));
    });

    //for invalid URI
    app.use(function (error, request, response, next) {
        response
            .status(404)
            .sendFile(path.resolve("static/page-not-found.html"));
    });
};

module.exports = constructorMethod;
