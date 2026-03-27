import axios from "axios";
import { env } from "../config/env.js";
function normalizeLanguage(language) {
    const lang = language.trim().toLowerCase();
    if (lang === "c++" || lang === "cpp" || lang === "g++")
        return "c++";
    if (lang === "gcc")
        return "c";
    if (lang === "js")
        return "javascript";
    return lang;
}
function normalizeJavaSource(source) {
    const hasMainClass = /\b(?:public\s+)?class\s+Main\b/.test(source);
    if (hasMainClass)
        return source;
    if (/\bpublic\s+class\s+[A-Za-z_][A-Za-z0-9_]*\b/.test(source)) {
        return source.replace(/\bpublic\s+class\s+[A-Za-z_][A-Za-z0-9_]*\b/, "public class Main");
    }
    return source;
}
function getExecutionUrls() {
    const configuredUrl = env.PISTON_URL.trim();
    const normalizedConfiguredUrl = configuredUrl.replace(/\/+$/, "");
    const upgradedConfiguredUrl = normalizedConfiguredUrl.replace(/\/api\/v2\/execute$/, "/api/v2/piston/execute");
    const candidates = [
        upgradedConfiguredUrl,
        normalizedConfiguredUrl,
        "https://emkc.org/api/v2/piston/execute",
        "https://emkc.org/api/v1/piston/execute",
    ];
    return [...new Set(candidates)];
}
function shouldRetryExecutionUrl(error) {
    if (!axios.isAxiosError(error)) {
        return false;
    }
    const status = error.response?.status;
    return status === 401 || status === 403 || status === 404 || status === 405 || !status;
}
export async function executeCode({ language, source, stdin = "" }) {
    const normalizedLanguage = normalizeLanguage(language);
    const normalizedSource = normalizedLanguage === "java" ? normalizeJavaSource(source) : source;
    const payload = {
        language: normalizedLanguage,
        version: "*",
        files: [
            normalizedLanguage === "java"
                ? { name: "Main.java", content: normalizedSource }
                : { content: normalizedSource },
        ],
        stdin,
    };
    let lastError;
    for (const url of getExecutionUrls()) {
        try {
            const response = await axios.post(url, payload, {
                timeout: 10_000,
                headers: {
                    Accept: "application/json",
                    "Content-Type": "application/json",
                    "User-Agent": "way-of-ghost-runner/1.0",
                },
            });
            return response.data;
        }
        catch (error) {
            lastError = error;
            if (!shouldRetryExecutionUrl(error)) {
                throw error;
            }
        }
    }
    throw lastError;
}
