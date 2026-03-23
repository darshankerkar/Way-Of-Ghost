import axios from "axios";
import { env } from "../config/env.js";
function normalizeLanguage(language) {
    const lang = language.trim().toLowerCase();
    if (lang === "c++" || lang === "cpp" || lang === "g++")
        return "c++";
    if (lang === "gcc")
        return "c";
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
    const response = await axios.post(env.PISTON_URL, payload, {
        timeout: 10_000,
    });
    return response.data;
}
