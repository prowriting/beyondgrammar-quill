import { ILanguage } from "./ILanguage";
import { IGrammarCheckerSettings } from "./IGrammarCheckerSettings";
import { IServiceSettings } from "./IServiceSettings";

export type DictionaryEntry = {
  Id: string;
  Word: string;
  Replacement?: string;
}

export interface IGrammarCheckerConstructor {
  new(element: HTMLElement, serviceSettings: IServiceSettings, grammarCheckerSettings?: IGrammarCheckerSettings): IGrammarChecker;
}

export enum UnbindEditableReason {
  RemovedFromDOM              = 'removed-from-dom',
  NotVisibleAnyMore           = 'not-visible-any-more',
  EditableMonitorStopped      = 'editable-monitor-stopped',
  FrameControllerDestroyed    = 'frame-controller-destroyed',
  EditorsSwitchedOff          = 'editors-switched-off'
}

export interface ThesaurusData{
  textAreaRange ?: any;//TextAreaRange;
  wordRange : any;//RangyRange;
  isContextual : boolean;
  word : string;
  context ?: string;
  start ?: number;
  end ?: number;
}

export interface Size {
  width : number;
  height : number;
}

export interface Rectangle extends Position, Size {}

export type MouseXY = [ number, number ];

export interface Tag{
  //[pavel] id is not related to api, but as we create tags outside of api, for saving inconsistency of id between checking
  // in ce-overlay, we need to store id and save it for creating new highlights.
  id ?: string;
  startPos : number;
  endPos : number;
  hint : string;
  suggestions : string[];
  category : string;
  ruleId : string;
  text: string;
  ignore: boolean;
  hovered?: boolean;
}

export interface HighlightInfo{
  word: string;
  category: string;
  hint: string;
  suggestions: string[];
  ruleId: string;
  originalText: string;
  originalSuggestions: string;
}

export interface ThrottledFunction {
  (...args:any[]):any;
  _name : string;
  cancel() : any;
}

export interface IGrammarChecker {
  onShowThesaurus: (thesaurusData: ThesaurusData, mouseXY : MouseXY, contextWindow: Window)=>boolean;
  /*
  get the text from a specific element
   */
  getText(blockElement: HTMLElement):string;
  /*
  Clear all the marks from the text
   */
  clearMarks(skipIgnored : boolean): void;
  /*
  start bindings
   */
  bindEditable(): void;
  /*
  end bindings
   */
  unbindEditable(reason?: UnbindEditableReason): void;

  /*
  start change events being logged
   */
  bindChangeEvents(): void;

  /*
  Stop change events being raised
   */
  unbindChangeEvents() : void;

  /*
  Get all block elements
   */
  getAllElements(): HTMLElement[];

  /*
  Apply the highlights to the specified block
   */
  applyHighlightsSingleBlock(elem: HTMLElement, text: string, tags: Tag[], ignoreSelectors:string[], removeExisting: boolean): void;

  /*
  Remove all highlights that match this uid
   */
  onAddToDictionary(uid: string): void;

  /*
  Get the info for the specified highlight
   */
  getHighlightInfo(uid: string): HighlightInfo;

  updateAfterPaste(): void;
  /*
  This should be called when a block of text is changed. Usually a paragraph.
   */
  onBlockChanged: (block: HTMLElement)=> void;
  onPopupClose: (immediate?:boolean)=> void;
  onPopupDeferClose: ()=>void;
  onCheckRequired: ()=> void;
  onShowPopup: (uid:string, elem: Element, mouseXY : MouseXY,preventCloseByMouseLeave ?: boolean)=>void;
  getActiveHighlightUid: () => string | null;

  onPopupClosed : ()=>void;

  notifyCursorPositionChanged : ThrottledFunction;

  resetSpellCheck():void;
  restoreSpellCheck():void;
  /*
  Count the number of errors in the document
   */
  getCurrentErrorCount(): number;

  /**
   * Get absolute position of text cursor on screen
   * @returns {{top: number; left: number}}
   */
  getCursorScreenPosition():Rectangle;

  //applying user's choices
  /*
  Ignore the specified highlight
   */
  ignore(uid: string): void;
  /*
  Omit the specified highlight
   */
  omit(uid: string): void;
  /*
  Accept the specified highlight
   */
  accept(uid: string, suggestion: string):void;
  /*
  Apply the specified replacement to the word selected for the thesaurus
   */
  applyThesaurus( replacement : string ) : void;

  /*
  Gets the HTML
   */
  getHtml(): string;
  /*
  Sets the HTML
   */
  setHtml( html: string ): void;

  getAllMarks() : HTMLElement[];
  getContainer():HTMLElement;

  updateActiveSelection():void;

  scrollToHighlight(elem : HTMLElement) : void;
  nextHighlight() : HTMLElement;
  prevHighlight() : HTMLElement;
  jumpToNextHighlight() : void;

  addHoveredClass($highlight : JQuery) : void;
  removeHoveredClass($highlight : JQuery) : void;
}
