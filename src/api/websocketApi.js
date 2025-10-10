// api/websocketApi.js
const getBaseHttpUrl = () =>
    (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_BASE_URL) ||
    "http://localhost:8000";

const BASE_HTTP_URL = getBaseHttpUrl();

export const streamChatEvaluate = async ({
    message,
    files = [],
    fileIds = [],
    userInterest = [],
    threadId = null,
    onSession,
    onDelta,
    onComplete,
    onDone,
    onError,
    onInterrupt,
    onReportDelta,
    onReportComplete,
    onReportReady,   // 新增：处理后端文件生成通知
    onFileStart,     // 新增：文件开始处理
    onFileStageComplete, // 新增：文件阶段完成
    onFileDone,      // 新增：文件处理完成
    onFileError,     // 新增：文件处理失败
    onStageComplete, // 新增：阶段完成
    signal,
}) => {
    const controller = new AbortController();
    const abortLinkedSignal = signal;

    const handleAbort = () => {
        if (!controller.signal.aborted) {
            controller.abort();
        }
    };

    const removeAbortListener = () => {
        if (abortLinkedSignal) {
            abortLinkedSignal.removeEventListener("abort", handleAbort);
        }
    };

    if (abortLinkedSignal) {
        if (abortLinkedSignal.aborted) {
            handleAbort();
        } else {
            abortLinkedSignal.addEventListener("abort", handleAbort);
        }
    }

    const normalizedFiles = Array.isArray(files) ? files.filter(Boolean) : [];
    const hasFilePaths = normalizedFiles.some((file) => !!file?.path);
    const resolvedFileIds =
        (fileIds && fileIds.length > 0
            ? fileIds
            : normalizedFiles.map((file) => file?.id).filter(Boolean)) || [];

    const targetUrl = hasFilePaths
        ? `${BASE_HTTP_URL}/chat/evaluate`
        : `${BASE_HTTP_URL}/chat/normal/sse`;

    const payload = hasFilePaths
        ? {
              query: message,
              user_interest: userInterest,
              thread_id: threadId,
              file_ids: normalizedFiles
                  .map((file) => file?.path || file?.id)
                  .filter(Boolean),
          }
        : {
              message,
              user_interest: userInterest,
              thread_id: threadId,
              file_id: resolvedFileIds,
          };

    let response;
    try {
        response = await fetch(targetUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
            signal: controller.signal,
        });
    } catch (error) {
        if (controller.signal.aborted) {
            throw new DOMException("已中止", "AbortError");
        }
        throw error;
    }

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "请求失败");
    }

    if (!response.body) {
        throw new Error("SSE 不支持: 响应体为空");
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder("utf-8");
    let buffer = "";

    try {
        while (true) {
            const { value, done } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });

            let boundaryIndex;
            while ((boundaryIndex = buffer.indexOf("\n\n")) !== -1) {
                const rawEvent = buffer.slice(0, boundaryIndex).trim();
                buffer = buffer.slice(boundaryIndex + 2);

                if (!rawEvent) continue;

                const lines = rawEvent.split("\n");
                let eventName = "message";
                const dataLines = [];

                for (const line of lines) {
                    if (line.startsWith("event:")) {
                        eventName = line.slice(6).trim();
                    } else if (line.startsWith("data:")) {
                        dataLines.push(line.slice(5).trim());
                    }
                }

                const dataString = dataLines.join("\n");
                let parsedData = dataString;

                if (dataString) {
                    try {
                        parsedData = JSON.parse(dataString);
                    } catch (error) {
                        parsedData = dataString;
                    }
                }

                switch (eventName) {
                    case "session":
                        onSession?.(parsedData);
                        break;
                    case "delta":
                        onDelta?.(parsedData);
                        break;
                    case "complete":
                        onComplete?.(parsedData);
                        break;
                    case "interrupt":
                        onInterrupt?.(parsedData);
                        break;
                    case "report_delta":
                        onReportDelta?.(parsedData);
                        break;
                    case "report_complete":
                        onReportComplete?.(parsedData);
                        break;
                    case "report_ready":
                        onReportReady?.(parsedData);
                        break;
                    // 新增：多文件处理事件
                    case "file_start":
                        onFileStart?.(parsedData);
                        break;
                    case "file_stage_complete":
                        onFileStageComplete?.(parsedData);
                        break;
                    case "file_done":
                        onFileDone?.(parsedData);
                        break;
                    case "file_error":
                        onFileError?.(parsedData);
                        break;
                    case "stage_complete":
                        onStageComplete?.(parsedData);
                        break;
                    case "done":
                        onDone?.(parsedData);
                        break;
                    case "error":
                        onError?.(parsedData);
                        break;
                    default:
                        onDelta?.(parsedData);
                        break;
                }
            }
        }
    } catch (error) {
        if (controller.signal.aborted) {
            throw new DOMException("已中止", "AbortError");
        }
        throw error;
    } finally {
        removeAbortListener();
        reader.releaseLock();
    }
};

export const uploadFilesHttp = async (files = []) => {
    if (!files || files.length === 0) return [];

    const formData = new FormData();

    files.forEach((item) => {
        const src = item?.raw || item?.file || item;

        if (src instanceof File || src instanceof Blob) {
            const name = src instanceof File ? src.name : item?.name || "uploaded";
            formData.append("files", src, name);
            return;
        }

        if (item?.content != null) {
            const blob = item.content instanceof Blob
                ? item.content
                : new Blob(
                    [
                        item.content instanceof ArrayBuffer || ArrayBuffer.isView(item.content)
                            ? item.content
                            : String(item.content),
                    ],
                    { type: item.type || "application/octet-stream" }
                );
            formData.append("files", blob, item.name || "uploaded");
            return;
        }

        throw new Error("无有效文件二进制，无法上传");
    });

    const response = await fetch(`${BASE_HTTP_URL}/upload`, {
        method: "POST",
        body: formData,
    });

    if (!response.ok) {
        throw new Error((await response.text()) || "上传失败");
    }

    const data = await response.json();

    return data.map((item, index) => {
        const src = files[index]?.raw || files[index]?.file || files[index];
        return {
            id: item.file_id,
            name: item.filename,
            size: item.size,
            type: src?.type || files[index]?.type || "application/octet-stream",
            path: item.path,
            uploadedAt: new Date().toISOString(),
            status: "success",
        };
    });
};

// 聊天控制接口 - 处理人工审核反馈
export const chatControl = async ({
    threadId,
    action,
    feedback = null,
    fileId = null,
} = {}) => {
    if (!threadId) {
        throw new Error("缺少 threadId");
    }

    const payload = {
        thread_id: threadId,
        action,
    };

    if (feedback) {
        payload.feedback = feedback;
    }

    if (fileId) {
        payload.file_id = fileId;
    }

    const response = await fetch(`${BASE_HTTP_URL}/chat/control`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
    });

    if (!response.ok) {
        throw new Error((await response.text()) || "控制请求失败");
    }

    return await response.json();
};