// Нърд режим is a client preference on a fully static site: every page
// renders both the plain and the nerd version, and this script marks <html>
// before the first paint so the right one shows without a flash.
// `?nerd=1` or `?nerd=0` in any URL sets it too (handy in a CV link).
export const NERD_KEY = 'onova-nerd'

const script = `(function(){try{var k='${NERD_KEY}',q=new URLSearchParams(location.search).get('nerd');if(q==='1'||q==='0')localStorage.setItem(k,q);if(localStorage.getItem(k)==='1')document.documentElement.setAttribute('data-nerd','')}catch(e){}})()`

export function NerdScript() {
  return <script dangerouslySetInnerHTML={{ __html: script }} />
}
