import { StatusCodes } from 'http-status-codes';
import 'express';

declare global {
  var appRoot: string;

  type GTypeAll = boolean | number | string | null | string[] | Record<string, unknown> | Record<string, unknown>[];
  type Gextra = GTypeAll;

  interface GPagination {
    page: number;
    limit: number;
    total: number;
    getTotal: boolean;
    withGroup: boolean;
    withOutData: boolean;
    isAll?: boolean;
  }

  interface GQueryParams {
    [key: string]: string | number | boolean | undefined;
  }

  interface GError extends Error {
    code?: number;
    statusCode?: number;
    data?: GTypeAll;
    extra?: Gextra;
  }

  interface GResponse<T, E = GTypeAll> {
    data: T;
    message: string;
    success: boolean;
    code: StatusCodes;
    qdata?: Partial<GPagination & GQueryParams>;
    extra?: E;
  }
}

declare module 'express-serve-static-core' {
  interface Request {
    user?: {
      id: number;
      email: string;
      name: string;
    };
  }
}

export {};
