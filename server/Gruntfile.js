module.exports = function(grunt) {

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),

        concat: {
            options: {
                separator: '\n'
            },
            js_client: {
                src: [
                    './bower_components/jquery/dist/jquery.min.js',
                    './bower_components/angular/angular.js',
                    './bower_components/angular-ui-router/release/angular-ui-router.js',
                    './bower_components/angular-resource/angular-resource.js',
                    './bower_components/angular-animate/angular-animate.js',
                    './bower_components/angular-flash-alert/dist/angular-flash.js',
                    './bower_components/angular-websocket/dist/angular-websocket.js',
                    './bower_components/draggabilly/dist/draggabilly.pkgd.min.js',
                    './bower_components/humanize-duration/humanize-duration.js',
                    './bower_components/moment/moment.js',
                    './bower_components/angular-timer/dist/angular-timer.min.js',
                    './bower_components/angular-net-sockets/net-sockets.js',
                ],
                dest: './dist/libs.min.js',
            },
            css_client: {
                src: [
                    'less/build.less'
                ],
                dest: './dist/libs.min.css'
            }
        },

        jshint: {
            options: {
                expr: true
            },
            build: ['Grunfile.js', 'js/**/*.js']
        },

        uglify: {
            build: {
                options: {
                    banner: '/*\n <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> \n*/\n',
                    sourceMap: true
                },
                files: {
                    'dist/main.min.js': ['js/app.js', 'js/**/*.js']
                }
            }

        },

        less: {
            build: {
                files: {
                    'dist/main.min.css': "less/build.less"
                }
            }
        },

        imagemin: {
            dynamic: {
                files:
                [{
                    expand: true,
                    cwd: 'img',
                    src: ['**/*.{png,jpg,gif,svg}'],
                    dest: 'dist/img/'
                }]}
            },

            watch: {
                less: {
                    files: ['less/**/*.less'],
                    tasks: ['less']
                },
                js: {
                    files: ['js/*.js', 'js/**/*.js'],
                    tasks: ['jshint', 'uglify']
                },
                imagemin: {
                    files: ['img/**'],
                    tasks: ['imagemin']
                }
            }

        });

        grunt.loadNpmTasks('grunt-contrib-concat');
        grunt.loadNpmTasks('grunt-contrib-jshint');
        grunt.loadNpmTasks('grunt-contrib-uglify');
        grunt.loadNpmTasks('grunt-contrib-imagemin');
        grunt.loadNpmTasks('grunt-contrib-less');
        grunt.loadNpmTasks('grunt-contrib-watch');
        grunt.loadNpmTasks('grunt-notify');

        grunt.registerTask('default', ['jshint', 'uglify', 'less', 'concat', 'imagemin']);
    };
