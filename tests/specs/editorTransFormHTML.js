import test from 'ava'
import { editorTransformHTML } from '../../utils/editor'

const editorConfig = {
  width: 600,
  minHeight: 150,
  editMarginLeft: 60,
  editMarginRight: 60,
  editMarginTop: 20,
  editorControlsLeftTop: -30,
  maxWidth: 0,
  editorId: 'editor-element',
  isBordered: true,
  recButtonClass: 'c-audio-recorder',
  classNames: {
    editorWrapper: 'quwi-editor',
    borderedModifier: '--bordered',
    editorControls: 'quwi-editor-controls',
    editorControlsLeft: 'quwi-editor-controls--left',
    editorControlsCenter: 'quwi-editor-controls--center',
    editorControlsRight: 'quwi-editor-controls--right',
    editorControlsButtons: 'quwi-editor-controls__buttons',
    editorControlsButtonsWrapper: 'quwi-editor-controls__wrapper',
    editorControlsButtonsControl: 'quwi-editor-controls__control',
    editorControlsButtonsControlBold: 'quwi-editor-controls__control--bold',
    editorControlsButtonsControlItalic: 'quwi-editor-controls__control--italic',
    editorControlsButtonsControlUnderline: 'quwi-editor-controls__control--underline',
    editor: 'quwi-editor__editable-area',
    editableAreaWrapper: 'quwi-editor__editable-area-wrapper',
    fileDivWrapper: 'quwi-editor__file-wrapper',
    fileDivWrapperError: 'quwi-editor__file-wrapper--error',
    fileDiv: 'quwi-editor__file',
    fileLink: 'quwi-editor__file-link',
    fileSpan: 'quwi-editor__file-span',
    fileLoaderWrapper: 'quwi-editor__file-loader-wrapper',
    fileLoaderSpinner: 'quwi-editor__spinner',
    fileRemove: 'quwi-editor__remove-button',
    video: 'quwi-editor__video',
    imgPlaceholder: 'quwi-editor__image-placeholder',
    imgErrorPlaceholder: 'quwi-editor__image-placeholder--error',
    imgWrapper: 'quwi-editor__img-wrapper',
    imgWrapperButton: 'quwi-editor__img-wrapper-button',
    img: 'quwi-editor__img',
    imgCommentWrapper: 'quwi-editor__img-comment-wrapper',
    imgCommentQuote: 'quwi-editor__img-quote',
    imgCommentRemove: 'quwi-editor__img-remove',
    imgRemove: 'quwi-editor__remove-button',
    imgComment: 'quwi-editor__img-comment',
    imgHint: 'quwi-editor__img-hint',
    modal: 'quwi-editor__modal',
    modalContent: 'quwi-editor__modal-content',
    modalClose: 'quwi-editor__modal-close',
    noSelect: 'quwi-editor__no-select',
    uploadButton: 'quwi-editor__upload-button'
  }
}

function macro(t, input, expected) {
  t.log(`Input ${input}`)
  const transformed = editorTransformHTML(editorConfig, input)
  t.log(`Transformed ${transformed}`)
	t.is(transformed, expected)
}

macro.title = (providedTitle = '', input, expected) => `${providedTitle}`.trim();

const brDiv = '<div><br></div>'
const textDiv = '<div>Test</div>'

const fileInput = '<div><div id="7245" contenteditable="false" class="quwi-editor__file quwi-editor__no-select" data-name="no32.txt" data-id="7245" style="width: 95%;"><a class="quwi-editor__file-link" href="https://api.quwi.com/v2/commentsfiles/file/J3CuAEUsiVY6nyBFiukhydpDdj1ABPwX.txt" data-id="7245" target="_blank"><span class="quwi-editor__file-span quwi-editor__no-select">no32.txt</span></a><div class="quwi-editor__remove-button p-delete" contenteditable="false">×</div></div></div>'
const badFileInput = '<div id="7245" contenteditable="false" class="quwi-editor__file quwi-editor__no-select" data-name="no32.txt" data-id="7245" style="width: 95%;"><a class="quwi-editor__file-link" href="https://api.quwi.com/v2/commentsfiles/file/J3CuAEUsiVY6nyBFiukhydpDdj1ABPwX.txt" data-id="7245" target="_blank"><span class="quwi-editor__file-span quwi-editor__no-select">no32.txt</span></a><div class="quwi-editor__remove-button p-delete" contenteditable="false">×</div></div>'
const fileExpected = '<div class="bu-file-wrapper"><a class="bu-file" data-id="7245" href="https://api.quwi.com/v2/commentsfiles/file/J3CuAEUsiVY6nyBFiukhydpDdj1ABPwX.txt">no32.txt</a></div>'

