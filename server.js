require("dotenv").config();
const { ApolloServer, gql } = require("apollo-server");
const mongoose = require("mongoose");

mongoose.connect(`${process.env.MONGO_URI}`, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

// ! = required
const typeDefs = gql `
  type Query {
    sayHi: String!
  }
`;
const resolvers = {
    Query: {
        sayHi: () => "Hello World",
    },
};

const server = new ApolloServer({
    typeDefs,
    resolvers,
});

const port = 8001 || process.env.PORT;

server
    .listen({
        port,
    })
    .then((res) => {
        console.log(`Server running at Port ${port}`);
    });