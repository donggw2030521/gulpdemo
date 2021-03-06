/**
 * 运行有三种方法：
 * 1、gulp.task('default',[deps])
 * 2、gulp.run([''])或者gulp.start([''])
 * 3、引入runSequence，进行异步控制
 * @type {Gulp|*|exports|module.exports}
 */
var gulp = require('gulp');
var jshint = require('gulp-jshint');//代码检查
var useref = require('gulp-useref');//!!!没懂
var concat = require('gulp-concat');//文件合并
var rename = require('gulp-rename');//重命名

var uglify = require('gulp-uglify');//js代码压缩
var imagemin = require('gulp-imagemin');//图片压缩
var img64 = require('gulp-img64');//图片使用dataUri

var gulpif = require('gulp-if');
var minifyCss = require('gulp-minify-css');//https://github.com/murphydanger/gulp-minify-css或者csso
var csso = require('gulp-csso');//同样是压缩css
var autoprefixer = require('gulp-autoprefixer');

var changed = require('gulp-changed');//只编译stream里的改动的文件

//html压缩用不多
var htmlmin = require('gulp-htmlmin');//https://github.com/jonschlinkert/gulp-htmlmin或者gulp-minify-html
var minifyHTML = require('gulp-minify-html');
var htmlreplace = require('gulp-html-replace');

//版本号控制和重引用很常用
var rev = require('gulp-rev');//re-version重新命名版本
var revReplace = require('gulp-rev-replace');//进行重新命名版本之后的assert的替换.或者gulp-rev-collector
var revCollector = require('gulp-rev-collector');

var filter = require('gulp-filter');//!!!与src的exculde类似


var cache = require('gulp-cache');//缓存
var clean = require('gulp-clean');//删除文件或者文件夹
var sourcemaps = require('gulp-sourcemaps');
var notify = require('gulp-notify');//通知

var watch = require('gulp-watch');
var runSequence = require('run-sequence');
var runGulp = require('run-sequence').use(gulp);
var replace = require('gulp-replace');//替换文件中的字符串
var flatten = require('gulp-flatten');//提取文件到目录
var del = require('del');//删除glob

var
    useref = require('gulp-useref'),
    lazypipe = require('lazypipe');

var plumber = require('gulp-plumber');


gulp.task('delete', function () {
    del('del/**/*.js');
});
gulp.task('testchanged', function () {
    gulp.src('testchanged/*.js')
        .pipe(changed('aaaa'))
        .pipe(gulp.dest('aaaa'));
})


gulp.task('assert', function () {
    var jsFilter = filter('**/*.js', {restore: true});
    var cssFilter = filter('**/*.js', {restore: true});
    var imgFilter = filter('**/*.+(png|jpg)', {restore: true});
    gulp.src('common/**/*.*')
        .pipe(jsFilter)
        .pipe(uglify())
        .pipe(jsFilter.restore)
        .pipe(cssFilter)
        .pipe(csso())
        .pipe(cssFilter.restore)
        .pipe(imgFilter)
        .pipe(imagemin({
            optimizationLevel: 3,
            progressive: true,
            interlaced: true
        }))
        .pipe(imgFilter.restore)
        .pipe(gulp.dest('common/dist'))
})

gulp.task('clean', function () {
    return gulp.src('aaaa', {read: false})
        .pipe(clean());
});

gulp.task('add', ['clean'], function () {
    gulp.src('js/**/*.js')
        .pipe(gulp.dest('aaaa'));
});


gulp.task('img', function () {
    var imgSrc = "image/*.jpg", imgDst = "dist/image";
    var imgRevPath = "rev/image";
    return gulp.src(imgSrc)
        .pipe(imagemin({
            optimizationLevel: 3,
            progressive: true,
            interlaced: true
        }))
        .pipe(rev())
        .pipe(gulp.dest(imgDst))
        .pipe(rev.manifest())
        .pipe(gulp.dest('rev/image'));
});

gulp.task('testuse', function () {

    var jsFilter = filter('**/*.js', {restore: true});
    var cssFilter = filter('**/*.css', {restore: true});
    return gulp.src('testuse.html')
        .pipe(useref())
        .pipe(jsFilter)
        .pipe(uglify())
        .pipe(rev())
        .pipe(jsFilter.restore)
        .pipe(cssFilter)
        .pipe(minifyCss())
        .pipe(rev())
        .pipe(cssFilter.restore)
        .pipe(revReplace())
        .pipe(gulp.dest('testuse'));
})


