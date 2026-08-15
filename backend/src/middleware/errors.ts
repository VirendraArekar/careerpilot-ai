import type { ErrorRequestHandler, RequestHandler } from 'express';
import multer from 'multer';

export const notFound: RequestHandler = (req, res) =>
  res.status(404).json({ message: `Route not found: ${req.method} ${req.path}` });

export const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  console.error(error);
  if (error instanceof multer.MulterError) return res.status(400).json({ message: error.message });
  const status = typeof error.status === 'number' ? error.status : 500;
  res.status(status).json({ message: error.message || 'Unexpected server error' });
};
