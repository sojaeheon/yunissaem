/*
  tokenStorage 전체 설명 (요약)

  - JWT Access Token / Refresh Token을 안전하게 저장·로드·삭제하는 유틸리티 파일입니다.
  - 모바일(iOS/Android)에서는 expo-secure-store를 사용해 암호화된 스토리지에 저장하고,
    웹 환경에서는 localStorage를 사용하도록 분기 처리합니다.

  - saveTokens(access, refresh): 두 토큰을 저장
  - getAccessToken(): 저장된 access 토큰 가져오기
  - getRefreshToken(): 저장된 refresh 토큰 가져오기
  - removeTokens(): 두 토큰 삭제(로그아웃 시 사용)

  - axiosInstance.js와 함께 자동 인증/재발급 구조에 필수적으로 사용됩니다.
*/

import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

const isWeb = Platform.OS === "web";

/**
 * saveTokens(access, refresh)
 * - JWT Access / Refresh 토큰을 저장
 * - 웹(localStorage)와 모바일(SecureStore)을 자동으로 분기
 */
export async function saveTokens(access, refresh) {
  if (isWeb && typeof window !== "undefined" && window.localStorage) {
    // 웹 환경
    window.localStorage.setItem("access", access);
    window.localStorage.setItem("refresh", refresh);
  } else {
    // 모바일 환경 (암호 저장)
    await SecureStore.setItemAsync("access", access);
    await SecureStore.setItemAsync("refresh", refresh);
  }
}

/**
 * getAccessToken()
 * - 저장된 Access Token 불러오기
 */
export async function getAccessToken() {
  if (isWeb && typeof window !== "undefined" && window.localStorage) {
    return window.localStorage.getItem("access");
  } else {
    return await SecureStore.getItemAsync("access");
  }
}

/**
 * getRefreshToken()
 * - 저장된 Refresh Token 불러오기
 */
export async function getRefreshToken() {
  if (isWeb && typeof window !== "undefined" && window.localStorage) {
    return window.localStorage.getItem("refresh");
  } else {
    return await SecureStore.getItemAsync("refresh");
  }
}

/**
 * removeTokens()
 * - 로그아웃 시 두 토큰 삭제
 */
export async function removeTokens() {
  if (isWeb && typeof window !== "undefined" && window.localStorage) {
    window.localStorage.removeItem("access");
    window.localStorage.removeItem("refresh");
  } else {
    await SecureStore.deleteItemAsync("access");
    await SecureStore.deleteItemAsync("refresh");
  }
}
