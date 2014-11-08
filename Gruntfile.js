module.exports = function(grunt) {
    var sourceDir = 'site/resources/',
        buildDir = 'site/build/';

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        
        //Compile sass to css
        sass: {
            dist: {
                files: [{
                    src: [
                        sourceDir + 'styles/**/*.scss'
                    ],
                    dest: buildDir + 'css/main.css'
                }]
            } 
        },

        //Watch files for changes, then run given task
        watch: {
            sass: {
                files: [sourceDir + 'styles/**/*.scss'],
                tasks: ['sass', 'concat:css']
            } 
        },
        
        concat: {
            options: {
                separator: ';',
            },
            js: {
                files: [{
                    src: [
                        sourceDir + '/js/lib/jquery-1.11.1.js',
                        sourceDir + '/js/lib/jquery-ui.min.js',  
                        sourceDir + '/js/lib/bootstrap.min.js',  
                        sourceDir + '/js/lib/handlebars-v1.3.0.js',  
                        sourceDir + '/js/lib/handlebars-helpers.js',  
                        sourceDir + '/js/lib/underscore.js',  
                        sourceDir + '/js/lib/backbone.js',
                        sourceDir + '/js/app/models/slot.js',
                        sourceDir + '/js/app/collections/slots.js',
                        sourceDir + '/js/app/views/cal-view.js',
                        sourceDir + '/js/app/views/dashboard-view.js',
                        sourceDir + '/js/app/views/month-view.js',
                        sourceDir + '/js/app/views/day-view.js',
                        sourceDir + '/js/app/views/booking-view.js',
                        sourceDir + '/js/app/views/slot-view.js',
                        sourceDir + '/js/app/views/detail-view.js',
                        sourceDir + '/js/app/views/cancel-all-view.js'

                    ],
                    dest: buildDir + 'js/main.js', 
                },
                {
                    src: [
                        sourceDir + '/js/cal-public/**/*.js'
                    ],
                    dest: buildDir + 'js/cal-public.js', 
                },
                {
                    src: [
                        sourceDir + '/js/cal-private/**/*.js'
                    ],
                    dest: buildDir + 'js/cal-private.js', 
                }]
            },
            css: {
                files: [{
                    src: [
                        sourceDir + 'styles/vendor/bootstrap-theme.min.css',
                        sourceDir + '/styles/vendor/bootstrap.min.css',
                        sourceDir + '/styles/vendor/jquery-ui.min.css',
                        sourceDir + '/styles/vendor/jquery-ui.structure.min.css',
                        sourceDir + '/styles/vendor/jquery-ui.theme.min.css',
                        sourceDir + '/styles/vendor/normalize.css',
                        '<%= sass.dist.files[0].dest %>'
                    ],
                    dest: 'site/build/css/main.css'
                }]
            }
        },

        uglify: {
            options: {
                compress: {
                    drop_console: true
                }
            },
            dist: {
                files: [
                    {
                        src: '<%= concat.js.files[0].dest %>',
                        dest: buildDir + 'js/main.js'
                    },
                    {
                        src: '<%= concat.js.files[1].dest %>',
                        dest: buildDir + 'js/cal-public.js'
                    },
                    {
                        src: '<%= concat.js.files[2].dest %>',
                        dest: buildDir + 'js/cal-private.js'
                    }
                ]

            }
        },

        //Copy source files to build dir
        copy: {
            dist: {
                files: [{
                    expand: true,
                    cwd: sourceDir + 'images/',
                    src: [
                        '**/*.jpg',
                        '**/*.png',
                        '**/*.gif',
                        '**/*.svg'
                    ],
                    dest: buildDir + 'images/'
                }]
            },
            fonts: {
                files: [{
                    expand: true,
                    cwd: sourceDir + 'fonts/',
                    src: [
                        '*.eot','*.svg','*.otf','*.woff','*.ttf'
                    ],
                    dest: buildDir + 'fonts/',
                }]
            },
        }        
    });
    
    //Load Grunt plugins
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-sass');
    grunt.loadNpmTasks('grunt-contrib-watch');

    grunt.registerTask('default',['sass', 'concat', 'copy', 'watch']);
}