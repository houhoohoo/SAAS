// services/websocketService.js
class WebSocketService {
    constructor() {
        this.socket = null;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectInterval = 3000;
        this.messageHandlers = new Map();
        this.connectionPromise = null;
        this.isConnected = false;
    }

    connect(url) {
        if (this.connectionPromise) {
            return this.connectionPromise;
        }

        this.connectionPromise = new Promise((resolve, reject) => {
            try {
                this.socket = new WebSocket(url);

                this.socket.onopen = () => {
                    console.log('WebSocket连接成功');
                    this.isConnected = true;
                    this.reconnectAttempts = 0;
                    resolve(this.socket);
                };

                this.socket.onmessage = (event) => {
                    try {
                        const data = JSON.parse(event.data);
                        this.handleMessage(data);
                    } catch (error) {
                        console.error('消息解析错误:', error);
                    }
                };

                this.socket.onclose = (event) => {
                    console.log('WebSocket连接关闭:', event.code, event.reason);
                    this.isConnected = false;
                    this.connectionPromise = null;

                    if (!event.wasClean && this.reconnectAttempts < this.maxReconnectAttempts) {
                        this.reconnect(url);
                    }
                };

                this.socket.onerror = (error) => {
                    console.error('WebSocket错误:', error);
                    reject(error);
                };

            } catch (error) {
                reject(error);
            }
        });

        return this.connectionPromise;
    }

    reconnect(url) {
        this.reconnectAttempts++;
        console.log(`尝试重新连接... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);

        setTimeout(() => {
            this.connect(url);
        }, this.reconnectInterval * this.reconnectAttempts);
    }

    handleMessage(data) {
        const { type, payload, requestId } = data;

        if (this.messageHandlers.has(type)) {
            this.messageHandlers.get(type).forEach(handler => {
                handler(payload, requestId);
            });
        }
    }

    on(type, handler) {
        if (!this.messageHandlers.has(type)) {
            this.messageHandlers.set(type, []);
        }
        this.messageHandlers.get(type).push(handler);

        // 返回取消监听的函数
        return () => {
            const handlers = this.messageHandlers.get(type);
            const index = handlers.indexOf(handler);
            if (index > -1) {
                handlers.splice(index, 1);
            }
        };
    }

    send(type, payload) {
        return new Promise((resolve, reject) => {
            if (this.connectionPromise && !this.isConnected) {
                this.connectionPromise.then(() => {
                    this.send(type, payload).then(resolve).catch(reject);
                }).catch(reject);
                return;
            }
            if (!this.isConnected || !this.socket) {
                reject(new Error('WebSocket未连接'));
                return;
            }

            const requestId = Date.now().toString();
            const message = { type, payload, requestId };

            // 设置响应超时
            const timeout = setTimeout(() => {
                reject(new Error('请求超时'));
            }, 30000);

            // 监听响应
            const unsubscribe = this.on(`${type}_response`, (response, id) => {
                if (id === requestId) {
                    clearTimeout(timeout);
                    unsubscribe();
                    resolve(response);
                }
            });

            try {
                this.socket.send(JSON.stringify(message));
            } catch (error) {
                clearTimeout(timeout);
                unsubscribe();
                reject(error);
            }
        });
    }

    disconnect() {
        if (this.socket) {
            this.socket.close();
            this.socket = null;
        }
        this.isConnected = false;
        this.connectionPromise = null;
    }
}

// 创建单例实例
export const websocketService = new WebSocketService();