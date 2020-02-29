export const showUpgradeDialog = ctx => {
  if (ctx.$store.getters['webuser/checkAccess']('disc_space')) {
    return false
  }
  let role = ctx.$store.state.webuser.user.role
  let text = ctx.$t('plan_no_disc_space_' + (role === 'owner' ? 'owner' : 'coder'))
  if (role === 'owner') {
    return ctx.$confirm({
      text,
      noLabel: ctx.$t('plan_dialog.btn_later'),
      yesLabel: ctx.$t('plan_dialog.btn_upgrade_now')
    }).then(() => {
      ctx.$router.push('/upgrade')
    })
  } else {
    return ctx.$alert(text)
  }
}
