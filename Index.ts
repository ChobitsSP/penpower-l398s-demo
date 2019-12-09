import $ from "jquery";
import { Observable } from "rxjs";
import { Message } from "element-ui";

const apiUrl = "http://localhost:8089/PPSignSDK/";

function GetWindowActiveSource(sub: Observable<any>) {
  const s1$ = Observable.of(document.hasFocus());
  const focus$ = Observable.fromEvent(window, "focus").map(() => true);
  const blur$ = Observable.fromEvent(window, "blur").map(() => false);
  const source$ = Observable.merge(s1$, blur$, focus$);

  // if the window is not focused, we return an empty observable
  // if the window is focused we retunr the gameLoop$
  return source$.switchMap(isFocused => (isFocused ? sub : Observable.empty()));
}

function Promisfiy(ajax: JQuery.jqXHR) {
  return new Promise((resolve, reject) => {
    ajax.done(resolve).fail(reject);
  });
}

export function DoGet<T = any>(method, params = {}) {
  const url = apiUrl + method;
  return Promisfiy($.get(url, params)) as Promise<T>;
}

function DoPost<T = any>(method, data = {}) {
  const url = apiUrl + method;
  return Promisfiy($.post(url, data));
}

/**
 * set pen width api
 * @export
 * @param {*} Width
 * @returns
 */
export function SetPenWidth(Width) {
  return DoGet("SetPenWidth", { Width });
}

/**
 * set pen style api
 * @export
 * @param {*} Style
 * @returns
 */
export function SetPenStyle(Style) {
  return DoGet("SetPenStyle", { Style });
}

/**
 * open & close LCD api
 * @export
 * @returns
 */
export function OpenLCD() {
  return DoGet("OpenLCD");
}

/**
 * open & close LCD api
 * @export
 * @returns
 */
export function CloseLCD() {
  return DoGet("CloseLCD");
}

export function SetClip(width, height) {
  return DoGet("SetClip", { width, height });
}

export function EnableSaveVideoData(enable: boolean) {
  return DoGet("EnableSaveVideoData", { show: enable ? 1 : 0 });
}

export function GetSize() {
  return DoGet("GetSize");
}

interface InksInfo {
  EventType: number;
  Image: string;
}

export async function GetImage() {
  const json = await DoGet("GetInks");
  const dataInfos: InksInfo[] = JSON.parse(json);
  const info = dataInfos.find(t => t.EventType === 0);
  return info ? info.Image : null;
}

/**
 * 取得簽名板按鈕status
 * 0 取消 1 确认 -1 错误
 * @export
 */
export async function GetStatus() {
  return DoGet("GetDeviceConfirmOrCancelKeyStatus");
}

const DEVICE_ID = 2;

export async function initDevice(vm: vm) {
  const params = {
    id: DEVICE_ID,
    width: 580,
    height: 380
  };

  try {
    const result = await DoGet<boolean>("InitialDevice", params);
    vm.isPolling = !!result;
  } catch {
    Message.error("没有连接设备!");
    vm.isPolling = false;
  }
}

export function uninitDevice() {
  return DoGet("UninitialDevice", { id: DEVICE_ID });
}

interface vm {
  isPolling: boolean;
  drawImage(img: any);
  clearImage(): void;
}

export function GetImgSource(status$: Observable<number>) {
  return status$
    .filter(t => t === 1)
    .flatMap(t => Observable.fromPromise(GetImage()))
    .filter(t => t != null)
    .distinctUntilChanged();
}

export function GetImg(base64: string) {
  return new Promise<HTMLImageElement>(resolve => {
    const img = new Image();

    img.addEventListener(
      "load",
      () => {
        resolve(img);
      },
      false
    );

    img.src = "data:image/png;base64," + base64;
  });
}

export function GetStatusSource(vm: vm) {
  const source$ = Observable.interval(1e3)
    .filter(_ => vm.isPolling)
    .concatMap(_ =>
      Observable.fromPromise(GetStatus())
        .catch(error => Observable.of("-1"))
        .delay(500)
    )
    .map(t => parseInt(t, 10))
    .distinctUntilChanged()
    .filter(t => t !== -1)
    .share();

  return GetWindowActiveSource(source$);
}
