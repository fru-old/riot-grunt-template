module.exports =
  default: [
    'copy:js'
    'jshint:js'
    'coffee:coffee'
    'coffeelint:coffee'
    'copy:css'
    'stylus:css'
    'cssUrlEmbed:css'
    'cssmin:css'
    #'imagemin:img'
    'wrap:js'
    'jade:html'
    'newer:copy:html'
    'concat:js'
    'uglify:js'
    'watch'
  ]
