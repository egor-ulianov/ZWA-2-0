import React from 'react';

export default function TestImage({ priority: _priority, unoptimized: _unoptimized, ...props }) {
  return React.createElement('img', props);
}
