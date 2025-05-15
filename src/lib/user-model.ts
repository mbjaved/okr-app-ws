import { getCollection } from "./mongodb-utils";
import { ObjectId } from "mongodb";

export type UserType = {
  _id: ObjectId;
  name: string;
  email: string;
  password: string;
  role: string;
  avatarUrl?: string;
  department?: string;
  designation?: string;
  manager?: string;
  okrsCount?: number;
};

export const User = {
  async findByEmail(email: string): Promise<UserType | null> {
    const users = await getCollection("users");
    const doc = await users.findOne({ email });
    if (!doc) return null;
    // Map document to UserType
    return {
      _id: doc._id,
      name: doc.name,
      email: doc.email,
      password: doc.password,
      role: doc.role || 'User',
      avatarUrl: doc.avatarUrl || '',
      department: doc.department || '-',
      designation: doc.designation || '-',
      manager: doc.manager || '',
      okrsCount: doc.okrsCount || 0,
    };
  },
  // Additional user methods can be added here
};
