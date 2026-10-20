import { seedDatabase } from "../db/seed.js";

const isForce = process.argv.includes("--force");
seedDatabase(isForce)
    .then(() => {
        console.log("Seeding complete. Exiting.");
        process.exit(0);
    })
    .catch((err) => {
        console.error("Seeding failed:", err);
        process.exit(1);
    });
