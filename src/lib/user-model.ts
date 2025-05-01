import { getCollection } from "./mongodb-utils";
import { ObjectId } from "mongodb";

export type UserType = {
  _id: ObjectId;
  name: string;
  email: string;
  password: string;
};

export const User = {
  async findByEmail(email: string): Promise<UserType | null> {
    const users = await getCollection("users");
    return users.findOne({ email });
  },
  // Additional user methods can be added here
};
