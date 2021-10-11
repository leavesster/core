import * as path from 'path';
import { Uri } from '@ali/ide-core-common';
import { IExtensionProps } from '../src/common';
import { IExtensionDescription, ExtensionIdentifier } from '../src/common/vscode';

// 临时绕过
export const mockExtensionProps: IExtensionProps & { uri?: Uri } = {
  name: 'kaitian-extension',
  id: 'test.kaitian-extension',
  activated: false,
  enabled: true,
  path: path.join(__dirname, 'extension'),
  realPath: '/home/.kaitian/extensions/test.kaitian-extension-1.0.0',
  uri: Uri.file(path.join(__dirname, 'extension')).toJSON() as Uri,
  extensionId: 'uuid-for-test-extension',
  extensionLocation: Uri.file(path.join(__dirname, 'extension')),
  isUseEnable: true,
  enableProposedApi: true,
  isBuiltin: false,
  packageJSON: {
    name: 'kaitian-extension',
    main: './index.js',
    version: '0.0.1',
  },
  extendConfig: {
    node: {
      main: './node.js',
    },
    worker: {
      main: './worker.js',
    },
    componentId: ['FakeComponentId'],
  },
  workerScriptPath: 'http://some-host/__mocks__/extension/worker.js',
  extraMetadata: {},
  packageNlsJSON: {},
  defaultPkgNlsJSON: {},
};

export const mockExtensionProps2: IExtensionProps = {
  ...mockExtensionProps,
  extendConfig: {},
  path: path.join(__dirname, 'extension-error'),
  name: 'kaitian-extension-error',
  id: 'test.kaitian-extension-error',
  extensionId: 'uuid-for-test-extension-2',
  extensionLocation: Uri.file(path.join(__dirname, 'extension-error')),
  workerScriptPath: 'http://some-host/__mocks__/extension-error/worker.error.js',
  packageJSON: {
    name: 'kaitian-extension-error',
    main: './index.js',
    version: '0.0.1',
    kaitianContributes: {
      viewsProxies: ['FakeComponentId'],
      nodeMain: './index.js',
      workerMain: './worker.error.js',
    },
  },
};

export const mockExtension: IExtensionDescription = {
  ...mockExtensionProps,
  identifier: new ExtensionIdentifier(mockExtensionProps.id),
  isUnderDevelopment: false,
  publisher: mockExtensionProps.packageJSON.publisher,
  version: mockExtensionProps.packageJSON.version,
  engines: mockExtensionProps.packageJSON.engines,
  contributes: mockExtensionProps.packageJSON.contributes,
};

export const mockExtensions: IExtensionDescription[] = [mockExtension];