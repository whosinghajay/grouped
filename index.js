import express from "express";
import http from "http";
import cors from "cors";
import dotenv from "dotenv";

import passport from "passport";
import session from "express-session";
import connectMongo from "connect-mongodb-session";

import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@apollo/server/express4";
import { ApolloServerPluginDrainHttpServer } from "@apollo/server/plugin/drainHttpServer";

import { buildContext } from "graphql-passport";

import mergedResolvers from "./expenseTracker/src/resolvers/index.js";
import mergedTypeDefs from "./expenseTracker/src/typeDefs/index.js";

import { connectDB } from "./expenseTracker/src/db/connectDB.js";
import { configurePassport } from "./expenseTracker/src/utils/passport.config.js";

dotenv.config();
configurePassport();

const app = express();
const httpServer = http.createServer(app);

const MongoDBStore = connectMongo(session);

const store = new MongoDBStore({
  uri: `${process.env.MONGO_URI}expenseTrackerGraphQL`,
  collection: "sessions",
});

store.on("error", (err) => console.log("MongoDB session store error: ", err));

app.use(
  session({
    secret: process.env.SECRET_SESSION,
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 1000 * 60 * 60 * 24 * 7,
      httpOnly: true,
    },
    store: store,
  })
);

app.use(passport.initialize());
app.use(passport.session());

const server = new ApolloServer({
  typeDefs: mergedTypeDefs,
  resolvers: mergedResolvers,
  plugins: [ApolloServerPluginDrainHttpServer({ httpServer })],
});
await server.start();

app.use(
  "/graphql/expenseTracker",
  cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
  }),
  express.json(),
  expressMiddleware(server, {
    context: async ({ req, res }) => buildContext({ req, res }),
  })
);

await new Promise((resolve) => httpServer.listen({ port: 4000 }, resolve)).then();
await connectDB();
