import { detect } from '~/libs/detect-browser'

export default function ({store, req, redirect}) {
  if (!store.getters['webuser/isGuest']) {
    // eslint-disable-next-line
    const browser = new detect(process.server ? req.headers['user-agent'] : navigator.userAgent)
    if (browser.name && !['chrome', 'firefox', 'edge', 'safari'].includes(browser.name)) {
      return redirect('/unsupported_browser')
    }
  }
}
