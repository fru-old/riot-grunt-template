module.exports =
  stylus:
    options: { compress: false },
    expand: true
    cwd: 'src/'
    src: ['**/*.styl']
    dest: 'dist/raw/'
    ext: '.css'
  copy:
    expand: true
    cwd: 'src/'
    src: ['**/*.css']
    dest: 'dist/raw/'
  cssUrlEmbed:
    expand: true,
    cwd: 'dist/raw'
    src: [ '**/*.css' ]
    dest: 'dist/dev'
  cssmin:
    files:
      'dist/style.css': ['dist/dev/**/*.css']
  watch:
    files: ['src/**/*.{css,styl}']
    tasks: ['newer:copy:css', 'newer:stylus:css', 'newer:cssUrlEmbed:css', 'newer:cssmin:css']