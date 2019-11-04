import * as React from 'react';
import { useInjectable, URI } from '@ali/ide-core-browser';
import { IWorkspaceService } from '@ali/ide-workspace';
import { Path } from '@ali/ide-core-common/lib/path';
import Icon from '@ali/ide-core-browser/lib/components/icon';
import { getIcon } from '@ali/ide-core-browser/lib/icon';

import * as styles from './navigation.module.less';
import { IResource, IEditorGroup } from '../common';

export const NavigationBar = (({ editorGroup }: { editorGroup: IEditorGroup }) => {

  const workspaceService = useInjectable(IWorkspaceService) as IWorkspaceService;

  if (!workspaceService.workspace || editorGroup.resources.length === 0) {
    return null;
  }

  const topRoot: URI = new URI(workspaceService.workspace!.uri);
  const parts = !editorGroup.currentResource ? [ topRoot.displayName ] : getParts(editorGroup.currentResource, topRoot);

  return (parts.length === 0 ? null : <div className={styles.navigation_container}><div className={styles.navigation}>
    {
      parts.map((p, i) => {
        return <React.Fragment key={i}>
          {i > 0 && <Icon icon={'right'} size='small' /> }
          <span className={styles['navigation-part']}>
            {p}
          </span>
        </React.Fragment>;
      })
    }
  </div></div>);
});

function getParts(resource: IResource, root: URI): string[] {
  if (resource.uri.scheme === 'file') {
    const relative = root.relative(resource.uri);
    const parts =  relative ? relative.toString().split(Path.separator) : [ resource.name ];
    parts.unshift(root.displayName);
    return parts;
  }
  return [];
}

export interface IPart {
  name: string;
  iconClass: string;
}
