import Quill, { RangeStatic } from 'quill'
import { IGrammarChecker, IGrammarCheckerConstructor } from './interfaces/IGrammarChecker'
import { IServiceSettings } from './interfaces/IServiceSettings'
import { textRangeInAncestor, loadScriptIfNeeded, exportToNamespace, traverseInDOM } from './common/utils'

const settings = {
  service: {
    apiKey:       "E8FEF7AE-3F36-4EAF-A451-456D05E6F2A3",
    // sourcePath:   '//cdn.prowritingaid.com/beyondgrammar/release/dist/hayt/bundle.js',
    sourcePath:   'http://localhost:8080/bundle.js?r=' + Math.random(),
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
}

export type QuillBeyondGrammarOptions = {

}

export interface ModuleType {
  new(quill: Quill, options: QuillBeyondGrammarOptions): any
}

export function ensureLoadGrammarChecker (): Promise<IGrammarCheckerConstructor> {
  return loadScriptIfNeeded(settings.service.sourcePath)
  .then(() => {
    const apiRoot = (window as any)['BeyondGrammar']

    if (!apiRoot || !apiRoot['GrammarChecker']) {
      throw new Error('API is not setup at window["BeyondGrammar"]')
    }

    return (window as any)['BeyondGrammar']['GrammarChecker'] as IGrammarCheckerConstructor
  })
}

export function initBeyondGrammarForQuillInstance ($editor: HTMLElement, quillInstance: Quill): Promise<void> {
  return ensureLoadGrammarChecker()
  .then(GrammarChecker => {
    // Note: hayt bundle is likely to overwrite `widnow.BeyondGrammar`,
    // so re-export API after hayt script is loaded
    makeExports()

    const checker: IGrammarChecker = new GrammarChecker($editor, <IServiceSettings> {
      ...settings.service,
      wrapperOptions: {
        apiDecorators: {
          setCursorAtEndOfElement: ($el: Element, api: Record<string, Function>) => {
            const { start, end } = textRangeInAncestor($el, $editor)

            // Note: Quill tries to normalize html whenever there is any html change,
            // This makes the PWA internal setCursor not working any more
            // So have to use the Quill:setSelection API, and add some delay here
            setTimeout(() => {
              quillInstance.setSelection(end, 0)
            }, 100)
          }
        }
      }
    })

    checker.setSettings(settings.grammar);
    checker.init()
    .then(() => checker.activate())
  })
}

export function initBlots (): void {
  const quill   = (window as any)['Quill'] as any
  const Inline  = quill.import('blots/inline')

  const initPWABlots = () => {
    class PWAInline extends Inline {}

    PWAInline.tagName   = 'pwa'
    PWAInline.blotName  = 'pwa-inline'
    PWAInline.className = 'pwa-mark'

    quill.register(PWAInline)
  }

  const initRangyBlots = () => {
    class RangySelectionBoundaryInline extends Inline {}

    RangySelectionBoundaryInline.tagName   = 'span'
    RangySelectionBoundaryInline.blotName  = 'rangy-selection-boundary-inline'
    RangySelectionBoundaryInline.className = 'rangySelectionBoundary'

    quill.register(RangySelectionBoundaryInline)
  }

  initPWABlots()
  initRangyBlots()
}

export function getCleanInnerHTML ($editor: HTMLElement): string {
  const $cloned   = $editor.cloneNode(true) as HTMLElement
  const $pwaList  = $cloned.querySelectorAll('pwa')

  Array.from($pwaList).forEach($pwa => {
    $pwa.replaceWith(
      document.createTextNode($pwa.textContent as string)
    )
  })

  return $cloned.innerHTML
}

export function makeExports () {
  exportToNamespace(window, 'BeyondGrammar', {
    initBlots,
    initBeyondGrammarForQuillInstance,
    getCleanInnerHTML
  })
}

makeExports()
