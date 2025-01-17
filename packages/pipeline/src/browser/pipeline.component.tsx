import { observer } from 'mobx-react-lite';
import React from 'react';

import { ViewState } from '@opensumi/ide-core-browser';

import { PipelineView } from './pipeline.view';

export const PipelineComponent = React.memo(
  observer(({ viewState }: React.PropsWithChildren<{ viewState: ViewState }>) => {
    const data = {
      pipelines: [
        {
          id: '1',
          name: 'Pipeline 1',
          description: 'Pipeline 1 description',
          nodes: [
            {
              id: '1',
              name: 'Node 1',
              description: 'Node 1 description',
              type: 'node',
            },
          ],
        },
        {
          id: '2',
          name: 'Pipeline 2',
          description: 'Pipeline 2 description',
          nodes: [
            {
              id: '2',
              name: 'Node 2',
              description: 'Node 2 description',
              type: 'node',
            },
          ],
        },
      ],
    };
    const pipelines = data.pipelines.map((pipeline) => <PipelineView {...pipeline} />);
    return <div>{pipelines}</div>;
  }),
);
