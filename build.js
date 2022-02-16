const esbuild = require('esbuild');
const watch = process.argv[2]?.includes('watch');

esbuild.build({
	entryPoints: [ `${__dirname}/src/index.ts` ],
	bundle: true,
	format: 'esm',
	treeShaking: true,
	minify: process.env.NODE_ENV === 'production',
	absWorkingDir: __dirname,
	outbase: `${__dirname}/src`,
	outdir: `${__dirname}/dist`,
	loader: {
		'.ts': 'ts'
	},
	tsconfig: `${__dirname}/tsconfig.json`,
	define: {
		_ENV_: JSON.stringify(process.env.NODE_ENV),
		_DEV_: process.env.NODE_ENV !== 'production',
	},
	watch: watch ? {
		onRebuild(error, result) {
      if (error) console.error('watch build failed:', error);
      else console.log('watch build succeeded:', result);
		},
	} : false,
}).then(result => {
	if (watch) console.log('watching...');
	else console.log('done,', JSON.stringify(result));
});
