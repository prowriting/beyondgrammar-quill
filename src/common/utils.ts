
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


export function textContentLength ($el: Node) {
  return ($el.textContent || '').length
}

export function isBlockElement ($el: Node) {
  const blockRegex = /^(address|blockquote|body|center|dir|div|dl|fieldset|form|h[1-6]|hr|isindex|menu|noframes|noscript|ol|p|pre|table|ul|dd|dt|frameset|li|tbody|td|tfoot|th|thead|tr|html)$/i
  return blockRegex.test($el.nodeName)
}

export function textRangeInParent ($el: Element): { start: number, end: number } {
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

export function textRangeInAncestor ($el: Element, $ancestor: Element): { start: number, end: number } {
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
