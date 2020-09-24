import { Self, MessageType, MessageListener, TaskMap } from "./types";
import { isNative, warn, noop } from "./utils";
import { Request, Response, Task, STATUS } from "./reaction";

type ClientOption = {
  self?: Self;
};

export default class Client {
  target: Self;
  origin: string;
  self: Self;
  tasks: TaskMap<string, Task>;
  private _msgListener: MessageListener;

  constructor(target: Self, origin: string = "*", option: ClientOption = {}) {
    this.target = target;
    this.origin = origin;
    this.self = option.self ?? self;
    this.tasks = Object.create(null);
    this._msgListener = noop;
    this.open()

    // target 必须是带有原生window.postmessage方法
    if (!isNative(target.postMessage)) {
      throw new TypeError(
        "The first parameter must contain native `postMessage` method"
      );
    }
  }

  /**
   * 开启Client
   */
  open() {
    this._msgListener = this._receiver.bind(this);
    debugger
    this.self.addEventListener("message", this._msgListener);
  }

  /**触发监听，发布postmessage 事件
   * @param {MessageType} type
   * @param {any} data
   * @param {string} origin
   * @returns {Promise}  Promise 响应结果
   */
  request(type: MessageType, data: any, origin?: string) {
    debugger;

    const req = new Request({ type, data });
    return this._request(req, origin ?? this.origin);
  }

  /** 处理request请求
   * @param {Request} req
   */
  private _request(req: Request, origin: string) {
    if (!Request.isRequest(req)) {
      warn("The return value of requestInterceptor must be a valid request");
      return Promise.reject(req);
    }

    return new Promise((resolve, reject) => {
      this.target.postMessage(req, origin);
      this.tasks[req._id] = new Task(req, null, resolve, reject);
    });
  }

  /**接收来自server的响应
   * @param {MessageEvent} event
   * */
  private _receiver(event: MessageEvent) {
    debugger
    if (!Response.isResponse(event.data)) return;
    const { type, _id } = event.data;
    const task = this.tasks[_id];
    if (!task) return;

    let res = new Response(event.data); // 根据接收信息生成一个响应对象
    task.res = res;
    if (res.status === STATUS.success) {
      task.resolve(res);
    } else {
      task.reject(res);
    }
  }
}
