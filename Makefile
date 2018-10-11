default: build

config/secret.json:
	[ ! -f config/secret.json ] && cp config/secret.template.json config/secret.json

node_modules:
	yarn

flow-typed: node_modules
	./node_modules/.bin/flow-typed install

dev: build lint type test

run: node_modules config/secret.json
	./node_modules/.bin/nodemon ./dist/src/app.js --watch dist -e js \
	| ./node_modules/.bin/bunyan

type: node_modules
	./node_modules/.bin/flow status

test: node_modules
	./node_modules/.bin/jest

lint: node_modules
	./node_modules/.bin/eslint src test

clean:
	rm -rf dist

watch:
	@which watchman-make > /dev/null || ( echo 'install watchman' && exit 1 )
	watchman-make \
		-p 'src/**/*.js' 'src/*.js' 'test/**/*.js' 'test/*.js' -t dev

build: node_modules
	./node_modules/.bin/babel src --out-dir dist/src --source-maps inline
	cp ./package.json ./dist/.

.PHONY: clean default run lint build test watch ci
