document.onkeydown = function (e) {
  if (e.target.id !== 'editor-element') {
    e = e || window.event // Get event
    if (!e.ctrlKey) return
    var code = e.which || e.keyCode // Get key code
    if (code === 65) {
      e.preventDefault()
      e.stopPropagation()
    }
  }
}
