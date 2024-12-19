import Transaction from "../models/transaction.model.js";
import User from "../models/user.model.js";
// import { users } from "../utils/dummyData.js";
import bcrypt from "bcryptjs";

const userResolver = {
  Mutation: {
    signUp: async (_, { input }, context) => {
      try {
        const { username, name, password, gender } = input;
        if (!username || !name || !password || !gender)
          throw new Error("All fields are required");

        const existingUser = await User.findOne({ username });
        if (existingUser) throw new Error("User Already Exists");

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const boyProfilePicture = `https://avatar.iran.liara.run/public/boy?username=${username}`;
        const girlProfilePicture = `https://avatar.iran.liara.run/public/girl?username=${username}`;

        const newUser = new User({
          username,
          name,
          password: hashedPassword,
          gender,
          profilePicture:
            gender === "male" ? boyProfilePicture : girlProfilePicture,
        });

        await newUser.save();
        await context.login(newUser);
        return newUser;
      } catch (error) {
        console.log("Error in singUp: ", error);
        throw new Error(error.message || "Internal server error");
      }
    },

    login: async (_, { input }, context) => {
      try {
        const { username, password } = input;
        const { user } = await context.authenticate("graphql-local", {
          username,
          password,
        });
        await context.login(user);
        return user;
      } catch (error) {
        console.log("Error in login: ", error);
        throw new Error(error.message || "Internal server error");
      }
    },

    logout: async (_, __, context) => {
      try {
        await context.logout();
        context.req.session.destroy((error) => {
          if (error) throw error;
        });
        context.res.clearCookie("connect.sid");

        return { message: "Logged out successfully!" };
      } catch (error) {
        console.log("Error in logout: ", error);
        throw new Error(error.message || "Internal server error");
      }
    },
  },

  Query: {
    // users: (_, __, { req, res }) => {
    //   return users;
    // },
    authUser: async (_, __, context) => {
      try {
        const user = await context.getUser();
        return user;
      } catch (error) {
        console.log("Error in authUser: ", error);
        throw new Error(error.message || "Internal server error");
      }
    },

    user: async (_, { userId }) => {
      try {
        const user = await User.findById(userId);
        return user;
      } catch (error) {
        console.log("Error in getting user: ", error);
        throw new Error(error.message || "Error in getting user");
      }
    },
  },

  User: {
    transactions: async (parent) => {
      try {
        const transactions = Transaction.find({ userId: parent._id });
        return transactions;
      } catch (error) {
        console.log("Error in user transaction resolver: ", error);
        throw new Error(error.message || "Internal server error");
      }
    },
  },
};

export default userResolver;
