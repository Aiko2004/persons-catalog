import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AppError, FieldError } from '../models/api.model';

export const errorInterceptor: HttpInterceptorFn = (req, next) =>
  next(req).pipe(
    catchError((raw) => {
      const err = raw as HttpErrorResponse;
      const body = err.error as { message?: string; fields?: FieldError[] } | null;

      const fields: Record<string, string> = {};
      if (Array.isArray(body?.fields)) {
        for (const f of body!.fields!) {
          fields[f.field] = f.message;
        }
      }

      const appError: AppError = {
        status: err.status,
        message: body?.message ?? err.message ?? 'Белгісіз қате',
        fields,
      };

      return throwError(() => appError);
    }),
  );
