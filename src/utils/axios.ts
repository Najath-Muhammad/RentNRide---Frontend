import axios from "axios";
import { useAuthStore } from "../stores/authStore";
import { Navigate } from "@tanstack/react-router";
import { APIAuthRoutes } from "../constants/route.constant";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  withCredentials: true,
});

let refreshing = false
let waitingList: any[] = []

function runWaitingList(error: any, ok: boolean = false) {
  waitingList.forEach((item: any) => {
    error ? item.reject(error) : item.resolve(ok);
  });
  waitingList = [];
}

function goToLogin() {
  const user = useAuthStore.getState().user;
  Navigate({ to: user?.role === "admin" ? "/auth/admin-login" : "/auth/login" });
  useAuthStore.getState().setUser(null);
  localStorage.clear();
}

api.interceptors.response.use(
  (res) => res,

  async (err) => {
    const req = err.config;
    const res = err.response;

    if (res?.data?.blocked || res?.data?.logout) {
      req._blockedHandled = true;
      useAuthStore.getState().setUser(null);
      localStorage.clear();
      api.post(APIAuthRoutes.LOGOUT, {}, { withCredentials: true }).catch(() => {});
      goToLogin();
      return Promise.reject(err);
    }

    if (req._blockedHandled) {
      return Promise.reject(err);
    }

    const currentUser = useAuthStore.getState().user;
    if (!currentUser) {
      goToLogin();
      return Promise.reject(err);
    }

    if (req._retry) {
      goToLogin();
      return Promise.reject(err);
    }

    if (res?.status !== 401) {
      return Promise.reject(err);
    }

    req._retry = true;

    if (req.url.includes("/auth/refresh") || req.url.includes(APIAuthRoutes.LOGOUT)) {
      goToLogin();
      return Promise.reject(err);
    }

    if (refreshing) {
      return new Promise((resolve, reject) => {
        waitingList.push({ resolve, reject });
      })
        .then(() => api(req))
        .catch((e) => Promise.reject(e));
    }

    refreshing = true;

    try {
      await api.post("/auth/refresh", {}, { withCredentials: true });

      const me = await api.get("/auth/me");
      useAuthStore.getState().setUser(me.data.user);

      runWaitingList(null, true);
      refreshing = false;

      return api(req);
    } catch (refreshErr) {
      runWaitingList(refreshErr);
      refreshing = false;
      goToLogin();
      return Promise.reject(refreshErr);
    }
  }
);