import Quill from 'quill'

const settings = {
  service: {
    sourcePath:   '//cdn.prowritingaid.com/beyondgrammar/release/dist/hayt/bundle.js',
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

export function loadScript (src: string): Promise<HTMLScriptElement> {
  return new Promise((resolve, reject) => {
    const $script   = document.createElement("script")

    $script.onload  = () => resolve($script)
    $script.onerror = () => reject(new Error(`Failed to load`))
    $script.src     = src

    document.body.appendChild($script)
  })
}