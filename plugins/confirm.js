const getConfirm = (app) => (props) => {
  if (typeof props !== 'object') {
    props = {text: props}
  }
  if (window.layout && window.layout.$refs && window.layout.$refs.dialog) {
    window.layout.$refs.dialog.confirm(props)
  }
  return new Promise((resolve, reject) => {
    props.onConfirm = () => resolve()
    if (props.catch) {
      props.onCancel = () => reject(new Error('cancel'))
    }
  })
}

const getAlert = (app) => (props) => {
  if (typeof props !== 'object') {
    props = {text: props}
  }
  props.isAlert = true
  return getConfirm(app)(props)
}

export default (ctx, inject) => {
  inject('confirm', getConfirm(ctx.app))
  inject('alert', getAlert(ctx.app))
}
