export const AUTH_STORAGE_KEY = "admin-panel-authenticated";
export const AUTH_COOKIE_NAME = "admin-panel-authenticated";
export const VALID_USERNAME = "@adminKaiyo";
export const VALID_PASSWORD = "12345678";

export function validateCredentials(username: string, password: string) {
  return username.trim() === VALID_USERNAME && password === VALID_PASSWORD;
}

export function setAuthenticated() {
  if (typeof window === "undefined") return;

  window.localStorage.setItem(AUTH_STORAGE_KEY, "true");
  // Write both a boolean-like and numeric form for compatibility with middleware checks
  document.cookie = `${AUTH_COOKIE_NAME}=true; Path=/; Max-Age=${60 * 60 * 24 * 7}; SameSite=Lax${window.location.protocol === "https:" ? "; Secure" : ""}`;
  document.cookie = `${AUTH_COOKIE_NAME}=1; Path=/; Max-Age=${60 * 60 * 24 * 7}; SameSite=Lax${window.location.protocol === "https:" ? "; Secure" : ""}`;
}

export function clearAuthenticated() {
  if (typeof window === "undefined") return;

  window.localStorage.removeItem(AUTH_STORAGE_KEY);
  document.cookie = `${AUTH_COOKIE_NAME}=; Path=/; Max-Age=0; SameSite=Lax${window.location.protocol === "https:" ? "; Secure" : ""}`;
  document.cookie = `${AUTH_COOKIE_NAME}=0; Path=/; Max-Age=0; SameSite=Lax${window.location.protocol === "https:" ? "; Secure" : ""}`;
}


export function isLocalAuthenticated() {
  return typeof window !== "undefined" && window.localStorage.getItem(AUTH_STORAGE_KEY) === "true";
}
