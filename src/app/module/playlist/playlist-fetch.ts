import axios from "axios";
import { StatusCodes } from "http-status-codes";
import AppError from "../../errorHelpers/AppError";

export const DEFAULT_PLAYLIST_M3U_URL =
    "https://raw.githubusercontent.com/bugsfreeweb/LiveTVCollector/refs/heads/main/LiveTV/Bangladesh/LiveTV.m3u";

export const DEFAULT_PLAYLIST_TITLE = "LiveTV Bangladesh";

export const fetchM3UContent = async (url: string): Promise<string> => {
    let response;
    try {
        response = await axios.get<string>(url, {
            timeout: 60000,
            responseType: "text",
            headers: { Accept: "application/vnd.apple.mpegurl, text/plain, */*" },
            maxContentLength: 15 * 1024 * 1024,
        });
    } catch {
        throw new AppError(StatusCodes.BAD_REQUEST, "Failed to fetch M3U from URL");
    }

    const rawContent = response.data;
    if (!rawContent || typeof rawContent !== "string") {
        throw new AppError(StatusCodes.BAD_REQUEST, "Empty or invalid response from URL");
    }

    return rawContent;
};
