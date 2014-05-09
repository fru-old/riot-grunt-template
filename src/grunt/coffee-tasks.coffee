
module.exports =
  coffee:
    options:
      bare: true
      force: true # needs to be added to the plugin
    expand: true
    cwd: 'src/'
    src: ['**/*.coffee', '**/*.litcoffee', '!grunt/**']
    dest: 'dist/raw/'
    ext: '.js'
  coffeelint:
    options:
      force: true
    expand: true
    cwd: 'src/'
    src: ['**/*.coffee', '**/*.litcoffee', '!grunt/**']
  watch:
    files: ['src/**/*.coffee', 'src/**/*.litcoffee']
    tasks: ['newer:coffeelint:coffee', 'newer:coffee:coffee', 'newer:wrap:js', 'newer:concat:js', 'newer:uglify:js' ] 

  
