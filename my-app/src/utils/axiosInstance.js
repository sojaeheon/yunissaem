/*
  axiosInstance 전체 설명 (요약)

  - baseURL(BASE_URL)을 기반으로 axios 인스턴스를 생성하여 앱 전역에서 공통으로 사용합니다.
  - 모든 API 요청에 대해:
      ① 요청 인터셉터에서 Access Token을 자동으로 Authorization 헤더에 추가하고,
      ② 응답 인터셉터에서 401(Unathorized)이 발생하면 Refresh Token을 이용해 Access Token을 자동 재발급합니다.

  - Access/Refresh 토큰은 expo-secure-store(tokenStorage.js)에서 안전하게 로드/저장/삭제되며,
    Refresh Token이 만료된 경우 removeTokens()를 실행하여 완전 로그아웃 처리합니다.

  - refresh API는 BASE_URL/token/refresh/로 요청되며,
    백엔드는 { access: "...", refresh: "..."} 형태의 JWT Pair 구조를 반환한다고 가정합니다.

  - 이 파일 덕분에 개별 화면에서는 Authorization 헤더를 직접 신경 쓰지 않아도 되며,
    토큰 만료에 따른 자동 재발급까지 백그라운드에서 처리됩니다.
*/

import axios from "axios";
import { BASE_URL } from "../config/config";
import {
  getAccessToken,
  getRefreshToken,
  saveTokens,
  removeTokens,
} from "./tokenStorage";

// axios 인스턴스 생성 (baseURL + timeout 설정)
const api = axios.create({
  baseURL: BASE_URL,
  timeout: 8000,
});

// ─────────────────────────────
// 요청 인터셉터: Access Token 자동 첨부
// ─────────────────────────────
api.interceptors.request.use(async (config) => {
  // 저장된 Access Token 불러오기
  const access = await getAccessToken();

  // 토큰이 있으면 Authorization 헤더 추가
  if (access) {
    config.headers.Authorization = `Bearer ${access}`;
  }

  return config;
});

// ─────────────────────────────
// 응답 인터셉터: 401 → Refresh Token으로 자동 재발급
// ─────────────────────────────
api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const original = err.config;

    // 401 + 최초 1회 재시도 조건
    if (err.response?.status === 401 && !original._retry) {
      original._retry = true;

      // 저장된 Refresh Token 가져오기
      const refresh = await getRefreshToken();
      if (!refresh) {
        // Refresh Token이 없으면 강제 로그아웃
        await removeTokens();
        return Promise.reject(err);
      }

      try {
        // Refresh Token으로 Access 재발급
        const res = await axios.post(`${BASE_URL}/token/refresh/`, {
          refresh,
        });

        const newAccess = res.data.access;

        // 새 토큰 저장 (refresh는 기존 값 유지)
        await saveTokens(newAccess, refresh);

        // 실패했던 원래 요청에 새 토큰 적용
        original.headers.Authorization = `Bearer ${newAccess}`;
        return api(original);
      } catch (e) {
        // Refresh도 만료된 경우 → 완전 로그아웃
        await removeTokens();
        return Promise.reject(e);
      }
    }

    // 401 이외의 에러는 그대로 반환
    return Promise.reject(err);
  }
);

export default api;
