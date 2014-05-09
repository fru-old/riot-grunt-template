module.exports =
  jade:
    expand: true
    cwd: 'src/'
    src: ['**/*.jade']
    dest: 'dist/dev/'
    ext: '.html'
  copy:
    expand: true
    cwd: 'src/'
    src: ['**/*.html']
    dest: 'dist/dev/'
  watch:
    files: ['src/**/*.{jade,html}']
    tasks: ['newer:jade:html', 'newer:copy:html']