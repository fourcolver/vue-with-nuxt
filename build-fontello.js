const fs = require('fs')
const config = require('fontello-webpack-plugin/src/config')
const Fontello = require('fontello-webpack-plugin/src/Fontello')
const Css = require('fontello-webpack-plugin/src/Css')

const options = {
  config: require('./fontello.config.json'),
  name: 'quwi-font',
  staticName: 'quwi-font',
  cssPath: './assets/css',
  fontsPath: './assets/fonts'
}

const fontelloConfig = config(options)

const fontello = new Fontello(fontelloConfig)

fontello.assets().then(sources => {
  const fontFile = ext => (
    'quwi-font.[ext]'.replace(/\[ext\]/g, ext)
  )
  const cssRelativePath = ext => `../fonts/${fontFile(ext)}`
  const cssContent = new Css(fontelloConfig, cssRelativePath)
  if (cssContent) {
    fs.writeFile(`${options.cssPath}/${options.staticName}.css`, cssContent.source(), function (err) {
      if (err) {
        return console.log('Saving css error', err)
      }
    })
  }

  const fontFiles = sources
  for (const ext in fontFiles) {
    fs.writeFile(`${options.fontsPath}/${options.staticName}.${ext}`, fontFiles[ext].source(), function (err) {
      if (err) {
        return console.log('Saving font error', err)
      }
    })
  }
})
