addEventListener('fetch', event => {
    event.passThroughOnException()

    event.respondWith(handleRequest(event))
})

/**
* Respond to the request
* @param {Request} request
*/
async function handleRequest(event) {
    const { request } = event;

    let reqHeaders = new Headers(request.headers),
        outHeaders = new Headers({
            "Access-Control-Allow-Origin": reqHeaders.get('Origin') || "*",
            "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
            "Access-Control-Allow-Headers": reqHeaders.get("Access-Control-Allow-Headers") || "Accept, Authorization, Cache-Control, Content-Type, DNT, If-Modified-Since, Keep-Alive, Origin, User-Agent, X-Requested-With, Token, x-access-token, Notion-Version"
        });

    try {
        let url = request.url.substr(8);
        url = decodeURIComponent(url.substr(url.indexOf('/') + 1));

        if (request.method === "OPTIONS" && reqHeaders.has('access-control-request-headers')) {
            return new Response(null, { status: 204, headers: outHeaders });
        } else if (url.length < 3 || url.indexOf('.') === -1 || url === "favicon.ico" || url === "robots.txt") {
            return Response.redirect('https://baidu.com', 301);
        } else if (blocker.check(url)) {
            return Response.redirect('https://baidu.com', 301);
        }

        // 标准化 URL
        url = url.replace(/https:(\/)*/, 'https://').replace(/http:(\/)*/, 'http://');
        if (url.indexOf("://") === -1) url = "http://" + url;

        let fp = {
            method: request.method,
            headers: {}
        };

        // 保留必要的请求头
        const requrl = new URL(url);
        const he = reqHeaders.entries();

        if (requrl.hostname.endsWith('.xunleix.com')) {
            for (let h of he) {
                if (!['content-length', 'cf-ipcountry', 'x-real-ip', 'cf-connecting-ip', 'server'].includes(h[0])) {
                    fp.headers[h[0]] = h[1];
                }
            }
        } else {
            for (let h of he) {
                if (!['content-length'].includes(h[0])) {
                    fp.headers[h[0]] = h[1];
                }
            }
        }

        // 处理请求体
        if (["POST", "PUT", "PATCH", "DELETE"].includes(request.method)) {
            const ct = (reqHeaders.get('content-type') || "").toLowerCase();
            if (ct.includes('application/json')) {
                fp.body = JSON.stringify(await request.json());
            } else if (ct.includes('application/text') || ct.includes('text/html')) {
                fp.body = await request.text();
            } else if (ct.includes('form')) {
                fp.body = await request.formData();
            } else {
                fp.body = await request.blob();
            }
        }

        const upstreamRes = await fetch(url, fp);

        // 拷贝原始响应头
        upstreamRes.headers.forEach((value, key) => {
            outHeaders.set(key, value);
        });

        // 处理 HTML 内容
        const contentType = upstreamRes.headers.get("content-type") || "";
        const acceptHeader = reqHeaders.get("accept") || "";

        let status = upstreamRes.status;
        let body = upstreamRes.body;

        const isHTML = contentType.includes("text/html") || acceptHeader.includes("text/html");

        if (isHTML && upstreamRes.ok) {
            body = new HTMLRewriter()
                .on("head", {
                    element(el) {
                        el.prepend(`<base href="${ url }" />`, { html: true });
                    }
                })
                .transform(upstreamRes);
        }

        const rangeHeader = reqHeaders.get("range");

        if (rangeHeader) {
            // 说明客户端发起的是 Range 请求
            outHeaders.set("Accept-Ranges", "bytes");

            const status = upstreamRes.status;

            if (status === 200 && upstreamRes.headers.has("Content-Range")) {
                // 如果上游已经返回 Content-Range，我们强制用 206 返回
                return new Response(upstreamRes.body, {
                    status: 206,
                    headers: outHeaders
                });
            } else if (status === 206) {
                // 上游正确返回了 206，我们保持原样
                return new Response(upstreamRes.body, {
                    status: 206,
                    headers: outHeaders
                });
            } else if(status === 416){

                const retryRes = await fetch(url, { method: "GET" });
                const fallbackHeaders = new Headers(retryRes.headers);
                fallbackHeaders.set("Accept-Ranges", "bytes");
          
                return new Response(retryRes.body, {
                  status: 200,
                  headers: fallbackHeaders
                });

            }else {
                // 上游没有返回 Content-Range，但客户端要求 Range
                // 这里其实是个问题：你可以加日志查看为什么
                return new Response("Partial Content Expected But Not Found", {
                    status: 416,
                    headers: outHeaders
                });
            }
        }

        // 返回响应（保留原始状态码，包括 206）
        return new Response(body, {
            status: status,
            statusText: upstreamRes.statusText,
            headers: outHeaders
        });

    } catch (err) {
        return new Response(JSON.stringify({ code: -1, msg: err.stack || err.toString() }), {
            status: 500,
            headers: { "content-type": "application/json" }
        });
    }
}

/**
* 阻断器
*/
const blocker = {
    keys: [".m3u8", ".ts", ".acc", ".m4s", "photocall.tv", "googlevideo.com"],
    check: function (url) {
        url = url.toLowerCase();
        let len = blocker.keys.filter(x => url.includes(x)).length;
        return len != 0;
    }
}

