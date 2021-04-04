require("dotenv").config();
const { ApolloServer } = require("apollo-server");
const mongoose = require("mongoose");

// GraphQL
const typeDefs = require("./graphql/typeDefs");
const resolvers = require("./graphql/resolvers");

mongoose
    .connect(`${process.env.MONGO_URI}`, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    })
    .then(() => console.log("DB is Connected"))
    .catch((err) => console.log(err));

const server = new ApolloServer({
    typeDefs,
    resolvers,
    context: ({ req }) => ({ req }), // it will send req to every route
});

const port = 8001 || process.env.PORT;

server
    .listen({
        port,
    })
    .then(() => {
        console.log(`Server running at Port ${port}`);
    });