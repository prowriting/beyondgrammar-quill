export interface IServiceSettings {
  serviceUrl ?: string;
  userId ?: string;
  apiKey ?: string;
  languages ?: Language[];
  skipCookies ?: boolean;
  animatedHighlightStyles ?: boolean;
  wrapperOptions ?: WrapperOptions;
}

export interface Language{
  displayName: string;
  isoCode: string;
  isEnabled : boolean;
}

export type WrapperBehavior = {
  skipClearMarks?: boolean;
}

export type WrapperBehaviorTiming = '*' | UnbindEditableReason

export interface WrapperOptions {
  additionalAttributes:       Record<string, any>;
  additionalStyles?:          any;
  apiDecorators?:             WrapperAPIDecorators;
  highlighterOptions?:        HighlighterOptions;
  importContent?:             ImportContentOptions;
  behaviors?:                 Record<WrapperBehaviorTiming, WrapperBehavior>;
}

export enum UnbindEditableReason {
  RemovedFromDOM              = 'removed-from-dom',
  NotVisibleAnyMore           = 'not-visible-any-more',
  EditableMonitorStopped      = 'editable-monitor-stopped',
  FrameControllerDestroyed    = 'frame-controller-destroyed',
  EditorsSwitchedOff          = 'editors-switched-off'
}

export type WrapperAPIDecorators = {
  setCursorAtEndOfElement?:   ($el: HTMLElement, api: SetCursorAPI) => any;
  withSelectionPreserved?:    (win: Window, saveSelection: boolean,fn: () => any) => any;
}

export type SetCursorAPI = {
  setCursorAtEndOfElement: Function;
}

export type HighlighterOptions = {
  tagName?:               string;
  classNames?:            string[];
  getActiveHighlightUid?: () => string | null;
}

export type ImportContentOptions = {
  type:           ImportContentType;
  postEvents?:    Array<DispatchEventEntry>;
}

export enum ImportContentType {
  PasteText           = 'paste_text',
  PasteHTML           = 'paste_html',
  SetValue            = 'set_value',
  SetInnerHTML        = 'set_inner_html',
  SetInnerText        = 'set_inner_text',
  ClipboardPasteText  = 'clipboard_paste_event',
  HijackAndPasteText  = 'hijack_and_paste_event',
  FacebookHijackAndPasteText = 'facebook_hijack_and_paste_event',
  ClipboardPasteHtml  = 'clipboard_paste_html_event',
  HijackAndPasteHtml  = 'hijack_and_paste_html_event'
}

export type DispatchEventEntry = DispatchEventInterval | DispatchEventData

export type DispatchEventInterval = number

export type DispatchEventData = {
  type:       string;
  category?:  EventCategory;
  options?:   Record<string, any>
}

export type EventCategory = 'Event' | 'CustomEvent' | 'MouseEvent' | 'KeyboardEvent'
