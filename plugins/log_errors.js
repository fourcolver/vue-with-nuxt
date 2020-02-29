export default ({app}) => {
  window.addEventListener('error', e => {
    try {
      window.burgerError = e
      let err = e.error
      let errorObj = {
        columnNumber: err.columnNumber,
        fileName: err.fileName,
        lineNumber: err.lineNumber,
        message: err.message,
        stack: err.stack.split('\n')
      }
      let msg = JSON.stringify(errorObj, null, '\t')
      if (process.env.NODE_ENV === 'production') {
        app.$api.post('tech/log', {msg})
      }
    } catch (e) {
      console.log('Error in error handler')
      console.log(e)
    }
  })
}
