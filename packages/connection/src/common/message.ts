import {
  AbstractMessageReader,
  AbstractMessageWriter,
  createMessageConnection,
} from '@opensumi/vscode-jsonrpc/lib/common/api';
import { Disposable } from '@opensumi/vscode-jsonrpc/lib/common/disposable';
import { MessageReader, DataCallback } from '@opensumi/vscode-jsonrpc/lib/common/messageReader';
import { MessageWriter } from '@opensumi/vscode-jsonrpc/lib/common/messageWriter';
/**
 * FIXME: 由于 `createMessageConnection` 方法隐式依赖了 `@opensumi/vscode-jsonrpc/lib/browser/main` 或 `@opensumi/vscode-jsonrpc/lib/node/main`
 * 的 `RIL.install()` 初始化代码，而 `browser/main` 中仅支持浏览器使用，
 * 故需要保证提前引入或执行一次 `@opensumi/vscode-jsonrpc/lib/node/main` 代码才能保证逻辑正常执行
 */
import '@opensumi/vscode-jsonrpc/lib/node/main';

namespace ObjectTransfer {
  export function replacer(key: string | undefined, value: any) {
    if (value) {
      if (value instanceof Uint8Array || value instanceof Uint32Array || value instanceof Uint16Array) {
        return {
          type: 'Buffer',
          data: Array.from(value),
        };
      } else if (value instanceof ArrayBuffer) {
        return {
          type: 'Buffer',
          data: Array.from(new Uint8Array(value)),
        };
      }
    }

    return value;
  }

  export function reviver(key: string | undefined, value: any) {
    if (value && value.type !== undefined && value.data !== undefined) {
      if (value.type === 'Buffer') {
        return Uint8Array.from(value.data);
      }
      return value;
    }
    return value;
  }
}

export class WebSocketMessageReader extends AbstractMessageReader implements MessageReader {
  protected state: 'initial' | 'listening' | 'closed' = 'initial';
  protected callback: DataCallback | undefined;
  protected events: { message?: any; error?: any }[] = [];

  constructor(protected readonly socket) {
    super();
    if (this.socket.onMessage) {
      this.socket.onMessage((message) => {
        this.readMessage(message);
      });
    } else if (this.socket.onmessage) {
      this.socket.onmessage = (message) => {
        this.readMessage(message);
      };
    } else if (this.socket.on) {
      this.socket.on('message', (message) => {
        this.readMessage(message);
      });
    }
  }

  public listen(callback: DataCallback): Disposable {
    if (this.state === 'initial') {
      this.state = 'listening';
      this.callback = callback;
    }

    while (this.events.length !== 0) {
      const event = this.events.pop()!;
      if (event.message) {
        this.readMessage(event.message);
      }
    }

    return Disposable.create(() => {
      this.state = 'closed';
      this.callback = undefined;
      this.events = [];
    });
  }

  protected readMessage(message) {
    if (this.state === 'initial') {
      this.events.splice(0, 0, { message });
    } else if (this.state === 'listening') {
      const data = JSON.parse(message, ObjectTransfer.reviver);
      this.callback!(data);
    }
  }
}

export class WebSocketMessageWriter extends AbstractMessageWriter implements MessageWriter {
  constructor(protected readonly socket) {
    super();
  }

  write(msg): Promise<void> {
    try {
      const content = JSON.stringify(msg, ObjectTransfer.replacer);
      this.socket.send(content);
      return Promise.resolve();
    } catch (e) {
      return Promise.reject(e);
    }
  }

  public end(): void {}
}

/**
 * 给服务端的 WebSocket 及 Browser 端的 WebSocket 实例共用的方法
 * @param socket
 * @returns
 */
export function createWebSocketConnection(socket: any) {
  return createMessageConnection(new WebSocketMessageReader(socket), new WebSocketMessageWriter(socket));
}
