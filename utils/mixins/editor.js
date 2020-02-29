export default {
  methods: {
    editorPasteImage (id, pasteData, cancelUploadFlag) {
      switch (pasteData.pasteType) {
        case this.$refs.editor.imagePasteTypes.IMAGE_SRC:
          this.pasteImageSrc(id, pasteData)
          break
        case this.$refs.editor.imagePasteTypes.IMAGE_UPLOAD:
          this.pasteImageUpload(id, pasteData.data, pasteData.params, cancelUploadFlag)
          break
        case this.$refs.editor.imagePasteTypes.IMAGE_BASE64:
          this.pasteImageBase64(id, pasteData)
          break
      }
    },
    async editorUpdateImage (id, pasteData) {
      try {
        const result = await this.$api.post('comments/create-attachments', pasteData.data)
        const file = result.data.comment_files[0]
        const imgUrl = file.info.medium.url
        const originalUrl = file.info.file.url
        this.$refs.editor.updateImage({src: imgUrl, original: originalUrl}, id, file.id)
      } catch (e) {
      }
    },
    async pasteImageBase64 (id, pasteData) {
      this.$refs.editor.editor.saveText()
      try {
        const result = await this.$api.post('comments/create-attachments-base64', pasteData.data)
        const file = result.data.comment_file
        const imgUrl = file.info.medium.url
        const originalUrl = file.info.file.url
        this.$refs.editor.insertImage({src: imgUrl, original: originalUrl}, id, file.id)
      } catch (e) {
        this.$refs.editor.insertImageError(id, this.$t('Unable to upload file'))
      }
    },
    async pasteImageUpload (id, formData, params, cancelUploadFlag) {
      try {
        const result = await this.$api.post('comments/create-attachments', formData, params, cancelUploadFlag)
        const file = result.data.comment_files[0]
        let imgUrl = file.info.file.url
        let originalUrl = file.info.file.url
        if (file.info.medium) {
          imgUrl = file.info.medium.url
        }
        this.$refs.editor.insertImage({src: imgUrl, original: originalUrl}, id, file.id)
      } catch (e) {
        if (e.message) {
          this.$refs.editor.removeProgressScreen(id)
        } else {
          this.$refs.editor.insertImageError(id, this.$t('Unable to upload file'))
        }
      }
    },
    async editorPasteFile (id, name, formData, params, cancelUploadFlag) {
      try {
        const result = await this.$api.post('comments/create-attachments', formData, params, cancelUploadFlag)
        const file = result.data.comment_files[0]
        const fileUrl = file.info.file.url
        this.$refs.editor.insertFile(name, id, file.id, fileUrl)
      } catch (e) {
        if (e.message) {
          this.$refs.editor.removeProgressScreen(id)
        } else {
          this.$refs.editor.insertFileError(id, this.$t('Unable to upload file'))
        }
      }
    },
    async editorPasteVideo (id, formData, params, cancelUploadFlag) {
      try {
        const result = await this.$api.post('comments/create-attachments', formData, params, cancelUploadFlag)
        const file = result.data.comment_files[0]
        const fileUrl = file.info.file.url
        const thumbUrl = file.info.medium.url
        this.$refs.editor.insertVideo({ src: fileUrl, thumb: thumbUrl, mimeType: file.mime_type }, id, file.id)
      } catch (e) {
        if (e.message) {
          this.$refs.editor.removeProgressScreen(id)
        } else {
          this.$refs.editor.insertVideoError(id, this.$t('Unable to upload file'))
        }
      }
    },
    editorAddCustomColor (color) {
      let userColors = this.$store.state.editorCustomColors
      userColors.unshift({ code: color })
      if (userColors.length > 10) {
        userColors = userColors.slice(1, 11)
      }
      this.$store.dispatch('updateUserSettings', { editor_custom_colors: userColors })
    }
  },
  computed: {
    editorCustomColors () {
      return this.$store.state.editorCustomColors.map((c) => c.code)
    }
  }
}
