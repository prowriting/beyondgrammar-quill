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

export interface IGrammarChecker {
  init(): Promise<void>;

  activate(): void;
  deactivate(): void;
  isActivated(): boolean;

  clearMarks(): void;
  reloadMarks(): void;

  setSettings(settings: IGrammarCheckerSettings): void;
  getSettings(): IGrammarCheckerSettings;

  getAvailableLanguages(): ILanguage[];
  getApplicationName(): string;
  getApplicationVersion(): string;
  getVersionedApplicationName(): string;
  getCopyrightUrl(): string;
  getBrandImageUrl(): string;

  addToDictionary(word: string): Promise<DictionaryEntry[]>;
}
