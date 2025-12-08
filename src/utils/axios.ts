import axios from "axios";
import { useAuthStore } from "../stores/authStore";
import { Navigate } from "@tanstack/react-router";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  withCredentials: true,
});

let refreshing = false;
let waitingList: any[] = [];

function runWaitingList(error: any, ok: boolean = false) {
  waitingList.forEach((item) => {
    if (error) {
      item.reject(error);
    } else {
      item.resolve(ok);
    }
  });
  waitingList = [];
}

function goToLogin() {
  const user = useAuthStore.getState().user;

  if (user && user.role === "admin") {
    Navigate({ to: "/auth/admin-login" });
  } else {
    Navigate({ to: "/auth/login" });
  }

  useAuthStore.getState().setUser(null);
  localStorage.clear();
}

api.interceptors.response.use(
  (res) => {
    return res;
  },

  async (err) => {
    const req = err.config;

    const currentUser = useAuthStore.getState().user;
    if (!currentUser) {
      goToLogin();
      return Promise.reject(err);
    }

    if (req._retry) {
      goToLogin();
      return Promise.reject(err);
    }
    if (err?.response?.status !== 401) {
      return Promise.reject(err);
    }

    req._retry = true;

    if (req.url.includes("/auth/refresh")) {
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
