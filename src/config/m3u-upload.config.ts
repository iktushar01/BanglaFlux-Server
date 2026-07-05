import multer from "multer";

const m3uFileFilter = (_req: Express.Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    const allowed = [
        "application/vnd.apple.mpegurl",
        "application/x-mpegurl",
        "audio/mpegurl",
        "text/plain",
        "application/octet-stream",
    ];
    const ext = file.originalname.split(".").pop()?.toLowerCase();
    const allowedExt = ["m3u", "m3u8", "txt"];

    if (allowed.includes(file.mimetype) || (ext && allowedExt.includes(ext))) {
        cb(null, true);
    } else {
        cb(new Error("Only M3U playlist files are allowed"));
    }
};

export const m3uUpload = multer({
    storage: multer.memoryStorage(),
    fileFilter: m3uFileFilter,
    limits: { fileSize: 5 * 1024 * 1024 },
});
