import 'dotenv/config';
import ExcelJS from 'exceljs';
import mongoose from 'mongoose';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import JobPosting from '../src/models/JobPosting.js';
import { getMongoUri } from '../src/config/database.js';
import { createJobPosting } from '../src/services/jobDatasetService.js';

const BATCH_SIZE = 500;
const EXPECTED_COLUMNS = [
  'title', 'jobId', 'currency', 'jobUploaded', 'companyName', 'tagsAndSkills',
  'experience', 'salary', 'location', 'companyId', 'ReviewsCount', 'AggregateRating',
  'jobDescription', 'minimumSalary', 'maximumSalary', 'minimumExperience', 'maximumExperience',
];

async function importWorkbook(filePath, { dryRun = false } = {}) {
  if (!dryRun) await JobPosting.createIndexes();
  const reader = new ExcelJS.stream.xlsx.WorkbookReader(filePath, {
    worksheets: 'emit',
    sharedStrings: 'cache',
    hyperlinks: 'ignore',
    styles: 'ignore',
  });
  const seenJobIds = new Set();
  let headers = null;
  let rowCount = 0;
  let skippedRows = 0;
  let duplicateRows = 0;
  let importedRows = 0;
  let operations = [];

  async function writeBatch() {
    if (operations.length === 0) return;
    if (!dryRun) await JobPosting.bulkWrite(operations, { ordered: false });
    importedRows += operations.length;
    operations = [];
  }

  for await (const worksheet of reader) {
    for await (const row of worksheet) {
      rowCount += 1;
      if (!headers) {
        headers = row.values.slice(1).map((value) => String(value ?? '').trim());
        const missingColumns = EXPECTED_COLUMNS.filter((column) => !headers.includes(column));
        if (missingColumns.length > 0) {
          throw new Error(`Workbook is missing expected columns: ${missingColumns.join(', ')}`);
        }
        continue;
      }

      const sourceRow = Object.fromEntries(headers.map((header, index) => [
        header,
        row.getCell(index + 1).value,
      ]));
      const job = createJobPosting(sourceRow);
      if (!job) {
        skippedRows += 1;
        continue;
      }
      if (seenJobIds.has(job.sourceJobId)) {
        duplicateRows += 1;
        continue;
      }
      seenJobIds.add(job.sourceJobId);
      operations.push({
        updateOne: {
          filter: { sourceDataset: job.sourceDataset, sourceJobId: job.sourceJobId },
          update: { $set: job },
          upsert: true,
        },
      });
      if (operations.length >= BATCH_SIZE) await writeBatch();
    }
  }
  await writeBatch();

  return { rowCount: Math.max(0, rowCount - 1), importedRows, skippedRows, duplicateRows };
}

async function main() {
  const arguments_ = process.argv.slice(2);
  const dryRun = arguments_[0] === '--dry-run';
  const filePath = arguments_[dryRun ? 1 : 0];
  if (!filePath) {
    console.error('Usage: npm run import:jobs -- [--dry-run] <path-to-indian-job-market-xlsx>');
    process.exitCode = 1;
    return;
  }

  let stage = 'MongoDB connection';
  try {
    if (!dryRun) {
      await mongoose.connect(getMongoUri(), { serverSelectionTimeoutMS: 5000 });
    }
    stage = 'workbook processing';
    const result = await importWorkbook(resolve(filePath), { dryRun });
    console.info(
      `Job dataset ${dryRun ? 'validation' : 'import'} complete: ${result.importedRows} `
      + `${dryRun ? 'valid rows found' : 'imported'}, `
      + `${result.skippedRows} invalid/empty rows skipped, `
      + `${result.duplicateRows} duplicate job IDs skipped `
      + `from ${result.rowCount} data rows.`,
    );
  } catch (error) {
    console.error(
      `Job dataset ${dryRun ? 'validation' : 'import'} failed during ${stage} `
      + `(${error?.name ?? 'Error'}). `
      + (dryRun || stage === 'workbook processing'
        ? `Check the workbook structure and path: ${error?.message ?? 'Unknown error'}`
        : 'Check the workbook path, MONGODB_URI, and MongoDB availability.'),
    );
    process.exitCode = 1;
  } finally {
    if (mongoose.connection.readyState !== 0) await mongoose.disconnect();
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  await main();
}
