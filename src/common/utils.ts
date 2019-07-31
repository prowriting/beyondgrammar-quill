
export function exportToNamespace (root: Object, ns: string, api: Record<string, any>): void {
  const namespace = ns.split('.').reduce((prev: any, key: string) => {
    prev[key] = prev[key] || {};
    return prev[key]
  }, root as any);


  Object.assign(namespace, api)
}

export function loadScript (src: string): Promise<HTMLScriptElement> {
  return new Promise((resolve, reject) => {
    const $script   = document.createElement("script");

    $script.onload  = () => resolve($script);
    $script.onerror = () => reject(new Error(`Failed to load`));
    $script.src     = src;

    document.body.appendChild($script)
  })
}

export const loadScriptIfNeeded = (() => {
  const cache: Record<string, Promise<HTMLScriptElement>> = {};

  return (src: string): Promise<HTMLScriptElement>  => {
    if (cache[src]) return cache[src];

    const p = loadScript(src);
    cache[src] = p;

    return p
  }
})();


export function textContentLength ($el: Node) {
  return ($el.textContent || '').length
}

export function isBlockElement ($el: Node) {
  const blockRegex = /^(address|blockquote|body|center|dir|div|dl|fieldset|form|h[1-6]|hr|isindex|menu|noframes|noscript|ol|p|pre|table|ul|dd|dt|frameset|li|tbody|td|tfoot|th|thead|tr|html)$/i;

  let test = blockRegex.test($el.nodeName);
  if( !test ) {
    console.log($el.nodeName);
  }
  return blockRegex.test($el.nodeName)
}

export function textRangeInParent ($el: Element): { start: number, end: number } {
  const $parent = $el.parentElement;
  if (!$parent) return { start: -1, end: -1 };

  const start = (() => {
    const nodes = Array.from($parent.childNodes);
    let start   = 0;
    for (let i = 0, len = nodes.length; i < len; i++) {
      if (nodes[i] === $el) return start;
      start += textContentLength(nodes[i]) + (isBlockElement(nodes[i]) ? 1 : 0);
    }

    return -1
  })();

  return {
    start,
    end:  start + textContentLength($el)
  }
}

export function textRangeInAncestor ($el: Element, $ancestor: Element): { start: number, end: number } {
  const range = { start: 0, end: 0 };
  let $node   = $el;

  while ($node && $node !== $ancestor) {
    const r = textRangeInParent($node);

    if (r.start === -1) return { start: -1, end: -1 };
    if ($node === $el) {
      range.start = r.start;
      range.end   = r.end;
    } else {
      range.start += r.start;
      range.end   += r.start;
    }

    $node = $node.parentElement as Element
  }

  return range
}

/**
 * Getting real counts of chars in target from start to range
 * @param target
 * @param range
 * @returns {number}
 */
export function getGlobalRangePosition( target : HTMLElement, range : Range ) : number {
  let doc : Document = <Document>target.ownerDocument;
  let nodeRange = doc.createRange();
  nodeRange.selectNode( target );
  if(
    nodeRange.compareBoundaryPoints( Range.START_TO_START, range ) <= 0 &&
    nodeRange.compareBoundaryPoints( Range.END_TO_END, range) >= 0
  ) {

    let walkerStoped = false;
    //Creating tree walker for walk over only text nodes and placed only before range
    let filter = function( node : HTMLElement ) {
      if(walkerStoped) {
        return NodeFilter.FILTER_REJECT;
      }

      // @ts-ignore
      let nodeLen = node.textContent.length;

      if((<any>range).comparePoint) {
        walkerStoped = (<any>range).comparePoint(node, nodeLen) != -1;
      } else {
        nodeRange.selectNode(node);
        walkerStoped = nodeRange.compareBoundaryPoints(Range.END_TO_END, range) >= 1;
      }

      if(!walkerStoped) {
        charCount += nodeLen;
      }

      return !walkerStoped ?
        NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
    };

    // @ts-ignore
    filter['acceptNode'] = filter;

    // @ts-ignore
    let treeWalker : TreeWalker = doc.createTreeWalker( target, NodeFilter.SHOW_TEXT, <any>filter, false );

    //calculating char count
    let charCount : number = 0;
    while (treeWalker.nextNode()) {
    }
    if (range.startContainer.nodeType == 3) {
      charCount += range.startOffset;
    }

    return charCount;
  }

  return -1;
}

/**
 * Getting Range points to global position in target element
 * @param target
 * @param globalPosition
 * @returns {null}
 */
export function getRangeByGlobalPosition( target : HTMLElement, globalPosition : number ) : Range{
  let doc = <Document>target.ownerDocument;

  let treeWalker :TreeWalker = doc.createTreeWalker(target, NodeFilter.SHOW_TEXT, <any>(()=>NodeFilter.FILTER_ACCEPT), true);

  let newRange = doc.createRange();
  let gc = globalPosition;
  do{
    let node = treeWalker.currentNode;
    if(node == target)continue;
    let text = <string>node.nodeValue;
    if(text.length < gc) {
      gc -= text.length;
    } else {
      newRange.setStart(node, gc);
      newRange.setEnd(node, gc);
      break;
    }
  }while( treeWalker.nextNode() );

  return newRange;
}

export function setGlobalCursorPosition( target: HTMLElement,  pos :number ) : void {

  if( pos == -1 ) return;

  let doc = <Document>target.ownerDocument;
  let win = <Window>doc.defaultView;
  let selection = win.getSelection();

  let cursorPositionAfterAction = getRangeByGlobalPosition(target, pos );
  selection.removeAllRanges();
  selection.addRange( cursorPositionAfterAction );
}
