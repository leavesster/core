import React from 'react';

import { NodeInfo, NodeView } from './pipeline.nodes';

// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
type PipelineInfo = {
  id: string;
  name: string;
  description: string;
  nodes: NodeInfo[];
};
export const PipelineView = React.memo((pipelineInfo: PipelineInfo) => {
  const [folded, setFolded] = React.useState(true);
  return (
    <div>
      {folded && <div>click</div>}
      {!folded && (
        <div>
          <div>name: {pipelineInfo.name}</div>
          <div>description: {pipelineInfo.description}</div>
          {pipelineInfo.nodes.map((nodeInfo) => (
            <NodeView {...nodeInfo} />
          ))}
        </div>
      )}
      <button onClick={() => setFolded(!folded)}>{folded ? '点击展开' : '点击缩放'}</button>
    </div>
  );
});
