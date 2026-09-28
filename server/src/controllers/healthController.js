import { getDatabaseStatus } from '../config/database.js';

export function getHealth(_request, response) {
  response.status(200).json({
    status: 'ok',
    message: 'CareerLens AI backend is running',
    database: getDatabaseStatus(),
  });
}