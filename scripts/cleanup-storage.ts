import { purgePendingFiles } from "../src/server/documents/pending";
import { db } from "../src/lib/db";
purgePendingFiles().then(r => console.log(`Pendências: ${r.processed}, removidas: ${r.deleted}`)).finally(() => db.$disconnect());
