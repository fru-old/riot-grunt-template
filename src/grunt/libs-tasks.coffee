module.exports =
  concat:
    options:
      separator: '\n'
    src: [
      'libs/requireshim/require_shim.js'
      'libs/xui/xui-2.3.2.js'
      'libs/xui/xui-extensions.js'
      'libs/riot/riot.js'
      'libs/valentine/valentine.js'
    ]
    dest: 'dist/dev/libs.js'
  copy:
    src: [
      'libs/xui/xui-ie-2.3.2.js'
    ]
    dest: 'dist/xui-ie.js'