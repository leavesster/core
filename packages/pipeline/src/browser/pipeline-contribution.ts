import { Autowired } from '@opensumi/di';
import {
  localize,
  Domain,
  IExtensionsPointService,
  formatLocalize,
  ClientAppContribution,
} from '@opensumi/ide-core-browser';
import { getIcon } from '@opensumi/ide-core-browser';
import { browserViews } from '@opensumi/ide-core-browser/lib/extensions/schema/browserViews';
import { ComponentContribution, ComponentRegistry } from '@opensumi/ide-core-browser/lib/layout';

import { Pipeline } from './pipeline.view';

export const PIPELINE_CONTAINER_ID = 'pipeline';

@Domain(ClientAppContribution, ComponentContribution)
export class PipelineContribution implements ComponentContribution {
  @Autowired(IExtensionsPointService)
  protected readonly extensionsPointService: IExtensionsPointService;

  // Explorer 只注册容器
  registerComponent(registry: ComponentRegistry) {
    registry.register('@oomol/pipeline', [], {
      iconClass: getIcon('explorer'),
      title: localize('pipeline.title'),
      priority: 10,
      component: Pipeline,
      containerId: PIPELINE_CONTAINER_ID,
    });
  }

  onStart() {
    this.extensionsPointService.appendExtensionPoint(['browserViews', 'properties'], {
      extensionPoint: PIPELINE_CONTAINER_ID,
      frameworkKind: ['opensumi'],
      jsonSchema: {
        ...browserViews.properties,
        description: formatLocalize('sumiContributes.browserViews.location.custom', localize('pipeline.title')),
      },
    });
  }
}
