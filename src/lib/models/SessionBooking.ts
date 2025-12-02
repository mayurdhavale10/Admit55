// src/lib/models/SessionBooking.ts
import { ObjectId } from "mongodb";
import { getSessionBookingsCollection } from "@src/lib/db/loggedinuser/connectDB";

/**
 * Allowed booking status values.
 * - pending  : user requested, waiting for admin/coach
 * - accepted : confirmed with coach/date
 * - rejected : explicitly declined
 * - completed: session done
 * - cancelled: cancelled by user/admin
 */
export type BookingStatus =
  | "pending"
  | "accepted"
  | "rejected"
  | "completed"
  | "cancelled";

export interface SessionBooking {
  _id?: ObjectId;

  // who requested
  userEmail: string;
  userName?: string;
  userPhone?: string;

  // request details
  topic: string;          // e.g. "school", "profile", "interview"
  preferredTime: string;  // free text: "weekends 7–9 PM IST"
  message?: string;       // optional extra context from user

  // admin / coach handling
  status: BookingStatus;
  coachId?: string;       // future: ObjectId string of coach user
  coachName?: string;
  confirmedDate?: string; // ISO string or human readable date/time
  adminNotes?: string;    // internal notes for coach/admin

  // timestamps
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Create a new booking in the session_bookings collection.
 */
export async function createBooking(input: {
  userEmail: string;
  userName?: string;
  userPhone?: string;
  topic: string;
  preferredTime: string;
  message?: string;
}): Promise<SessionBooking> {
  const col = await getSessionBookingsCollection<SessionBooking>();
  const now = new Date();

  const doc: SessionBooking = {
    userEmail: input.userEmail,
    userName: input.userName,
    userPhone: input.userPhone,
    topic: input.topic,
    preferredTime: input.preferredTime,
    message: input.message,
    status: "pending",
    createdAt: now,
    updatedAt: now,
  };

  const result = await col.insertOne(doc);
  return { ...doc, _id: result.insertedId };
}

/**
 * Get all bookings for admin view (latest first).
 */
export async function getAllBookings(): Promise<SessionBooking[]> {
  const col = await getSessionBookingsCollection<SessionBooking>();
  return col.find({}).sort({ createdAt: -1 }).toArray();
}

/**
 * Get bookings for a single user (for /profile page).
 */
export async function getBookingsForUser(
  userEmail: string,
): Promise<SessionBooking[]> {
  const col = await getSessionBookingsCollection<SessionBooking>();
  return col.find({ userEmail }).sort({ createdAt: -1 }).toArray();
}

/**
 * Get a single booking by id (for admin edit).
 */
export async function getBookingById(
  id: string | ObjectId,
): Promise<SessionBooking | null> {
  const col = await getSessionBookingsCollection<SessionBooking>();
  const _id = typeof id === "string" ? new ObjectId(id) : id;
  return col.findOne({ _id });
}

/**
 * Update booking fields (status, coach, confirmed date, notes, etc.).
 */
export async function updateBooking(
  id: string | ObjectId,
  updates: Partial<
    Pick<
      SessionBooking,
      "status" | "coachId" | "coachName" | "confirmedDate" | "adminNotes"
    >
  >,
): Promise<SessionBooking | null> {
  const col = await getSessionBookingsCollection<SessionBooking>();
  const _id = typeof id === "string" ? new ObjectId(id) : id;

  const updatedDoc = await col.findOneAndUpdate(
    { _id },
    {
      $set: {
        ...updates,
        updatedAt: new Date(),
      },
    },
    {
      returnDocument: "after", // for modern mongodb driver
    },
  );

  if (!updatedDoc) {
    return null;
  }

  return updatedDoc;
}

/**
 * Delete / cancel booking entirely (admin hard delete).
 */
export async function deleteBooking(
  id: string | ObjectId,
): Promise<boolean> {
  const col = await getSessionBookingsCollection<SessionBooking>();
  const _id = typeof id === "string" ? new ObjectId(id) : id;
  const result = await col.deleteOne({ _id });
  return result.deletedCount === 1;
}
