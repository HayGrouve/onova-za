// The address people would type: a URL's host, without "www.".
export const domain = (url: string) => new URL(url).host.replace(/^www\./, '')
