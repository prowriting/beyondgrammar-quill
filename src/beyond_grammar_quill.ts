import Quill from 'quill'
import {IGrammarChecker, IGrammarCheckerConstructor} from './interfaces/IGrammarChecker'
import {IServiceSettings} from './interfaces/IServiceSettings'
import {exportToNamespace, loadScriptIfNeeded, textRangeInAncestor} from './common/utils'
import './styles/index.scss'
import {ILanguage} from './interfaces/ILanguage';

const settings = {
  service: {
    apiKey:       "E8FEF7AE-3F36-4EAF-A451-456D05E6F2A3",
    sourcePath:   '//cdn.prowritingaid.com/beyondgrammar/2.0.2991/dist/hayt/bundle.js',
    serviceUrl:   '//rtg.prowritingaid.com'
  },
  grammar: {
    languageFilter:   null,
    languageIsoCode:  null,
    checkStyle:       true,
    checkSpelling:    true,
    checkGrammar:     true,
    checkerIsEnabled: true
  }
};

const cache = [] as Array<{quill: Quill, mod: BeyondGrammarModule, id: string}>;

function saveQuillAndMod (quill: Quill, mod: BeyondGrammarModule) {
  const id = '' + Math.random();
  cache.push({ id, quill, mod })
}

function findModByQuill (quill: Quill) {
  const item = cache.find(item => item.quill === quill);
  return item ? item.mod : null
}

export type QuillBeyondGrammarOptions = {}

export class BeyondGrammarModule {
  private checker: IGrammarChecker | null = null;

  constructor (private quill: Quill, options: QuillBeyondGrammarOptions) {
    this.quill.getModule('toolbar').addHandler('beyondgrammar', this.toolbarHandler);

    saveQuillAndMod(quill, this);

    initBeyondGrammarForQuillInstance(quill)
    .then(checker => {
      this.checker = checker;
      this.updateSelect('en-US')
    })
  }

  toolbarHandler = (value: string | boolean) => {
    if (!this.checker)  return;

    switch (value) {
      // Note: Quill requires the "disabled" state to have `false` as value in <select>
      // reference: https://github.com/quilljs/quill/blob/eda1472fb0813455cec38af296a24057b254c29d/modules/toolbar.js#L191
      case false:
        this.checker.deactivate();
        break;

      default:
        this.checker.setSettings({
          ...this.checker.getSettings,
          languageIsoCode: value as string
        });
        this.checker.activate();
        break
    }

    this.updateSelect(value)
  };

  updateSelect = (value: string | boolean) => {
    // Note: Quill renders `[{ beyondgrammar: ['en-US', 'en-GB', false] }]` (in `config.modules`)
    // into a hidden <select> and a visible `.ql-picker` <span> as its next sibling
    // The wording (content) of those <span> are defined in index.scss
    // What we need to tell css is the `data-bg-value` as the current selected value
    const [_, $select]: [string, HTMLElement] = this.quill.getModule('toolbar').controls.find((item: any) => {
      return item[0] === 'beyondgrammar'
    });
    const $picker = $select.previousElementSibling as Element;
    const $label  = $picker.querySelector('.ql-picker-label') as Element;

    $label.setAttribute('data-bg-value', '' + value)
  }
}

export function getToolbarHandler (quill: Quill) {
  return (value: string | boolean) => {
    const mod: BeyondGrammarModule | null = findModByQuill(quill);
    if (!mod) throw new Error('BeyondGrammarModule not found for this Quill instance');
    return mod.toolbarHandler(value)
  }
}

export function getQuill () {
  const quill: Quill = (window as any)['Quill'] as any;
  if (!quill) throw new Error('window.quill is empty');
  return quill as any
}

export function ensureLoadGrammarChecker (): Promise<IGrammarCheckerConstructor> {
  return loadScriptIfNeeded(settings.service.sourcePath)
  .then(() => {
    const apiRoot = (window as any)['BeyondGrammar'];

    if (!apiRoot || !apiRoot['GrammarChecker']) {
      throw new Error('API is not setup at window["BeyondGrammar"]');
    }

    return (window as any)['BeyondGrammar']['GrammarChecker'] as IGrammarCheckerConstructor
  })
}

export function initBeyondGrammarForQuillInstance (quillInstance: Quill): Promise<IGrammarChecker> {
  const $editor = quillInstance.root;

  return ensureLoadGrammarChecker()
  .then(GrammarChecker => {
    // Note: hayt bundle is likely to overwrite `widnow.BeyondGrammar`,
    // so re-export API after hayt script is loaded
    makeExports();

    let passedOptions = (<any>quillInstance).options.modules.beyondgrammar;
    if( !passedOptions ){
      passedOptions = {};
    }

    const checker: IGrammarChecker = new GrammarChecker($editor, <IServiceSettings> {
      ...settings.service,
      ...passedOptions.service,
      wrapperOptions: {
        apiDecorators: {
          setCursorAtEndOfElement: ($el: Element, api: Record<string, Function>): any => {
            const { start, end } = textRangeInAncestor($el, $editor);

            // Note: Quill tries to normalize html whenever there is any html change,
            // This makes the PWA internal setCursor not working any more
            // So have to use the Quill:setSelection API, and add some delay here
            setTimeout(() => {
              quillInstance.setSelection(end, 0)
            }, 100)
          },
          withSelectionPreserved: (win: Window, saveSelection: boolean, fn: () => any): any => {
            const { index, length } = quillInstance.getSelection(true);

            try {
              fn()
            } catch (e) {
              console.warn(e)
            } finally {
              setTimeout(() => {
                quillInstance.setSelection(index, length)
              }, 0)
            }
          }
        }
      }
    });

    checker.setSettings({
      ...settings.grammar,
      ...passedOptions.grammar
    });

    return checker.init()
    .then(() => checker.activate())
    .then(() => rebuildLanguagePicker(quillInstance, checker))
    .catch(e => console.warn(e))
    .then(() => checker)
  })
}

