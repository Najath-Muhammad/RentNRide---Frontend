import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const RETENTION_HOURS = 24; 
const LOG_FILES_PATTERN = /^lint_.*\.((txt)|(json))$/;
const SPECIFIC_FILES = ['output.txt', 'error.log'];

const PROJECT_ROOT = path.join(__dirname, '..');

console.log(`[Log Cleanup] Checking for log files older than ${RETENTION_HOURS} hours in ${PROJECT_ROOT}...`);

let deletedCount = 0;

try {
    const files = fs.readdirSync(PROJECT_ROOT);

    files.forEach(file => {
        const isDiverseLog = LOG_FILES_PATTERN.test(file);
        const isSpecificFile = SPECIFIC_FILES.includes(file);

        if (isDiverseLog || isSpecificFile) {
            const filePath = path.join(PROJECT_ROOT, file);

            try {
                const stats = fs.statSync(filePath);
                const now = new Date().getTime();
                const fileTime = new Date(stats.mtime).getTime();
                const ageHours = (now - fileTime) / (1000 * 3600);

                if (ageHours > RETENTION_HOURS) {
                    fs.unlinkSync(filePath);
                    console.log(`  - Deleted: ${file} (${ageHours.toFixed(1)} hours old)`);
                    deletedCount++;
                } else {
                    // console.log(`  - Kept: ${file} (${ageHours.toFixed(1)} hours old)`);
                }
            } catch (err) {
                console.error(`  ! Error checking/deleting ${file}:`, err.message);
            }
        }
    });

    if (deletedCount === 0) {
        console.log('[Log Cleanup] No old log files found to delete.');
    } else {
        console.log(`[Log Cleanup] Completed. Deleted ${deletedCount} files.`);
    }

} catch (err) {
    console.error('[Log Cleanup] Fatal error:', err);
}
