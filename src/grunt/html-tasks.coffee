module.exports =
  jade:
    expand: true
    cwd: 'src/'
    src: ['**/*.jade']
    dest: 'dist/'
    ext: '.html'
  copy:
    expand: true
    cwd: 'src/'
    src: ['**/*.html']
    dest: 'dist/'
  watch:
    files: ['src/**/*.{jade,html}']
    tasks: ['newer:jade:html', 'newer:copy:html']