export function rebuildLanguagePicker (quillInstance: Quill, checker: IGrammarChecker) {
  // Note: There seems to be no official API to get toolbar from quill instance
  const getToolbarContainer = (quillInstance: Quill): HTMLElement => {
    const $container = quillInstance.root.parentElement as HTMLElement;
    return $container.previousElementSibling as HTMLElement;
  };

  const getLanguageSelect = ($toolbar: HTMLElement): HTMLSelectElement => {
    return $toolbar.querySelector('select.ql-beyondgrammar') as HTMLSelectElement;
  };

  const createOption = (value: string, label: string) => {
    const $option = document.createElement('option');

    $option.setAttribute('value', value);
    $option.innerText = label;

    return $option;
  };

  const insertStyle = (cssText: string) => {
    const $style  = document.createElement('style');
    const $parent = document.head || document.body || document.documentElement;

    $style.innerHTML = cssText;
    $parent.appendChild($style);
  };

  const insertLanguageLabelStyles = (languages: ILanguage[]) => {
    const text = languages
      .filter(lang => lang.isEnabled)
      .map(lang => {
        return `
          .ql-beyondgrammar.ql-picker .ql-picker-label[data-bg-value="${lang.isoCode}"]::before,
          .ql-beyondgrammar.ql-picker .ql-picker-options .ql-picker-item[data-value="${lang.isoCode}"]::before {
            content: "${lang.displayName.replace(/"/g, '\\"')}";
          }
        `
      })
      .join('\n');

    insertStyle(text);
  };

  // Note: No official API to dynamically change select/picker.
  // refer to:
  // * https://codepen.io/DmitrySkripkin/pen/EoLyBJ
  // * https://github.com/quilljs/quill/blob/develop/themes/base.js
  // * https://github.com/quilljs/quill/blob/develop/ui/picker.js
  const rebuildSelectWithLanugages = ($select: HTMLSelectElement, languages: ILanguage[]) => {
    const oldOptionsCount = $select.childNodes.length;
    const $default = document.createElement('option');
    $default.setAttribute('selected', 'selected');
    $select.appendChild($default);

    languages
    .filter(lang => lang.isEnabled)
    .forEach(lang => {
      $select.appendChild(
        createOption(lang.isoCode, lang.displayName)
      )
    });

    Array.from($select.childNodes)
    .slice(0, oldOptionsCount)
    .forEach(node => node.remove());

    // TODO: insert <style>
    return $select
  };

  const removeOldPickerElement = ($toolbar: HTMLElement) => {
    const $picker = $toolbar.querySelector('.ql-beyondgrammar.ql-picker');
    $picker && $picker.remove();
  };

  const showNewPickerElement = ($toolbar: HTMLElement) => {
    const $picker = $toolbar.querySelector('.ql-beyondgrammar.ql-picker');
    if (!$picker)  return;
    $picker.removeAttribute('style')
  };

  const $toolbar  = getToolbarContainer(quillInstance);
  const $select   = getLanguageSelect($toolbar);
  const languages = checker.getAvailableLanguages();
  const quill     = getQuill();
  const icons     = quill.import('ui/icons');

  rebuildSelectWithLanugages($select, languages);
  insertLanguageLabelStyles(languages);

  // Note: Quill's buildPickers seems to work on next tick, so delay a little bit to process DOM elements
  setTimeout(() => {
    removeOldPickerElement($toolbar);
    showNewPickerElement($toolbar);
  }, 50)

  ;((<any>quillInstance).theme as any).buildPickers(
    Array.from(
      $toolbar.querySelectorAll('select')
    ),
    icons
  )
}

export function registerBlots (): void {
  const quill   = getQuill();
  const Inline  = quill.import('blots/inline');

  const initPWABlots = () => {
    class PWAInline extends Inline {}

    PWAInline.tagName   = 'pwa';
    PWAInline.blotName  = 'pwa-inline';
    PWAInline.className = 'pwa-mark';

    quill.register(PWAInline)
  };

  const initRangyBlots = () => {
    class RangySelectionBoundaryInline extends Inline {}

    RangySelectionBoundaryInline.tagName   = 'span';
    RangySelectionBoundaryInline.blotName  = 'rangy-selection-boundary-inline';
    RangySelectionBoundaryInline.className = 'rangySelectionBoundary';

    quill.register(RangySelectionBoundaryInline)
  };

  initPWABlots();
  initRangyBlots();
}

export function registerModule () {
  getQuill().register('modules/beyondgrammar', BeyondGrammarModule)
}

export function initBeyondGrammar () {
  registerBlots();
  registerModule();
}

export function getCleanInnerHTML ($editor: HTMLElement): string {
  const $cloned   = $editor.cloneNode(true) as HTMLElement;
  const $pwaList  = $cloned.querySelectorAll('pwa');

  Array.from($pwaList).forEach($pwa => {
    $pwa.replaceWith(
      document.createTextNode($pwa.textContent as string)
    )
  });

  return $cloned.innerHTML
}

export function makeExports () {
  exportToNamespace(window, 'BeyondGrammar', {
    initBeyondGrammar,
    getToolbarHandler,
    getCleanInnerHTML
  })
}

makeExports();
