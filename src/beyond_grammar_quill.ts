import Quill, { RangeStatic } from 'quill'
import { IGrammarChecker, IGrammarCheckerConstructor } from './interfaces/IGrammarChecker'
import { IServiceSettings } from './interfaces/IServiceSettings';

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

export function exportToNamespace (root: Object, ns: string, api: Record<string, any>): void {
  const namespace = ns.split('.').reduce((prev: any, key: string) => {
    prev[key] = prev[key] || {}
    return prev[key]
  }, root as any)


  Object.assign(namespace, api)
}

export function loadScript (src: string): Promise<HTMLScriptElement> {
  return new Promise((resolve, reject) => {
    const $script   = document.createElement("script")

    $script.onload  = () => resolve($script)
    $script.onerror = () => reject(new Error(`Failed to load`))
    $script.src     = src

    document.body.appendChild($script)
  })
}

export const loadScriptIfNeeded = (() => {
  const cache: Record<string, Promise<HTMLScriptElement>> = {}

  return (src: string): Promise<HTMLScriptElement>  => {
    if (cache[src]) return cache[src]

    const p = loadScript(src)
    cache[src] = p

    return p
  }
})()

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

function textContentLength ($el: Node) {
  return ($el.textContent || '').length
}

function isBlockElement ($el: Node) {
  const blockRegex = /^(address|blockquote|body|center|dir|div|dl|fieldset|form|h[1-6]|hr|isindex|menu|noframes|noscript|ol|p|pre|table|ul|dd|dt|frameset|li|tbody|td|tfoot|th|thead|tr|html)$/i
  return blockRegex.test($el.nodeName)
}

function textRangeInParent ($el: Element): { start: number, end: number } {
  const $parent = $el.parentElement
  if (!$parent) return { start: -1, end: -1 }

  const start = (() => {
    const nodes = Array.from($parent.childNodes)
    let start   = 0

    for (let i = 0, len = nodes.length; i < len; i++) {
      if (nodes[i] === $el) return start
      start += textContentLength(nodes[i]) + (isBlockElement(nodes[i]) ? 1 : 0)
    }

    return -1
  })()

  return {
    start,
    end:  start + textContentLength($el)
  }
}

function textRangeInAncestor ($el: Element, $ancestor: Element): { start: number, end: number } {
  const range = { start: 0, end: 0 }
  let $node   = $el

  while ($node && $node !== $ancestor) {
    const r = textRangeInParent($node)

    if (r.start === -1) return { start: -1, end: -1 }
    if ($node === $el) {
      range.start = r.start
      range.end   = r.end
    } else {
      range.start += r.start
      range.end   += r.start
    }

    $node = $node.parentElement as Element
  }

  return range
}

export function initBeyondGrammarForQuillInstance ($editor: HTMLElement, quillInstance: Quill): Promise<void> {
  return ensureLoadGrammarChecker()
  .then(GrammarChecker => {
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

exportToNamespace(window, 'BeyondGrammar', {
  initBlots,
  initBeyondGrammarForQuillInstance
})
