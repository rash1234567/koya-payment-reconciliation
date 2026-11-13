// Payment reconciliation.
//
// Reads payments.jsonl and works out how much money we actually collected.
// Run:  node reconcile.js

const fs = require("fs");

let total = 0;
let count = 0;

const lines = fs
  .readFileSync("payments.jsonl", "utf8")
  .split("\n")
  .filter((l) => l.length > 0);

const latestPayments = new Map();

let malformedCount = 0;
let missingTxnIdCount = 0;

for (const line of lines) {
  let event;
  try {
    event = JSON.parse(line);
  } catch {
    malformedCount += 1;
    continue;
  }
  if (!event.txn_id) {
    missingTxnIdCount += 1;
    continue;
  }

  const previousEvent = latestPayments.get(event.txn_id);

  if (!previousEvent || Date.parse(event.ts) >= Date.parse(previousEvent.ts)) {
    latestPayments.set(event.txn_id, event);
  }
}

for (const event of latestPayments.values()) {
  if (event.status === "success") {
    const amount = Number(String(event.amount).replaceAll(",", ""));
    total += amount;
    count++;
  }
}

const expected = parseInt(fs.readFileSync("expected.txt", "utf8").trim(), 10);

if (count !== expected) {
  console.log(
    `Check failed: counted ${count} successful payments, expected ${expected}.`
  );
  console.log(
    "Something in the data isn't being handled the way the README describes."
  );
} else {
  console.log(`Check passed: ${count} successful payments.`);
  console.log(`Your code: KOYA-${Math.round(total)}`);
}
