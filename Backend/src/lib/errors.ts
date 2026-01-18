import { NextResponse } from "next/server";

export type ApiError = {
  code: string;
  message: string;
  status: number;
  retryable?: boolean;
};

export const apiError = (
  code: string,
  message: string,
  status = 400,
  retryable = false
): ApiError => ({
  code,
  message,
  status,
  retryable
});

export const jsonError = (error: ApiError) =>
  NextResponse.json(
    { code: error.code, message: error.message },
    { status: error.status }
  );

