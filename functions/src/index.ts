import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import express from "express";
import cors from "cors";

// --- INIT ---
try { admin.app(); } catch { admin.initializeApp(); }
const db = admin.firestore();

const app = express();
app.use(cors());
app.use(express.json());

// --- HELPERS ---
const unique = (arr: number[]) => Array.from(new Set(arr));
const inRange = (arr: number[], lo: number, hi: number) =>
  arr.every(n => Number.isInteger(n) && n >= lo && n <= hi);

// --- HEALTH ---
app.get("/health", (_req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

// --- ADMIN ROUTES ---
// new-round: activate new round (id = Firestore doc id auto)
app.post("/new-round", async (_req, res) => {
  const active = await db.collection("rounds").where("active", "==", true).limit(1).get();
  if (!active.empty) return res.status(204).send();
  await db.collection("rounds").add({
    active: true,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    closedAt: null,
  });
  return res.status(204).send();
});

// close: deactivate current round
app.post("/close", async (_req, res) => {
  const snap = await db.collection("rounds").where("active", "==", true).limit(1).get();
  if (snap.empty) return res.status(204).send();
  const doc = snap.docs[0];
  await doc.ref.update({ active: false, closedAt: admin.firestore.FieldValue.serverTimestamp() });
  return res.status(204).send();
});

// store-results: numbers[6], only when last closed round has no results yet
app.post("/store-results", async (req, res) => {
  const numbers: number[] = Array.isArray(req.body?.numbers) ? req.body.numbers : [];
  if (numbers.length !== 6) return res.status(400).json({ error: "exactly_6_numbers_required" });
  if (unique(numbers).length !== numbers.length) return res.status(400).json({ error: "duplicates_not_allowed" });
  if (!inRange(numbers, 1, 45)) return res.status(400).json({ error: "out_of_range_1_45" });

  const closed = await db.collection("rounds")
    .where("active", "==", false)
    .orderBy("closedAt", "desc")
    .limit(1).get();
  if (closed.empty) return res.status(400).json({ error: "no_closed_round" });

  const roundDoc = closed.docs[0];
  const existing = await db.collection("roundResults").doc(roundDoc.id).get();
  if (existing.exists) return res.status(400).json({ error: "results_already_stored" });

  await db.collection("roundResults").doc(roundDoc.id).set({
    numbers,
    storedAt: admin.firestore.FieldValue.serverTimestamp(),
  });
  return res.status(204).send();
});

// --- USER ROUTE ---
// tickets: { idNumber: string(1..20), numbers: int[6..10] between 1..45 }
// requires an active round
app.post("/tickets", async (req, res) => {
  const idNumber = String(req.body?.idNumber ?? "");
  const numbers: number[] = Array.isArray(req.body?.numbers) ? req.body.numbers : [];

  if (idNumber.length < 1 || idNumber.length > 20) return res.status(400).json({ error: "id_number_length_1_20" });
  if (numbers.length < 6 || numbers.length > 10) return res.status(400).json({ error: "numbers_count_6_10" });
  if (unique(numbers).length !== numbers.length) return res.status(400).json({ error: "duplicates_not_allowed" });
  if (!inRange(numbers, 1, 45)) return res.status(400).json({ error: "out_of_range_1_45" });

  const active = await db.collection("rounds").where("active", "==", true).limit(1).get();
  if (active.empty) return res.status(400).json({ error: "no_active_round" });

  const roundDoc = active.docs[0];
  const ticketRef = await db.collection("tickets").add({
    roundId: roundDoc.id,
    idNumber,
    numbers,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  // QR target URL (replace with your hosting domain later)
  const qrUrl = `/tickets/${ticketRef.id}`;
  return res.status(201).json({ ticketId: ticketRef.id, qrUrl });
});

export const api = functions.https.onRequest(app);
