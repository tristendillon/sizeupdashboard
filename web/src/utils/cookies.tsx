// Cookie utility functions
export const getCookie = (name: string): string | null => {
  if (typeof document === "undefined") return null;

  const nameEQ = name + "=";
  const ca = document.cookie.split(";");

  for (const c of ca) {
    let cookie = c.trimStart();
    while (cookie.startsWith(" ")) cookie = cookie.substring(1, cookie.length);
    if (cookie.startsWith(nameEQ))
      return decodeURIComponent(cookie.substring(nameEQ.length, cookie.length));
  }
  return null;
};

export const setCookie = (name: string, value: string, days = 14) => {
  if (typeof document === "undefined") return;

  const expires = new Date();
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
  document.cookie = `${name}=${encodeURIComponent(value)};expires=${expires.toUTCString()};path=/;secure;samesite=lax`;
};

export const deleteCookie = (name: string) => {
  if (typeof document === "undefined") return;
  document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
};