const imageInput = '<div><span id="_e5esr61r6" data-id="7249" contenteditable="false" style="display: unset;"><div class="quwi-editor__img-wrapper" style="position: relative;max-width: 250px !important;margin: 8px auto;" contenteditable="false"><img src="https://api.quwi.com/v2/commentsfiles/medium/wrF_NdRlmIOZSV6nQCtcfOLR0gCkJ54N.jpg" class="quwi-editor__img" data-id="7249" width="250" height="279"></div><div class="quwi-editor__img-comment-wrapper" contenteditable="true" style="display: block; margin: 8px auto; word-break: break-word; max-width: 250px !important;">Test comment</div></span></div>'
const badImageInput = '<span id="_e5esr61r6" data-id="7249" contenteditable="false" style="display: unset;"><div class="quwi-editor__img-wrapper" style="position: relative;max-width: 250px !important;margin: 8px auto;" contenteditable="false"><img src="https://api.quwi.com/v2/commentsfiles/medium/wrF_NdRlmIOZSV6nQCtcfOLR0gCkJ54N.jpg" class="quwi-editor__img" data-id="7249" width="250" height="279"></div><div class="quwi-editor__img-comment-wrapper" contenteditable="true" style="display: block; margin: 8px auto; word-break: break-word; max-width: 250px !important;">Test comment</div></span>'
const imageExpected = '<div class="bu-image-wrapper"><img class="bu-image" data-id="7249" src="https://api.quwi.com/v2/commentsfiles/medium/wrF_NdRlmIOZSV6nQCtcfOLR0gCkJ54N.jpg" width="250" height="279" alt="Screenshot-7249"><div class="bu-image-comment">Test comment</div></div>'

const videoInput = '<div><div id="_ehpqemsnp" contenteditable="false" class="quwi-editor__video" data-id="7247" data-fallback="https://api.quwi.com/v2/commentsfiles/medium/8-FqMY05BvB4U6b3jwWGEAnxU21nAkdq.jpg" style="-moz-user-select: none;"><video width="665" height="380" data-src="https://api.quwi.com/v2/commentsfiles/file/8-FqMY05BvB4U6b3jwWGEAnxU21nAkdq.mp4" loop="" data-reset="0" data-preview="true"><source src="https://api.quwi.com/v2/commentsfiles/file/8-FqMY05BvB4U6b3jwWGEAnxU21nAkdq.mp4" type="video/mp4"></video><div class="quwi-editor__remove-button p-delete quwi-editor__no-select" contenteditable="false">×</div><div class="quwi-editor__play-wrapper"><img class="quwi-editor__play-button" src="/_nuxt/img/playIcon.b2cd537.svg"></div></div></div>'
const badVideoInput = '<div id="_ehpqemsnp" contenteditable="false" class="quwi-editor__video" data-id="7247" data-fallback="https://api.quwi.com/v2/commentsfiles/medium/8-FqMY05BvB4U6b3jwWGEAnxU21nAkdq.jpg" style="-moz-user-select: none;"><video width="665" height="380" data-src="https://api.quwi.com/v2/commentsfiles/file/8-FqMY05BvB4U6b3jwWGEAnxU21nAkdq.mp4" loop="" data-reset="0" data-preview="true"><source src="https://api.quwi.com/v2/commentsfiles/file/8-FqMY05BvB4U6b3jwWGEAnxU21nAkdq.mp4" type="video/mp4"></video><div class="quwi-editor__remove-button p-delete quwi-editor__no-select" contenteditable="false">×</div><div class="quwi-editor__play-wrapper"><img class="quwi-editor__play-button" src="/_nuxt/img/playIcon.b2cd537.svg"></div></div>'
const videoExpected = '<div class="bu-video-wrapper"><video class="bu-video" data-id="7247" width="665" height="380"><source type="video/mp4" src="https://api.quwi.com/v2/commentsfiles/file/8-FqMY05BvB4U6b3jwWGEAnxU21nAkdq.mp4"><a class="bu-video-fallback-link" href="https://api.quwi.com/v2/commentsfiles/file/8-FqMY05BvB4U6b3jwWGEAnxU21nAkdq.mp4"><img class="bu-video-fallback-img" src="https://api.quwi.com/v2/commentsfiles/medium/8-FqMY05BvB4U6b3jwWGEAnxU21nAkdq.jpg" alt="Poster-7247" width="665" height="380"></a></video></div>'

