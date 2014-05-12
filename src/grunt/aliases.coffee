module.exports =
  default: [
    'build'
    'lint'
    'watch'
  ]
  build: [
    'concat:libs'
    'copy:libs'
    'copy:js'
    'coffee:coffee'
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
    'coffee:test'
  ]
  lint: [
    'coffeelint:coffee'
    'jshint:js'
  ]
  test: [
    
  ]