//filter是把排除的加进来
gulp.task('css', function () {
    var cssSrc = "css/**/*.css", cssDst = "dist/css";
    var cssRevPath = "rev/css";
    var mainfilter = filter(['main.css', 'normalize.css'], {restore: true});
    var hallfilter = filter(['hall_fiml.css', 'a4.css'], {restore: true});
    return gulp.src(cssSrc)
        .pipe(mainfilter)
        .pipe(autoprefixer({
            browsers: ['last 2 versions'],
            cascade: false
        }))
        .pipe(csso())
        .pipe(concat('all.css'))
        .pipe(rev())
        .pipe(gulp.dest('dist/css'))
        .pipe(mainfilter.restore)
        .pipe(hallfilter)
        .pipe(csso())
        .pipe(rev())
        .pipe(gulp.dest('dist/css2'))
        .pipe(hallfilter.restore)
        .pipe(gulp.dest('dist/allCss'));
    //.pipe(rev.manifest())
    //.pipe(gulp.dest('rev/css'))
});


//只是路径的替换,revision的版本能不能rename，适用于revCollector
gulp.task('js', function () {
    return gulp.src(['js/**/*.js'])
        .pipe(plumber())
        .pipe(uglify())
        .pipe(rev())
        .pipe(gulp.dest("dist/js"))
        .pipe(rev.manifest())
        .pipe(plumber.stop())
        .pipe(gulp.dest('rev/js'))

});

//!!!适用于revReplace,更优
//gulp.task('js', function () {
//   return  gulp.src(['js/**/*.js'])
//        .pipe(uglify())
//        .pipe(rev())
//        .pipe(rename(function (path) {
//            path.basename += ".min";
//        }))
//        .pipe(gulp.dest("dist/js"))
//        .pipe(rev.manifest())
//        .pipe(gulp.dest("rev/js"))
//
//});


//使用bower的时候单独提出用到的文件到某目录
gulp.task('testflatten', function () {
    gulp.src('js/**/*.js')
        .pipe(flatten({includeParents: 1}))
        .pipe(gulp.dest('build/js'));
});


//手动替换，类似于htmlreplace
gulp.task('testreplace', function () {
    gulp.src(['test.html'])
        .pipe(replace('js/app.js', 'js/a.js'))
        .pipe(gulp.dest('build'));
});
//可以进行资源文件合并之后重命名
gulp.task('testHtmlReplace', function () {
    gulp.src('index2.html')
        .pipe(htmlreplace({
            'maincss': 'styles.min.css',
            //'js': ['js/bundle1.min.js','js/bundle2.min.js'],

            //js: {
            //    src: [['data-main.js', 'require-src.js']],
            //    tpl: '<script data-main="%s" src="%s"></script>'
            //}

        }, {
            keepUnassigned: true,
            keepBlockTags: true,//是否保持注释
            resolvePaths: false//是否移除没匹配上的
        }))
        .pipe(gulp.dest('build/'));
});

gulp.task("testUsefrf", function () {
    //var jsFilter = filter("**/*.js");
    //var cssFilter = filter("**/*.css");
    //
    //var userefAssets = useref.assets();
    //
    //return gulp.src("src/index.html")
    //    .pipe(userefAssets)      // Concatenate with gulp-useref
    //    .pipe(jsFilter)
    //    .pipe(uglify())             // Minify any javascript sources
    //    .pipe(jsFilter.restore())
    //    .pipe(cssFilter)
    //    .pipe(csso())               // Minify any CSS sources
    //    .pipe(cssFilter.restore())
    //    .pipe(rev())                // Rename the concatenated files
    //    .pipe(userefAssets.restore())
    //    .pipe(useref())
    //    .pipe(revReplace())         // Substitute in new filenames
    //    .pipe(gulp.dest('public'));
});

gulp.task('default', ['dev']);

gulp.task('watch', function () {
    var watcher = gulp.watch('testchanged/**/*.js', ['testchanged']);
    watcher.on('change', function (event) {
        console.log(JSON.stringify(event), 'File ' + event.path + ' was ' + event.type + ', running tasks...');
    });


})


gulp.task('dev', function (done) {
    //runSequence(
    //    //['testreplace', 'testflatten', 'testHtmlReplace', 'testUsefrf'],
    //    ['img', 'css', 'js'],
    //    ['revcollector'],
    //    //['watch'],
    //    //['revreplace'],
    //    done
    //);
    //gulp.run('img',[ 'css', 'js']);

});


//css和js同是reviserion
//gulp.task("revision", function () {
//    return gulp.src(["dist/**/*.css", "dist/**/*.js"])
//        .pipe(rev())
//        .pipe(gulp.dest(opt.distFolder))
//        .pipe(rev.manifest())
//        .pipe(gulp.dest(opt.distFolder))
//})

//更好
gulp.task("revreplace", function () {
    var manifest = gulp.src("rev/**/*.json");

    return gulp.src("index.html")
        .pipe(revReplace({manifest: manifest}))
        .pipe(gulp.dest('testt'));
});

gulp.task('revcollector', function () {
    return gulp.src(['rev/**/*.json', 'index.html'])
        .pipe(revCollector())
        .pipe(gulp.dest('dist/'));

});


