import { InjectionToken } from '@angular/core';

/**
 * API_URL — injection token for the API base URL.
 * Defaults to environment.apiUrl but can be overridden for testing.
 */
export const API_URL = new InjectionToken<string>('API_URL', {
  providedIn: 'root',
  factory: () => '/api',
});

/**
 * APP_VERSION — injection token for the current app version.
 */
export const APP_VERSION = new InjectionToken<string>('APP_VERSION', {
  providedIn: 'root',
  factory: () => '1.0.0',
});

/**
 * STORAGE_PREFIX — injection token for localStorage key prefix.
 */
export const STORAGE_PREFIX = new InjectionToken<string>('STORAGE_PREFIX', {
  providedIn: 'root',
  factory: () => 'il_',
});

/**
 * DEFAULT_PAGE_SIZE — injection token for default pagination size.
 */
export const DEFAULT_PAGE_SIZE = new InjectionToken<number>('DEFAULT_PAGE_SIZE', {
  providedIn: 'root',
  factory: () => 20,
});

/**
 * MAX_FILE_SIZE_MB — injection token for maximum upload file size in MB.
 */
export const MAX_FILE_SIZE_MB = new InjectionToken<number>('MAX_FILE_SIZE_MB', {
  providedIn: 'root',
  factory: () => 10,
});
