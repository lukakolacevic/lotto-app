import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import express from "express";
import cors from "cors";
import { auth } from "express-oauth2-jwt-bearer";
import QRCode from "qrcode";

// --- INIT ---
try {
  admin.app();
} catch {
  admin.initializeApp();
}
const db = admin.firestore();

const app = express();
app.use(cors({origin: true, credentials: true}));
app.use(express.json());

const AUTH0_DOMAIN = "comperio-app.eu.auth0.com";
const AUTH0_AUDIENCE = "https://lotto-api";
const PUBLIC_URL = "http://localhost:5173";

const checkM2MAuth = auth({
  audience: AUTH0_AUDIENCE,
  issuerBaseURL: `https://${AUTH0_DOMAIN}/`,
  tokenSigningAlg: "RS256",
});

const checkUserAuth = auth({
  audience: AUTH0_AUDIENCE,
  issuerBaseURL: `https://${AUTH0_DOMAIN}/`,
  tokenSigningAlg: "RS256",
});

const unique = (arr: number[]) => Array.from(new Set(arr));
const inRange = (arr: number[], lo: number, hi: number) =>
  arr.every((n) => Number.isInteger(n) && n >= lo && n <= hi);

app.get("/health", (_req, res) => {
  res.json({status: "ok", time: new Date().toISOString()});
});

app.get("/status", async (_req, res) => {
  try {
    const activeSnap = await db.collection("rounds")
      .where("active", "==", true)
      .limit(1)
      .get();

    if (activeSnap.empty) {
      return res.json({
        hasRound: false,
        active: false,
        ticketCount: 0,
        results: null,
      });
    }

    const roundDoc = activeSnap.docs[0];
    const roundId = roundDoc.id;

    const ticketsSnap = await db.collection("tickets")
      .where("roundId", "==", roundId)
      .count()
      .get();

    return res.json({
      hasRound: true,
      active: true,
      roundId,
      ticketCount: ticketsSnap.data().count,
      results: null,
    });
  } catch (error) {
    try {
      const closedSnap = await db.collection("rounds")
        .where("active", "==", false)
        .orderBy("closedAt", "desc")
        .limit(1)
        .get();

      if (closedSnap.empty) {
        return res.json({
          hasRound: false,
          active: false,
          ticketCount: 0,
          results: null,
        });
      }

      const roundDoc = closedSnap.docs[0];
      const roundId = roundDoc.id;

      const resultsDoc = await db.collection("roundResults").doc(roundId).get();

      const ticketsSnap = await db.collection("tickets")
        .where("roundId", "==", roundId)
        .count()
        .get();

      return res.json({
        hasRound: true,
        active: false,
        roundId,
        ticketCount: ticketsSnap.data().count,
        results: resultsDoc.exists ? resultsDoc.data()?.numbers : null,
      });
    } catch (err) {
      return res.json({
        hasRound: false,
        active: false,
        ticketCount: 0,
        results: null,
      });
    }
  }
});

app.get("/tickets/:ticketId", async (req, res) => {
  try {
    const ticketDoc = await db.collection("tickets").doc(req.params.ticketId).get();

    if (!ticketDoc.exists) {
      return res.status(404).json({error: "ticket_not_found"});
    }

    const ticketData = ticketDoc.data();
    const roundId = ticketData?.roundId;

    const resultsDoc = await db.collection("roundResults").doc(roundId).get();

    return res.json({
      ticketId: ticketDoc.id,
      idNumber: ticketData?.idNumber,
      numbers: ticketData?.numbers,
      roundId,
      results: resultsDoc.exists ? resultsDoc.data()?.numbers : null,
    });
  } catch (error) {
    return res.status(500).json({error: "internal_error"});
  }
});

app.post("/new-round", checkM2MAuth, async (_req, res) => {
  try {
    const active = await db.collection("rounds")
      .where("active", "==", true)
      .limit(1)
      .get();

    if (!active.empty) {
      return res.status(204).send();
    }

    await db.collection("rounds").add({
      active: true,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      closedAt: null,
    });

    return res.status(204).send();
  } catch (error) {
    return res.status(204).send(); // Per spec: always 204
  }
});

app.post("/close", checkM2MAuth, async (_req, res) => {
  try {
    const snap = await db.collection("rounds")
      .where("active", "==", true)
      .limit(1)
      .get();

    if (snap.empty) {
      return res.status(204).send();
    }

    const doc = snap.docs[0];
    await doc.ref.update({
      active: false,
      closedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return res.status(204).send();
  } catch (error) {
    return res.status(204).send(); // Per spec: always 204
  }
});

app.post("/store-results", checkM2MAuth, async (req, res) => {
  try {
    const numbers: number[] = Array.isArray(req.body?.numbers) ? req.body.numbers : [];

    const closed = await db.collection("rounds")
      .where("active", "==", false)
      .orderBy("closedAt", "desc")
      .limit(1)
      .get();

    if (closed.empty) {
      return res.status(400).json({error: "no_closed_round"});
    }

    const roundDoc = closed.docs[0];
    const roundId = roundDoc.id;

    const existing = await db.collection("roundResults").doc(roundId).get();
    if (existing.exists) {
      return res.status(400).json({error: "results_already_stored"});
    }

    await db.collection("roundResults").doc(roundId).set({
      numbers,
      storedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return res.status(204).send();
  } catch (error) {
    return res.status(400).json({error: "bad_request"});
  }
});

app.post("/tickets", checkUserAuth, async (req, res) => {
  try {
    const idNumber = String(req.body?.idNumber ?? "").trim();
    const numbersInput = String(req.body?.numbers ?? "");

    const numbers = numbersInput
      .split(",")
      .map((n) => parseInt(n.trim(), 10))
      .filter((n) => !isNaN(n));

    if (idNumber.length < 1 || idNumber.length > 20) {
      return res.status(400).json({error: "id_number_length_1_20"});
    }

    if (numbers.length < 6 || numbers.length > 10) {
      return res.status(400).json({error: "numbers_count_6_10"});
    }

    if (unique(numbers).length !== numbers.length) {
      return res.status(400).json({error: "duplicates_not_allowed"});
    }

    if (!inRange(numbers, 1, 45)) {
      return res.status(400).json({error: "out_of_range_1_45"});
    }

    const active = await db.collection("rounds")
      .where("active", "==", true)
      .limit(1)
      .get();

    if (active.empty) {
      return res.status(400).json({error: "no_active_round"});
    }

    const roundDoc = active.docs[0];
    const roundId = roundDoc.id;

    const ticketRef = await db.collection("tickets").add({
      roundId,
      idNumber,
      numbers,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      userId: req.auth?.payload?.sub || "anonymous",
    });

    const ticketUrl = `${PUBLIC_URL}/ticket/${ticketRef.id}`;
    const qrCodeDataUrl = await QRCode.toDataURL(ticketUrl, {
      width: 300,
      margin: 2,
    });

    const base64Data = qrCodeDataUrl.replace(/^data:image\/png;base64,/, "");
    const qrBuffer = Buffer.from(base64Data, "base64");

    res.set("Content-Type", "image/png");
    return res.send(qrBuffer);
  } catch (error) {
    console.error("Error creating ticket:", error);
    return res.status(500).json({error: "internal_error"});
  }
});

export const api = functions.https.onRequest(app);
