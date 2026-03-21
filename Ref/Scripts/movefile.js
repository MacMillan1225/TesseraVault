module.exports = async (params) => {
    const CONFIG = {
        sourceFolder: "每日任务",          // 源文件夹
        targetFolder: "每日任务/Archive", // 归档文件夹
        triggerCount: 10,                 // 文件数 >= 10 时触发
        moveTarget: 5,                    // 一次移动最旧的 5 个
        onlyMarkdown: true,               // 只处理 md 文件
        debug: true                       // 是否输出详细日志
    };

    const { app } = params;
    const { sourceFolder, targetFolder, triggerCount, moveTarget, onlyMarkdown, debug } = CONFIG;

    const log = (...args) => {
        if (debug) console.log("[QuickAdd-Archive]", ...args);
    };

    const warn = (...args) => {
        console.warn("[QuickAdd-Archive]", ...args);
    };

    const error = (...args) => {
        console.error("[QuickAdd-Archive]", ...args);
    };

    // =========================
    // 执行锁：防止重复触发/并发运行
    // =========================
    const LOCK_KEY = "__dailyArchiveRunning";
    if (app[LOCK_KEY]) {
        log("归档脚本已在运行，跳过本次执行。");
        return;
    }
    app[LOCK_KEY] = true;

    try {
        // =========================
        // 工具函数
        // =========================

        const isFolder = (obj) => !!obj && Array.isArray(obj.children);
        const isMarkdownFile = (obj) =>
            !!obj &&
            typeof obj.path === "string" &&
            typeof obj.name === "string" &&
            typeof obj.extension === "string" &&
            !Array.isArray(obj.children) &&
            (!onlyMarkdown || obj.extension === "md");

        const normalizeDateString = (value) => {
            if (!value) return null;

            // 如果本身就是 Date
            if (value instanceof Date && !isNaN(value.getTime())) {
                return value.getTime();
            }

            // 如果是数字时间戳
            if (typeof value === "number" && !isNaN(value)) {
                return value;
            }

            if (typeof value !== "string") return null;

            const text = value.trim();
            if (!text) return null;

            // 优先处理 YYYY-MM-DD
            let m = text.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
            if (m) {
                const [, y, mo, d] = m;
                const dt = new Date(
                    Number(y),
                    Number(mo) - 1,
                    Number(d),
                    0, 0, 0, 0
                );
                if (!isNaN(dt.getTime())) return dt.getTime();
            }

            // 处理 YYYY-MM-DD HH:mm[:ss]
            m = text.match(/^(\d{4})-(\d{1,2})-(\d{1,2})[ T](\d{1,2}):(\d{1,2})(?::(\d{1,2}))?$/);
            if (m) {
                const [, y, mo, d, h, mi, s] = m;
                const dt = new Date(
                    Number(y),
                    Number(mo) - 1,
                    Number(d),
                    Number(h),
                    Number(mi),
                    Number(s || 0),
                    0
                );
                if (!isNaN(dt.getTime())) return dt.getTime();
            }

            // 最后兜底给原生 Date
            const parsed = new Date(text);
            if (!isNaN(parsed.getTime())) {
                return parsed.getTime();
            }

            return null;
        };

        const getFileDate = (file) => {
            try {
                const cache = app.metadataCache.getFileCache(file);
                const frontmatter = cache?.frontmatter;

                // 优先使用 date
                const dateFields = [
                    frontmatter?.date,
                    frontmatter?.created,
                    frontmatter?.created_at,
                    frontmatter?.day
                ];

                for (const candidate of dateFields) {
                    const ts = normalizeDateString(candidate);
                    if (ts !== null) return ts;
                }

                // 兜底：ctime
                return file.stat?.ctime || Date.now();
            } catch (e) {
                warn(`读取文件日期失败，回退到 ctime: ${file.path}`, e);
                return file.stat?.ctime || Date.now();
            }
        };

        const ensureFolderExists = async (folderPath) => {
            const exists = app.vault.getAbstractFileByPath(folderPath);
            if (exists) {
                if (!isFolder(exists)) {
                    throw new Error(`路径存在但不是文件夹: ${folderPath}`);
                }
                return exists;
            }

            const parts = folderPath.split("/").filter(Boolean);
            let currentPath = "";

            for (const part of parts) {
                currentPath = currentPath ? `${currentPath}/${part}` : part;
                const current = app.vault.getAbstractFileByPath(currentPath);
                if (!current) {
                    log(`创建文件夹: ${currentPath}`);
                    await app.vault.createFolder(currentPath);
                } else if (!isFolder(current)) {
                    throw new Error(`路径存在但不是文件夹: ${currentPath}`);
                }
            }

            const finalFolder = app.vault.getAbstractFileByPath(folderPath);
            if (!finalFolder || !isFolder(finalFolder)) {
                throw new Error(`无法创建或获取目标文件夹: ${folderPath}`);
            }
            return finalFolder;
        };

        const splitFileName = (name) => {
            const lastDot = name.lastIndexOf(".");
            if (lastDot <= 0) {
                return { base: name, ext: "" };
            }
            return {
                base: name.slice(0, lastDot),
                ext: name.slice(lastDot)
            };
        };

        const getUniquePath = (folderPath, fileName) => {
            let candidatePath = `${folderPath}/${fileName}`;
            if (!app.vault.getAbstractFileByPath(candidatePath)) {
                return candidatePath;
            }

            const { base, ext } = splitFileName(fileName);
            let index = 1;
            while (true) {
                candidatePath = `${folderPath}/${base} (${index})${ext}`;
                if (!app.vault.getAbstractFileByPath(candidatePath)) {
                    return candidatePath;
                }
                index++;
            }
        };

        // =========================
        // 1. 校验源文件夹
        // =========================
        const source = app.vault.getAbstractFileByPath(sourceFolder);
        if (!source || !isFolder(source)) {
            new Notice(`❌ 错误：找不到源文件夹，或该路径不是文件夹：${sourceFolder}`);
            return;
        }

        // =========================
        // 2. 确保目标文件夹存在
        // =========================
        let target;
        try {
            target = await ensureFolderExists(targetFolder);
        } catch (e) {
            error("创建/检查目标文件夹失败：", e);
            new Notice(`❌ 目标文件夹错误：${targetFolder}`);
            return;
        }

        if (!target || !isFolder(target)) {
            new Notice(`❌ 错误：目标路径不是文件夹：${targetFolder}`);
            return;
        }

        // =========================
        // 3. 获取待处理文件
        // =========================
        const files = source.children.filter(isMarkdownFile);

        log(`源文件夹: ${sourceFolder}`);
        log(`目标文件夹: ${targetFolder}`);
        log(`当前符合条件文件数: ${files.length}`);

        // =========================
        // 4. 阈值判断
        // =========================
        if (files.length < triggerCount) {
            log(`当前文件数 ${files.length} < 阈值 ${triggerCount}，跳过归档。`);
            return;
        }

        // =========================
        // 5. 排序：旧 -> 新
        // 稳定排序：日期相同时用路径兜底
        // =========================
        files.sort((a, b) => {
            const diff = getFileDate(a) - getFileDate(b);
            if (diff !== 0) return diff;
            return a.path.localeCompare(b.path, "zh-CN");
        });

        const filesToMove = files.slice(0, Math.min(moveTarget, files.length));

        log(
            "本次待移动文件：",
            filesToMove.map(f => ({
                path: f.path,
                name: f.name,
                ts: getFileDate(f),
                iso: new Date(getFileDate(f)).toISOString()
            }))
        );

        if (filesToMove.length === 0) {
            log("没有需要移动的文件。");
            return;
        }

        // =========================
        // 6. 执行移动
        // =========================
        let successCount = 0;
        let skipCount = 0;
        let failCount = 0;

        for (const file of filesToMove) {
            const oldPath = file.path;

            // 防止源和目标路径一样
            if (!oldPath.startsWith(`${sourceFolder}/`) && oldPath !== sourceFolder) {
                warn(`文件似乎不在源目录下，跳过: ${oldPath}`);
                skipCount++;
                continue;
            }

            const newPath = getUniquePath(targetFolder, file.name);

            if (oldPath === newPath) {
                warn(`源路径与目标路径相同，跳过: ${oldPath}`);
                skipCount++;
                continue;
            }

            try {
                log(`准备移动: ${oldPath} -> ${newPath}`);
                await app.fileManager.renameFile(file, newPath);

                // 简单校验
                const moved = app.vault.getAbstractFileByPath(newPath);
                const oldStillExists = app.vault.getAbstractFileByPath(oldPath);

                if (moved && !oldStillExists) {
                    successCount++;
                    log(`移动成功: ${oldPath} -> ${newPath}`);
                } else {
                    // 某些同步/缓存场景下这里可能短暂不一致，记录告警
                    successCount++;
                    warn(`移动后校验出现非预期状态:`, {
                        oldPath,
                        newPath,
                        movedExists: !!moved,
                        oldStillExists: !!oldStillExists
                    });
                }
            } catch (e) {
                failCount++;
                error(`移动文件失败: ${oldPath}`, e);
            }
        }

        // =========================
        // 7. 最终提示
        // =========================
        if (successCount > 0) {
            new Notice(`🧹 已归档 ${successCount} 个旧文件${failCount > 0 ? `，失败 ${failCount} 个` : ""}${skipCount > 0 ? `，跳过 ${skipCount} 个` : ""}。`);
        } else if (failCount > 0 || skipCount > 0) {
            new Notice(`⚠️ 触发了归档，但没有成功移动文件。失败 ${failCount} 个，跳过 ${skipCount} 个。`);
        } else {
            log("满足阈值，但没有文件被处理。");
        }
    } catch (e) {
        console.error("[QuickAdd-Archive] 脚本执行异常：", e);
        new Notice("❌ 归档脚本执行失败，请查看控制台日志。");
    } finally {
        app[LOCK_KEY] = false;
    }
};