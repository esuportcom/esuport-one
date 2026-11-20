import { encryptToken, decryptToken } from "@/lib/channels";

const API = "https://api.ayrshare.com/api";

function config() {
  const apiKey = process.env.AYRSHARE_API_KEY;
  const domain = process.env.AYRSHARE_DOMAIN;
  const privateKey = process.env.AYRSHARE_PRIVATE_KEY;
  if (!apiKey || !domain || !privateKey) {
    throw new Error("Ayrshare is not configured. Add AYRSHARE_API_KEY, AYRSHARE_DOMAIN and AYRSHARE_PRIVATE_KEY.");
  }
  return { apiKey, domain, privateKey };
}

async function request(path: string, init: RequestInit = {}, profileKey?: string) {
  const { apiKey } = config();
  const headers = new Headers(init.headers);
  headers.set("Authorization", `Bearer ${apiKey}`);
  headers.set("Content-Type", "application/json");
  if (profileKey) headers.set("Profile-Key", profileKey);
  const response = await fetch(`${API}${path}`, { ...init, headers, cache: "no-store" });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || data.error || `Ayrshare request failed (${response.status})`);
  return data;
}

export async function createProfile(title: string) {
  const data = await request("/profiles", { method: "POST", body: JSON.stringify({ title, hideTopHeader: false }) });
  return { profileKey: String(data.profileKey), refId: String(data.refId), title: String(data.title ?? title) };
}

export async function generateConnectUrl(profileKey: string, redirect: string) {
  const { domain, privateKey } = config();
  const data = await request("/profiles/generateJWT", {
    method: "POST",
    body: JSON.stringify({
      domain,
      privateKey,
      profileKey,
      redirect,
      allowedSocial: ["facebook","instagram","linkedin","x","tiktok","youtube","pinterest","threads","reddit","bluesky","snapchat","telegram","gmb"]
    })
  });
  return String(data.url);
}

export async function getProfile(profileKey: string) {
  return request("/user", { method: "GET" }, profileKey);
}

export async function publishPost(
  profileKey: string,
  payload: { post: string; platforms: string[]; mediaUrls?: string[]; scheduleDate?: string }
) {
  return request("/post", { method: "POST", body: JSON.stringify(payload) }, profileKey);
}

export function protectProfileKey(value: string) {
  return encryptToken(value);
}

export function revealProfileKey(value: string) {
  return decryptToken(value);
}
