
module.exports =
  coffee:
    options:
      bare: true
      force: true # needs to be added to the plugin
    expand: true
    cwd: 'test/'
    src: ['**/*.coffee', '**/*.litcoffee']
    dest: 'test/'
    ext: '.js'
  watch:
    files: ['test/**/*.coffee', 'test/**/*.js']
    tasks: ['newer:coffee:test'] 
    options:
      spawn: false	# significant speedup
      livereload:
        port: 35720