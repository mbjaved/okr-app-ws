import { ObjectId } from "mongodb";

export interface Department {
  _id?: ObjectId;
  name: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}
