import multer from 'multer';
import { MAX_RESUME_SIZE_BYTES } from '../services/resumeParserService.js';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_RESUME_SIZE_BYTES,
    files: 1,
  },
}).single('file');

export function uploadResume(request, response, next) {
  upload(request, response, (error) => {
    if (!error) {
      return next();
    }

    const mappedError = new Error(error.code === 'LIMIT_FILE_SIZE'
      ? 'Uploaded file exceeds the 10 MB size limit.'
      : 'The uploaded request could not be processed.');
    mappedError.status = error.code === 'LIMIT_FILE_SIZE' ? 413 : 400;
    return next(mappedError);
  });
}