document.addEventListener('click', e => {
  if (e.target.getAttribute && e.target.getAttribute('data-nuxt-link')) {
    window.$nuxt.$router.push(e.target.getAttribute('data-nuxt-link'))
    e.preventDefault()
  }
})
