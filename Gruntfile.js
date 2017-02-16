module.exports = function(grunt) {
  grunt.initConfig({
    jasmine : {
      src : [
        'src/decent.js',
        'src/**/*.js'
      ],
      options: {
        specs : 'spec/**/*spec.js',
        helpers: [
          'spec/helpers/jquery-2.1.1.min.js',
          'spec/helpers/*.js'
        ]
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-jasmine');

  // Default task.
  grunt.registerTask('default', ['jasmine']);
}
