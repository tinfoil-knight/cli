const path = require('path')
const process = require('process')

const test = require('ava')
const getPort = require('get-port')

const { createSiteBuilder } = require('../../tests/utils/site-builder')

const { detectServerSettings } = require('./detect-server-settings')

const TARGET_PORT = 1234
const CUSTOM_PORT = 3000

test.before(async (t) => {
  const builder = createSiteBuilder({ siteName: 'site-for-detecting-server' })
  await builder.buildAsync()

  t.context.cwd = process.cwd()

  process.chdir(builder.directory)

  t.context.builder = builder
  t.context.sitePath = builder.directory
})

test.after(async (t) => {
  process.chdir(t.context.cwd)
  await t.context.builder.cleanupAsync()
})

test('serverSettings: minimal config', async (t) => {
  const settings = await detectServerSettings({ framework: '#auto' }, {}, t.context.sitePath, () => {})
  t.is(settings.framework, undefined)
})

test('serverSettings: "#static" as "framework"', async (t) => {
  const settings = await detectServerSettings({ framework: '#static' }, {}, t.context.sitePath, () => {})
  t.is(settings.framework, undefined)
})

test('serverSettings: throw if "port" not available', async (t) => {
  const port = await getPort({ port: 1 })
  await t.throwsAsync(
    detectServerSettings({ framework: '#auto', port }, {}, t.context.sitePath, () => {}),
    { message: /Could not acquire required "port"/ },
  )
})

test('serverSettings: "command" override npm', async (t) => {
  const devConfig = { framework: '#custom', command: 'npm run dev', targetPort: TARGET_PORT }
  const settings = await detectServerSettings(devConfig, {}, t.context.sitePath, () => {})
  t.is(settings.framework, devConfig.framework)
  t.is(settings.command, devConfig.command)
})

test('serverSettings: "command" override yarn', async (t) => {
  const devConfig = { framework: '#custom', command: 'yarn dev', targetPort: TARGET_PORT }
  const settings = await detectServerSettings(devConfig, {}, t.context.sitePath, () => {})
  t.is(settings.framework, devConfig.framework)
  t.is(settings.command, devConfig.command)
})

test('serverSettings: custom framework parameters', async (t) => {
  const devConfig = { framework: '#custom', command: 'yarn dev', targetPort: CUSTOM_PORT, publish: t.context.sitePath }
  const settings = await detectServerSettings(devConfig, {}, t.context.sitePath, () => {})
  t.is(settings.framework, '#custom')
  t.is(settings.command, devConfig.command)
  t.is(settings.targetPort, devConfig.frameworkPort)
  t.is(settings.dist, devConfig.publish)
})

test('serverSettings: set "framework" to "#custom" but no "command"', async (t) => {
  const devConfig = { framework: '#custom', targetPort: CUSTOM_PORT, publish: t.context.sitePath }
  await t.throwsAsync(
    detectServerSettings(devConfig, {}, t.context.sitePath, () => {}),
    { message: /"command" and "targetPort" properties are required when "framework" is set to "#custom"/ },
  )
})

test('serverSettings: set "framework" to "#custom" but no "targetPort"', async (t) => {
  const devConfig = { framework: '#custom', command: 'npm run dev', publish: t.context.sitePath }
  await t.throwsAsync(
    detectServerSettings(devConfig, {}, t.context.sitePath, () => {}),
    { message: /"command" and "targetPort" properties are required when "framework" is set to "#custom"/ },
  )
})

test('serverSettings: set "framework" to "#custom" but no "targetPort" or "command"', async (t) => {
  const devConfig = { framework: '#custom', publish: t.context.sitePath }
  await t.throwsAsync(
    detectServerSettings(devConfig, {}, t.context.sitePath, () => {}),
    { message: /"command" and "targetPort" properties are required when "framework" is set to "#custom"/ },
  )
})

test('serverSettings: "functions" config', async (t) => {
  const devConfig = { framework: '#auto', functions: path.join(t.context.sitePath, 'functions') }
  const settings = await detectServerSettings(devConfig, {}, t.context.sitePath, () => {})
  t.is(settings.functions, devConfig.functions)
})

test('serverSettings: "dir" flag', async (t) => {
  const devConfig = {
    framework: '#auto',
    publish: path.join(t.context.sitePath, 'build'),
    functions: path.join(t.context.sitePath, 'functions'),
  }
  const flags = { dir: t.context.sitePath }
  const settings = await detectServerSettings(devConfig, flags, t.context.sitePath, () => {})
  t.is(settings.functions, devConfig.functions)
  t.is(settings.dist, flags.dir)
  t.is(settings.framework, undefined)
  t.is(settings.command, undefined)
  t.is(settings.useStaticServer, true)
})

test('serverSettings: "dir" flag and "command" as config param', async (t) => {
  const devConfig = {
    framework: '#auto',
    command: 'npm start',
    publish: path.join(t.context.sitePath, 'build'),
    functions: path.join(t.context.sitePath, 'functions'),
  }
  const flags = { dir: t.context.sitePath }
  const settings = await detectServerSettings(devConfig, flags, t.context.sitePath, () => {})
  t.is(settings.command, undefined)
  t.is(settings.useStaticServer, true)
  t.is(settings.dist, flags.dir)
})

test('serverSettings: when no framework is detected', async (t) => {
  const devConfig = {
    framework: '#auto',
    publish: path.join(t.context.sitePath, 'build'),
    functions: path.join(t.context.sitePath, 'functions'),
  }
  const settings = await detectServerSettings(devConfig, {}, t.context.sitePath, () => {})
  t.is(settings.functions, devConfig.functions)
  t.is(settings.dist, devConfig.publish)
  t.is(settings.framework, undefined)
  t.is(settings.command, undefined)
  t.is(settings.useStaticServer, true)
})

test('serverSettings: no config', async (t) => {
  const devConfig = { framework: '#auto' }
  const settings = await detectServerSettings(devConfig, {}, t.context.sitePath, () => {})
  t.is(settings.dist, t.context.sitePath)
  t.is(settings.framework, undefined)
  t.is(settings.command, undefined)
  t.truthy(settings.port)
  t.truthy(settings.frameworkPort)
  t.is(settings.useStaticServer, true)
})
