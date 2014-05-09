module.exports =
  imagemin:
    options:
      force: true
    expand: true
    cwd: 'src/'
    src: ['**/*.disabled'] #{png,jpg,gif,jpeg,svn}
    dest: 'dist/raw/'
  watch:
    files: ['src/**/*.disabled'] #{png,jpg,gif,jpeg,svn}
    tasks: ['newer:imagemin:img']