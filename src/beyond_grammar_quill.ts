import Quill from 'quill'
import { IGrammarChecker, IGrammarCheckerConstructor } from './interfaces/IGrammarChecker'

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

export function initBeyondGrammarForQuillInstance ($quillEl: HTMLElement): Promise<void> {
  return ensureLoadGrammarChecker()
  .then(GrammarChecker => {
    const checker: IGrammarChecker = new GrammarChecker($quillEl, settings.service)

    checker.setSettings(settings.grammar);
    checker.init()
    .then(() => checker.activate())
  })
}

exportToNamespace(window, 'BeyondGrammar', {
  initBeyondGrammarForQuillInstance
})
