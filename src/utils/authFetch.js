const API_BASE = process.env.REACT_APP_API_BASE_URL;

export const authFetch = async (url, options = {}) => {
  const token = localStorage.getItem("token");

  if (!token) {
    throw new Error("NO_TOKEN");
  }

  // ✅ If relative path is passed, prefix with API_BASE
  const finalUrl = url.startsWith("http")
    ? url
    : `${API_BASE}${url}`;

  const res = await fetch(finalUrl, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(options.headers || {}),
    },
  });

  if (res.status === 401) {
    localStorage.removeItem("token");
    throw new Error("UNAUTHORIZED");
  }

  return res;
};
