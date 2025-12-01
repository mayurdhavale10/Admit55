import { ObjectId } from "mongodb";
import { getLoggedInUsersCollection } from "@src/lib/db/loggedinuser/connectDB";
export interface SessionBooking {
  _id?: ObjectId;
  userEmail: string;
  topic: string;
  preferredTime: string;
  status: "pending" | "assigned" | "completed" | "cancelled";
  coachName?: string;
  confirmedDate?: string;
  adminNotes?: string;
  createdAt: Date;
}

export async function createBooking(data: {
  userEmail: string;
  topic: string;
  preferredTime: string;
}): Promise<SessionBooking> {
  const col = await  getLoggedInUsersCollection<SessionBooking>();
  const doc: SessionBooking = {
    userEmail: data.userEmail,
    topic: data.topic,
    preferredTime: data.preferredTime,
    status: "pending",
    createdAt: new Date(),
  };

  const result = await col.insertOne(doc);
  return { ...doc, _id: result.insertedId };
}

export async function getAllBookings() {
  const col = await  getLoggedInUsersCollection<SessionBooking>();
  return col.find({}).sort({ createdAt: -1 }).toArray();
}
