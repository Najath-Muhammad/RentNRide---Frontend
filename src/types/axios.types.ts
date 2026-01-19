import type { AxiosRequestConfig, InternalAxiosRequestConfig } from 'axios';

export interface WaitingRequest {
  resolve: (value?: unknown) => void;
  reject: (reason?: unknown) => void;
}

declare module 'axios' {
  export interface AxiosRequestConfig {
    _skipAuthRefresh?: boolean;
    _retry?: boolean;
    _blockedHandled?: boolean;
  }
  export interface InternalAxiosRequestConfig {
    _skipAuthRefresh?: boolean;
    _retry?: boolean;
    _blockedHandled?: boolean;
  }
}

export interface CustomAxiosRequestConfig extends AxiosRequestConfig {
  _skipAuthRefresh?: boolean;
  _retry?: boolean;
  _blockedHandled?: boolean;
}

export interface CustomInternalAxiosRequestConfig extends InternalAxiosRequestConfig {
  _skipAuthRefresh?: boolean;
  _retry?: boolean;
  _blockedHandled?: boolean;
}
