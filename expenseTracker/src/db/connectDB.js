import mongoose from "mongoose";

export const connectDB = async () => {
  try {
    const connection = await mongoose
      .connect(process.env.MONGO_URI, {dbName:"expenseTrackerGraphQL"})
      .then((c) => console.log(`Database connect to: ${c.connection.name}`));
  } catch (error) {
    console.log(`Error: ${error}`);
    process.exit(1);
  }
};
