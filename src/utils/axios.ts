import axios from "axios";
import type { WaitingRequest } from "../types/axios.types";
import { useAuthStore } from "../stores/authStore";
import { router } from "../route";

import { APIAuthRoutes } from "../constants/route.constant";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  withCredentials: true,
});

let refreshing = false
let waitingList: WaitingRequest[] = []

function runWaitingList(error: unknown, ok: boolean = false) {
  waitingList.forEach((item: WaitingRequest) => {
    if (error) {
      item.reject(error);
    } else {
      item.resolve(ok);
    }
  });
  waitingList = [];
}



function goToLogin() {
  console.log('goToLogin called - Logging out user via axios interceptor.');
  const user = useAuthStore.getState().user;
  router.navigate({ to: user?.role === "admin" ? "/auth/admin-login" : "/auth/login" });
  useAuthStore.getState().setUser(null);
  localStorage.clear();
}

api.interceptors.response.use(
  (res) => res,

  async (err) => {
    console.log('>>> Axios response interceptor triggered (any error)', err);
    console.log('>>> Status:', err.response?.status);
    console.log('>>> URL:', err.config?.url);
    const req = err.config;
    const res = err.response;

    if (res?.data?.blocked || res?.data?.logout) {
      req._blockedHandled = true;
      useAuthStore.getState().setUser(null);
      localStorage.clear();
      api.post(APIAuthRoutes.LOGOUT, {}, { withCredentials: true }).catch(() => { });
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

    if (req._skipAuthRefresh) {
      return Promise.reject(err);
    }

    console.log('Intercepted 401 for:', req.url);

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
      console.log('this /me respone in the interceptor', me)
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