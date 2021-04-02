const postsResolvers = require("./Post");
const userResolvers = require("./User");

module.exports = {
    Query: {
        ...postsResolvers.Query,
    },
    Mutation: {
        ...userResolvers.Mutation,
    },
};