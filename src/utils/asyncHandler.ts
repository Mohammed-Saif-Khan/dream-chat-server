import { Request, Response, NextFunction } from "express";

interface RequestHandler {
  (req: Request, res: Response, next: NextFunction): unknown;
}

const asyncHandler = (requestHandler: RequestHandler) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(requestHandler(req, res, next)).catch((error: unknown) =>
      next(error)
    );
  };
};

export { asyncHandler };