const formattedDiv = '<div><b>test</b> <i>test</i> <u>test</u> <b><i><u>test</u></i></b></div>'
const formattedDivExpected = '<div><span style="font-weight: bold;">test</span> <i>test</i> <u>test</u> <span style="font-weight: bold;"><i><u>test</u></i></span></div>'
const tests = [
  {
    title: 'Should return an empty div for empty input',
    input: brDiv,
    expected: '<div></div>'
  },
  {
    title: 'Should remove empty divs',
    input: '<div>123</div><div></div><div></div><div>123</div>',
    expected: '<div>123</div><div>123</div>'
  },
  {
    title: 'Should deletes last div with br',
    input: `${textDiv}${brDiv}`,
    expected: `${textDiv}`
  },
  {
    title: 'Should correctly transform formatted text',
    input: `${formattedDiv}`,
    expected: `${formattedDivExpected}`
  },
  {
    title: 'Should correctly transform single file',
    input: fileInput,
    expected: fileExpected
  },
  {
    title: 'Should correctly transform single image',
    input: imageInput,
    expected: imageExpected
  },
  {
    title: 'Should correctly transform single video',
    input: videoInput,
    expected: videoExpected
  },
  {
    title: 'Should correctly transform mixed input',
    input: `${textDiv}${formattedDiv}${fileInput}${imageInput}${videoInput}`,
    expected: `${textDiv}${formattedDivExpected}${fileExpected}${imageExpected}${videoExpected}`
  },
  {
    title: 'Should wrap a single text into div',
    input: 'Test',
    expected: textDiv
  },
  {
    title: 'Should wrap a single text with any other elements into div',
    input: `Test${formattedDiv}${fileInput}${imageInput}${videoInput}`,
    expected: `${textDiv}${formattedDivExpected}${fileExpected}${imageExpected}${videoExpected}`
  },
  {
    title: 'Should delete BR last child in DIVS',
    input: '<div>1<br></div><div>2<br></div><div>3<br></div><div><br></div>',
    expected: '<div>1</div><div>2</div><div>3</div>'
  },
  {
    title: 'Should correctly unwrap multiple text nodes inside a div',
    input: '<div>1<br>2<br>3<br></div>',
    expected: '<div>1</div><div>2</div><div>3</div>'
  },
  {
    title: 'Should delete empty divs after text',
    input: `${textDiv}${brDiv}${brDiv}${brDiv}`,
    expected: `${textDiv}`
  },
  {
    title: 'Shouldnt delete line breaks',
    input: `${textDiv}${brDiv}${fileInput}${videoInput}${brDiv}${brDiv}${brDiv}${textDiv}${brDiv}`,
    expected: `${textDiv}${brDiv}${fileExpected}${videoExpected}${brDiv}${brDiv}${brDiv}${textDiv}`
  },
  {
    title: 'Shouldnt delete line breaks after paste multiline text (Chrome)',
    input: '<div><div>123</div><div><br></div><div>456</div></div>',
    expected: '<div>123</div><div><br></div><div>456</div>'
  },
  {
    title: 'Shouldnt delete line breaks after paste multiline text (Firefox)',
    input: '<div>123<div><div>1233</div><div><br></div><div>4563</div></div>456<br></div></div>',
    expected: '<div>123<div><div>1233</div><div><br></div><div>4563</div></div>456</div>'
  },
  {
    title: 'Should correctly transform pasted multiline text (Firefox)',
    input: '<div>line 1<br><br>line 2<br><br>line 3<br></div></div>',
    expected: '<div>line 1</div><div><br></div><div>line 2</div><div><br></div><div>line 3</div>'
  },
  {
    title: 'Should correctly transform lists',
    input: '<ol><li>123<br></li><li>55</li></ol>',
    expected: '<div><ol><li>123<br></li><li>55</li></ol></div>'
  },
  {
    title: 'Should correctly transform unwrapped file loaders input',
    input: `${badFileInput}${badImageInput}${badVideoInput}`,
    expected: `${fileExpected}${imageExpected}${videoExpected}`
  },
  {
    title: 'Should correctly transform unwrapped nodes',
    input: `<span style="font-weight: bold;">Test 1</span><span style="font-style: italic;">Test 2</span>`,
    expected: `<div><span style="font-weight: bold;">Test 1</span><span style="font-style: italic;">Test 2</span></div>`
  }
]

tests.forEach((t) => {
  test(t.title, macro, t.input, t.expected)
})
