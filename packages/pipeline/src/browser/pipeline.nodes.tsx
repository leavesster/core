import React from 'react';

// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
export type NodeInfo = {
  id: string;
  name: string;
  description: string;
  type: string;
};

export const NodeView = React.memo((info: NodeInfo) => (
  <div>
    <div>{info.name}</div>
    <div>{info.description}</div>
  </div>
));
